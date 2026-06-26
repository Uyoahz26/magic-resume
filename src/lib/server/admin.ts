/**
 * 管理员守卫
 *
 * requireAdmin(env, request) → 必须是登录用户,且在 admins 表中
 */

import { requireUser } from "./auth";
import type { AppEnv } from "./db";

export async function isAdmin(env: AppEnv, userId: string): Promise<boolean> {
  const row = await env.DB.prepare(
    "SELECT 1 AS x FROM admins WHERE user_id = ?"
  )
    .bind(userId)
    .first();
  return !!row;
}

export async function requireAdmin(
  env: AppEnv,
  request: Request
) {
  const user = await requireUser(env, request);
  const ok = await isAdmin(env, user.id);
  if (!ok) {
    throw new Response(
      JSON.stringify({ error: "forbidden" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }
  return user;
}

/** 写入审计日志(可选,失败仅 console.warn 不抛) */
export async function auditLog(
  env: AppEnv,
  actorId: string,
  action: string,
  targetId?: string,
  detail?: unknown
): Promise<void> {
  try {
    await env.DB.prepare(
      `INSERT INTO audit_logs(actor_id, action, target_id, detail, created_at)
       VALUES(?, ?, ?, ?, ?)`
    )
      .bind(
        actorId,
        action,
        targetId ?? null,
        detail ? JSON.stringify(detail) : null,
        Date.now()
      )
      .run();
  } catch (e) {
    console.warn("[audit] failed:", e);
  }
}
