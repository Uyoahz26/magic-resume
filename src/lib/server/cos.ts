/**
 * 腾讯云 COS (Cloud Object Storage) 客户端
 *
 * 不引官方 SDK,直接用 Web Crypto API 计算 HMAC-SHA1 签名后 fetch。
 *
 * 用法:
 *   await putResume(env, userId, resumeId, json);
 *   const data = await getResume(env, userId, resumeId);
 *   const keys = await listResumes(env, userId);
 *   await deleteResume(env, userId, resumeId);
 *
 * 配置 (通过 wrangler [vars]):
 *   TENCENT_COS_REGION       例:ap-shanghai
 *   TENCENT_COS_BUCKET       例:magic-resume-1300000000
 *   TENCENT_COS_SCHEME       https (默认)
 * Secrets (通过 wrangler secret put):
 *   TENCENT_COS_SECRET_ID
 *   TENCENT_COS_SECRET_KEY
 */

import type { AppEnv } from "./db";

const ALGO = "sha1" as const;

function getCosConfig(env: AppEnv) {
  const region = env.TENCENT_COS_REGION;
  const bucket = env.TENCENT_COS_BUCKET;
  const scheme = env.TENCENT_COS_SCHEME ?? "https";
  const secretId = env.TENCENT_COS_SECRET_ID;
  const secretKey = env.TENCENT_COS_SECRET_KEY;
  if (!region || !bucket || !secretId || !secretKey) {
    throw new Error(
      "[cos] missing config: TENCENT_COS_REGION / TENCENT_COS_BUCKET / TENCENT_COS_SECRET_ID / TENCENT_COS_SECRET_KEY"
    );
  }
  return {
    region,
    bucket,
    scheme,
    secretId,
    secretKey,
    host: `${bucket}.cos.${region}.myqcloud.com`,
  };
}

// =========================
// Web Crypto helpers
// =========================

function toHex(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.length; i++) {
    s += bytes[i].toString(16).padStart(2, "0");
  }
  return s;
}

async function sha1Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    ALGO,
    new TextEncoder().encode(s)
  );
  return toHex(buf);
}

async function hmacSha1(
  key: ArrayBuffer | string,
  msg: string
): Promise<ArrayBuffer> {
  const keyData =
    typeof key === "string"
      ? new TextEncoder().encode(key)
      : new Uint8Array(key);
  const k = await crypto.subtle.importKey(
    "raw",
    keyData as BufferSource,
    { name: "HMAC", hash: ALGO },
    false,
    ["sign"]
  );
  return crypto.subtle.sign("HMAC", k, new TextEncoder().encode(msg) as BufferSource);
}

async function hmacSha1Hex(
  key: ArrayBuffer | string,
  msg: string
): Promise<string> {
  const buf = await hmacSha1(key, msg);
  return toHex(buf);
}

// =========================
// 一次性签名 (v5, sha1)
// 文档: https://cloud.tencent.com/document/product/436/7778
// =========================

interface SignOpts {
  method: "GET" | "POST" | "PUT" | "DELETE" | "HEAD";
  path: string;
  query?: Record<string, string | number | undefined>;
  headers?: Record<string, string>;
  /** 签名有效期,默认 600s */
  expireSeconds?: number;
}

async function signOnce(
  env: AppEnv,
  opts: SignOpts
): Promise<{ authorization: string; keyTime: string }> {
  const cfg = getCosConfig(env);
  const now = Math.floor(Date.now() / 1000);
  const expire = opts.expireSeconds ?? 600;
  const keyTime = `${now - 60};${now + expire}`;
  const signKey = await hmacSha1(cfg.secretKey, keyTime);

  // query
  const query: Record<string, string> = {};
  for (const [k, v] of Object.entries(opts.query ?? {})) {
    if (v !== undefined && v !== null) query[k] = String(v);
  }

  // headers
  const headers: Record<string, string> = { Host: cfg.host };
  for (const [k, v] of Object.entries(opts.headers ?? {})) {
    if (v !== undefined && v !== null) headers[k.toLowerCase()] = String(v);
  }
  // 必须包含 Content-Type(如果有) 或 Content-Length
  // 空 headers 时也要保持 Host

  // 按 key 字典序排序
  const queryKeys = Object.keys(query).sort();
  const headerKeys = Object.keys(headers).sort();

  const httpString = [
    opts.method.toLowerCase(),
    opts.path,
    queryKeys.map((k) => `${k}=${query[k]}`).join("&"),
    headerKeys.map((k) => `${k}=${headers[k]}`).join("&"),
  ].join("\n");

  const httpHeaders = headerKeys.join(";");
  const stringToSign = [
    "sha1",
    keyTime,
    await sha1Hex(httpString),
    httpHeaders,
  ].join("\n");

  const signature = await hmacSha1Hex(signKey, stringToSign);

  const authorization = [
    "q-sign-algorithm=sha1",
    `q-ak=${cfg.secretId}`,
    `q-sign-time=${keyTime}`,
    `q-key-time=${keyTime}`,
    `q-header-list=${httpHeaders}`,
    `q-url-param-list=${queryKeys.join(";")}`,
    `q-signature=${signature}`,
  ].join("&");

  return { authorization, keyTime };
}

