/**
 * 占位 middleware 工厂,与 i18n 兼容层配合使用。
 */

export function createMiddleware(): {
  (request: Request, next: () => Response | Promise<Response>): Response | Promise<Response>;
} {
  return async (_request, next) => next();
}
