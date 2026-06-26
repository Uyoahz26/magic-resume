/**
 * 认证 / 会话管理
 *
 * - 密码用 bcryptjs 哈希(Workers 友好)
 * - session 存 D1,客户端只持有 32B hex id(cookie)
 * - 提供 getCurrentUser / requireUser / requireAdmin
 */

import bcrypt from "bcryptjs";
import { getCookie, setCookie, deleteCookie } from "./cookie";
import type { AppEnv, UserRow } from "./db";
import { now, randomId, randomSessionId } from "./db";

export const SESSION_COOKIE = "mr_session";
const SESSION_DAYS = 30;
export const SESSION_MS = SESSION_DAYS * 86_400_000;

// =========================
// 密码
// =========================

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(
  plain: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// =========================
// Session
// =========================

export interface CurrentUser {
  id: string;
  email: string;
  name: string | null;
}

export type AuthResult =
  | { kind: "anon" }
  | { kind: "user"; user: CurrentUser }
  | { kind: "banned"; user: CurrentUser };

export async function createSession(
  env: AppEnv,
  userId: string,
  userAgent?: string
): Promise<string> {
  const id = randomSessionId();
  const expires = now() + SESSION_MS;
  await env.DB.prepare(
    "INSERT INTO sessions(id, user_id, expires_at, created_at, user_agent) VALUES(?, ?, ?, ?, ?)"
  )
    .bind(id, userId, expires, now(), userAgent ?? null)
    .run();
  return id;
}

export async function destroySession(
  env: AppEnv,
  request: Request
): Promise<void> {
  const sid = getCookie(request, SESSION_COOKIE);
  if (sid) {
    await env.DB.prepare("DELETE FROM sessions WHERE id = ?")
      .bind(sid)
      .run();
  }
}

/**
 * 从 cookie 解析当前用户
 *
 * 不存在/已过期 → { kind: "anon" }
 * 已登录但被封禁 → { kind: "banned" }
 * 正常 → { kind: "user", user }
 */
export async function getCurrentUser(
  env: AppEnv,
  request: Request
): Promise<AuthResult> {
  const sid = getCookie(request, SESSION_COOKIE);
  if (!sid) return { kind: "anon" };

  const row = await env.DB.prepare(
    `SELECT u.id, u.email, u.name, u.is_banned, s.expires_at
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.id = ?`
  )
    .bind(sid)
    .first<{
      id: string;
      email: string;
      name: string | null;
      is_banned: number;
      expires_at: number;
    }>();

  if (!row) return { kind: "anon" };

  // 过期清理
  if (row.expires_at < now()) {
    await env.DB.prepare("DELETE FROM sessions WHERE id = ?")
      .bind(sid)
      .run();
    return { kind: "anon" };
  }

  const user: CurrentUser = {
    id: row.id,
    email: row.email,
    name: row.name,
  };

  if (row.is_banned) return { kind: "banned", user };
  return { kind: "user", user };
}

/** 在响应头里写 session cookie */
export function attachSessionCookie(
  headers: Headers,
  sid: string
): void {
  setCookie(headers, SESSION_COOKIE, sid, {
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    path: "/",
    maxAge: SESSION_DAYS * 86_400,
  });
}

/** 在响应头里清 session cookie */
export function clearSessionCookie(headers: Headers): void {
  deleteCookie(headers, SESSION_COOKIE, { path: "/" });
}

// =========================
// 守卫
// =========================

/**
 * 强制要求登录,否则抛 401 Response
 * 用法: const user = await requireUser(env, request);
 */
export async function requireUser(
  env: AppEnv,
  request: Request
): Promise<CurrentUser> {
  const result = await getCurrentUser(env, request);
  if (result.kind === "anon") {
    throw new Response(
      JSON.stringify({ error: "unauthorized" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }
  if (result.kind === "banned") {
    throw new Response(
      JSON.stringify({ error: "banned" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }
  return result.user;
}

// =========================
// 校验
// =========================

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: unknown): email is string {
  return typeof email === "string" && email.length <= 254 && EMAIL_RE.test(email);
}

export function validatePassword(pw: unknown): pw is string {
  return typeof pw === "string" && pw.length >= 8 && pw.length <= 128;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

// =========================
// 注册
// =========================

export class EmailExistsError extends Error {
  constructor() {
    super("email_exists");
  }
}

export async function registerUser(
  env: AppEnv,
  email: string,
  password: string,
  name?: string
): Promise<UserRow> {
  const hash = await hashPassword(password);
  const id = randomId();
  const t = now();
  try {
    await env.DB.prepare(
      `INSERT INTO users(id, email, password_hash, name, created_at, updated_at, is_banned)
       VALUES(?, ?, ?, ?, ?, ?, 0)`
    )
      .bind(id, email, hash, name ?? null, t, t)
      .run();
  } catch (e: any) {
    const msg = String(e?.message ?? e);
    if (msg.includes("UNIQUE") && msg.includes("users.email")) {
      throw new EmailExistsError();
    }
    throw e;
  }
  // 初始化 AI 配额
  const nextReset = new Date();
  nextReset.setMonth(nextReset.getMonth() + 1, 1);
  nextReset.setHours(0, 0, 0, 0);
  const monthlyLimit = parseInt(env.AI_MONTHLY_LIMIT ?? "200", 10) || 200;
  await env.DB.prepare(
    `INSERT OR IGNORE INTO ai_quota(user_id, monthly_limit, used, reset_at)
     VALUES(?, ?, 0, ?)`
  )
    .bind(id, monthlyLimit, nextReset.getTime())
    .run();

  const row = await env.DB.prepare("SELECT * FROM users WHERE id = ?")
    .bind(id)
    .first<UserRow>();
  if (!row) throw new Error("register_failed");
  return row;
}

export async function findUserByEmail(
  env: AppEnv,
  email: string
): Promise<UserRow | null> {
  return env.DB.prepare("SELECT * FROM users WHERE email = ?")
    .bind(email.toLowerCase())
    .first<UserRow>();
}

export async function findUserById(
  env: AppEnv,
  id: string
): Promise<UserRow | null> {
  return env.DB.prepare("SELECT * FROM users WHERE id = ?")
    .bind(id)
    .first<UserRow>();
}
