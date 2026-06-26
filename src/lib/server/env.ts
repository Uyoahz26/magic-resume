/**
 * 在 TanStack Start + Cloudflare Workers 环境下获取 env
 *
 * 优先级:
 *   1. globalThis.env (Workers 标准)
 *   2. process.env (Node 兼容模式,wrangler dev 也支持)
 *
 * 不依赖 h3 event context,这样在 loader / API handler / 中间件 都能用。
 */

import type { AppEnv } from "./db";

type AnyEnv = Partial<AppEnv> & Record<string, any>;

declare global {
  // eslint-disable-next-line no-var
  var __mr_env__: AnyEnv | undefined;
}

function tryGlobalThis(): AnyEnv | null {
  // Workers 把 env 挂到 globalThis
  // 一些框架会把它命名成别的(globalThis.ENV / globalThis.env)
  const g: any = globalThis as any;
  const e = g?.env ?? g?.ENV ?? g?.CloudflareEnv;
  if (e && typeof e === "object") return e as AnyEnv;
  return null;
}

function tryProcess(): AnyEnv | null {
  try {
    // process 可能不存在 (纯 Workers 模式无 nodejs_compat)
    const p: any = (globalThis as any).process;
    if (!p || !p.env) return null;
    const env = p.env as Record<string, string | undefined>;
    const out: AnyEnv = {};
    for (const [k, v] of Object.entries(env)) {
      if (typeof v === "string") out[k] = v;
    }
    return out;
  } catch {
    return null;
  }
}

export function getEnv(): AnyEnv {
  if (globalThis.__mr_env__) return globalThis.__mr_env__;
  const env = tryGlobalThis() ?? tryProcess() ?? {};
  globalThis.__mr_env__ = env;
  return env;
}

/**
 * 严格要求 D1 binding 存在;否则抛 500
 * API 路由里建议用 requireEnv() 而非 getEnv(),以保证 D1 一定可用
 */
export function requireEnv(): AppEnv {
  const env = getEnv();
  if (!env.DB) {
    throw new Response(
      JSON.stringify({
        error: "server_misconfigured",
        message: "D1 binding DB 不可用,请检查 wrangler.toml",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
  return env as AppEnv;
}
