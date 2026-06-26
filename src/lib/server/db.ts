/**
 * D1 访问封装
 *
 * 在 Cloudflare Workers 中,env.DB 是 D1Database 实例。
 * 本文件只做类型约束 + 通用 helper,避免散落 .prepare().bind()。
 */

/** 用户表行类型 */
export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  name: string | null;
  created_at: number;
  updated_at: number;
  is_banned: number;        // 0 | 1
  ban_reason: string | null;
}

/** 会话表行类型 */
export interface SessionRow {
  id: string;
  user_id: string;
  expires_at: number;
  created_at: number;
  user_agent: string | null;
}

/** 简历元数据行类型 */
export interface ResumeMetaRow {
  id: string;
  user_id: string;
  title: string;
  template_id: string | null;
  updated_at: number;
  created_at: number;
  cos_key: string;
  size: number;
}

/** AI 配额行类型 */
export interface AIQuotaRow {
  user_id: string;
  monthly_limit: number;
  used: number;
  reset_at: number;
}

/** Cloudflare Workers Env (按需扩展) */
export interface AppEnv {
  DB: D1Database;
  DEEPSEEK_API_KEY?: string;
  DEEPSEEK_MODEL?: string;
  TENCENT_COS_REGION?: string;
  TENCENT_COS_BUCKET?: string;
  TENCENT_COS_SCHEME?: string;
  TENCENT_COS_SECRET_ID?: string;
  TENCENT_COS_SECRET_KEY?: string;
  AI_MONTHLY_LIMIT?: string;
}

/** 生成一个 uuid-like 的随机字符串(用作 user_id / resume_id) */
export function randomId(): string {
  return crypto.randomUUID();
}

/** 生成 32 字节 hex,用作 session id */
export function randomSessionId(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  let s = "";
  for (let i = 0; i < bytes.length; i++) {
    s += bytes[i].toString(16).padStart(2, "0");
  }
  return s;
}

/** 把 env.AI_MONTHLY_LIMIT 字符串转成 number,默认 200 */
export function getMonthlyLimit(env: AppEnv): number {
  const v = parseInt(env.AI_MONTHLY_LIMIT ?? "200", 10);
  return Number.isFinite(v) && v > 0 ? v : 200;
}

/** 当前时间戳(ms) */
export function now(): number {
  return Date.now();
}

/** 下个月 1 号 0 点的时间戳 */
export function nextMonthResetAt(): number {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime();
}