// =========================
// fetch wrapper
// =========================

async function cosRequest(
  env: AppEnv,
  method: SignOpts["method"],
  path: string,
  init?: {
    query?: SignOpts["query"];
    headers?: Record<string, string>;
    body?: BodyInit | null;
  }
): Promise<Response> {
  const cfg = getCosConfig(env);
  // 计算 content-length(若有 body)
  const extraHeaders: Record<string, string> = { ...(init?.headers ?? {}) };
  if (init?.body != null && !extraHeaders["Content-Length"]) {
    let len: number;
    if (typeof init.body === "string") len = new TextEncoder().encode(init.body).length;
    else if (init.body instanceof ArrayBuffer) len = init.body.byteLength;
    else if (init.body instanceof Uint8Array) len = init.body.byteLength;
    else len = 0;
    if (len > 0) extraHeaders["Content-Length"] = String(len);
  }
  const { authorization } = await signOnce(env, {
    method,
    path,
    query: init?.query,
    headers: extraHeaders,
  });
  const url = `${cfg.scheme}://${cfg.host}${path}`;
  const qs = init?.query
    ? "?" +
      Object.entries(init.query)
        .filter(([, v]) => v !== undefined && v !== null)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join("&")
    : "";
  return fetch(url + qs, {
    method,
    headers: {
      ...extraHeaders,
      Authorization: authorization,
    },
    body: init?.body ?? undefined,
  });
}

// =========================
// 简历存储封装
// =========================

export function resumeKey(userId: string, resumeId: string): string {
  return `users/${userId}/resumes/${resumeId}.json`;
}

/** 列举用户所有简历的 COS Key */
export async function listResumes(
  env: AppEnv,
  userId: string
): Promise<string[]> {
  const prefix = `users/${userId}/resumes/`;
  const res = await cosRequest(env, "GET", "/", {
    query: { prefix, "max-keys": 1000 },
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`[cos list] ${res.status} ${t.slice(0, 200)}`);
  }
  const text = await res.text();
  // 解析 XML 中 <Key>...</Key> 出现位置
  const out: string[] = [];
  const re = /<Key>([^<]+)<\/Key>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) out.push(m[1]);
  return out;
}

/** 拉取单份简历,不存在返回 null */
export async function getResume(
  env: AppEnv,
  userId: string,
  resumeId: string
): Promise<unknown | null> {
  const key = resumeKey(userId, resumeId);
  const res = await cosRequest(env, "GET", `/${key}`);
  if (res.status === 404) return null;
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`[cos get] ${res.status} ${t.slice(0, 200)}`);
  }
  return res.json();
}

/** 上传 / 覆盖一份简历 JSON */
export async function putResume(
  env: AppEnv,
  userId: string,
  resumeId: string,
  data: unknown
): Promise<void> {
  const key = resumeKey(userId, resumeId);
  const body = JSON.stringify(data);
  const res = await cosRequest(env, "PUT", `/${key}`, {
    headers: {
      "Content-Type": "application/json",
    },
    body,
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`[cos put] ${res.status} ${t.slice(0, 200)}`);
  }
}

/** 删除一份简历 */
export async function deleteResume(
  env: AppEnv,
  userId: string,
  resumeId: string
): Promise<void> {
  const key = resumeKey(userId, resumeId);
  const res = await cosRequest(env, "DELETE", `/${key}`);
  // 404 视为已删除
  if (res.status === 404) return;
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`[cos delete] ${res.status} ${t.slice(0, 200)}`);
  }
}
