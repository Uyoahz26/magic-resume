/**
 * Cookie 工具 (Workers 原生,无依赖)
 *
 * 用法:
 *   const sid = getCookie(request, "mr_session");
 *   setCookie(headers, "mr_session", id, { ... });
 *   deleteCookie(headers, "mr_session");
 */

export interface CookieOptions {
  maxAge?: number;
  expires?: Date;
  path?: string;
  domain?: string;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: "Lax" | "Strict" | "None";
}

const DEFAULT_PATH = "/";

function formatCookie(
  name: string,
  value: string,
  opts: CookieOptions = {}
): string {
  const parts: string[] = [`${name}=${value}`];
  parts.push(`Path=${opts.path ?? DEFAULT_PATH}`);
  if (opts.maxAge !== undefined) parts.push(`Max-Age=${opts.maxAge}`);
  if (opts.expires) parts.push(`Expires=${opts.expires.toUTCString()}`);
  if (opts.domain) parts.push(`Domain=${opts.domain}`);
  if (opts.secure ?? true) parts.push("Secure");
  if (opts.httpOnly ?? true) parts.push("HttpOnly");
  parts.push(`SameSite=${opts.sameSite ?? "Lax"}`);
  return parts.join("; ");
}

/** 从 Request 的 Cookie 头解析出指定 name 的值 */
export function getCookie(request: Request, name: string): string | null {
  const header = request.headers.get("cookie");
  if (!header) return null;
  const cookies = header.split(";").map((c) => c.trim());
  for (const c of cookies) {
    const eq = c.indexOf("=");
    if (eq < 0) continue;
    const k = c.slice(0, eq).trim();
    if (k === name) return decodeURIComponent(c.slice(eq + 1));
  }
  return null;
}

/** 把 Set-Cookie 头追加到 Headers(支持多次 append) */
export function setCookie(
  headers: Headers,
  name: string,
  value: string,
  opts: CookieOptions = {}
): void {
  headers.append("Set-Cookie", formatCookie(name, value, opts));
}

/** 写一个清除指定 cookie 的 Set-Cookie(将 Max-Age 设为 0) */
export function deleteCookie(
  headers: Headers,
  name: string,
  opts: Omit<CookieOptions, "maxAge" | "expires"> = {}
): void {
  headers.append(
    "Set-Cookie",
    formatCookie(name, "", { ...opts, maxAge: 0 })
  );
}
