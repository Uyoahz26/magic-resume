/**
 * AI 配额管理
 *
 * - 每个用户一条 ai_quota 记录
 * - 每次成功 AI 调用后 used++
 * - reset_at 跨月自动重置 (由 caller 在 increment 前判断)
 */

import type { AppEnv } from "./db";
import { getMonthlyLimit, now } from "./db";

interface QuotaRow {
  user_id: string;
  monthly_limit: number;
  used: number;
  reset_at: number;
}

/** 读配额,若不存在则惰性初始化 */
export async function getOrInitQuota(
  env: AppEnv,
  userId: string
): Promise<QuotaRow> {
  const row = await env.DB.prepare(
    "SELECT user_id, monthly_limit, used, reset_at FROM ai_quota WHERE user_id = ?"
  )
    .bind(userId)
    .first<QuotaRow>();
  if (row) return row;

  const limit = getMonthlyLimit(env);
  const reset = nextMonthStart();
  await env.DB.prepare(
    `INSERT OR IGNORE INTO ai_quota(user_id, monthly_limit, used, reset_at)
     VALUES(?, ?, 0, ?)`
  )
    .bind(userId, limit, reset)
    .run();
  return { user_id: userId, monthly_limit: limit, used: 0, reset_at: reset };
}

/** 若超额,抛 429 Response */
export async function assertWithinQuota(
  env: AppEnv,
  userId: string
): Promise<QuotaRow> {
  const q = await getOrInitQuota(env, userId);
  // 跨月重置
  if (now() >= q.reset_at) {
    await env.DB.prepare(
      "UPDATE ai_quota SET used = 0, reset_at = ? WHERE user_id = ?"
    )
      .bind(nextMonthStart(), userId)
      .run();
    return { ...q, used: 0, reset_at: nextMonthStart() };
  }
  if (q.used >= q.monthly_limit) {
    throw new Response(
      JSON.stringify({
        error: "quota_exceeded",
        used: q.used,
        limit: q.monthly_limit,
        resetAt: q.reset_at,
      }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
  }
  return q;
}

/** 用一次配额,原子 +1 */
export async function incrementQuota(
  env: AppEnv,
  userId: string
): Promise<QuotaRow> {
  await env.DB.prepare(
    "UPDATE ai_quota SET used = used + 1 WHERE user_id = ?"
  )
    .bind(userId)
    .run();
  return getOrInitQuota(env, userId);
}

/** 写一条 ai_logs(可选,失败仅 warn) */
export async function logAiCall(
  env: AppEnv,
  userId: string,
  fields: {
    kind: "polish" | "grammar";
    model: string;
    durationMs: number;
    status: "ok" | "error";
    errorMsg?: string;
    tokensIn?: number;
    tokensOut?: number;
  }
): Promise<void> {
  try {
    await env.DB.prepare(
      `INSERT INTO ai_logs(user_id, kind, model, tokens_in, tokens_out, duration_ms, status, error_msg, created_at)
       VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        userId,
        fields.kind,
        fields.model,
        fields.tokensIn ?? null,
        fields.tokensOut ?? null,
        fields.durationMs,
        fields.status,
        fields.errorMsg ?? null,
        Date.now()
      )
      .run();
  } catch (e) {
    console.warn("[ai_logs] failed:", e);
  }
}

function nextMonthStart(): number {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime();
}
