/**
 * DeepSeek API 客户端
 *
 * 配置:
 *   env.DEEPSEEK_API_KEY   (wrangler secret put DEEPSEEK_API_KEY)
 *   env.DEEPSEEK_MODEL     (默认 "deepseek-chat")
 */

import type { AppEnv } from "./db";

const API_URL = "https://api.deepseek.com/chat/completions";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

function getConfig(env: AppEnv) {
  const apiKey = env.DEEPSEEK_API_KEY;
  const model = env.DEEPSEEK_MODEL ?? "deepseek-chat";
  if (!apiKey) {
    throw new Error(
      "[deepseek] DEEPSEEK_API_KEY 未设置,请用 wrangler secret put DEEPSEEK_API_KEY 注入",
    );
  }
  return { apiKey, model };
}

/** 流式对话(SSE),返回 ReadableStream<Uint8Array> */
export async function deepseekStream(
  env: AppEnv,
  messages: ChatMessage[],
  opts?: { temperature?: number },
): Promise<ReadableStream<Uint8Array>> {
  const { apiKey, model } = getConfig(env);
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
      temperature: opts?.temperature ?? 0.4,
    }),
  });
  if (!res.ok || !res.body) {
    const t = await res.text().catch(() => "");
    throw new Error(`[deepseek stream] ${res.status} ${t.slice(0, 300)}`);
  }
  return res.body;
}

/** JSON 模式对话(返回完整 JSON object) */
export async function deepseekJson(
  env: AppEnv,
  messages: ChatMessage[],
  opts?: { temperature?: number },
): Promise<unknown> {
  const { apiKey, model } = getConfig(env);
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
      temperature: opts?.temperature ?? 0,
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`[deepseek json] ${res.status} ${t.slice(0, 300)}`);
  }
  return res.json();
}
