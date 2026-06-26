/**
 * i18n 兼容层 - middleware (stub)
 *
 * 不再做任何 locale 路由切换,直接通过。
 */

import { createMiddleware } from "@/lib/server/middleware-stub";

export default createMiddleware();

export const config = {
  matcher: [],
};
