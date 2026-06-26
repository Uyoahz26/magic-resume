/**
 * 占位 middleware 工厂。
 */

export function createMiddleware(): {
  (request: Request, next: () => Response | Promise<Response>): Response | Promise<Response>;
} {
  return async (_request, next) => next();
}
