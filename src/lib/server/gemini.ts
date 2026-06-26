/**
 * Gemini 客户端 stub - 已被 DeepSeek 取代
 *
 * 保留这个文件以防旧代码 import 报错,实际功能已废弃。
 */

export function getGeminiModelInstance(_opts: unknown): never {
  throw new Error(
    "Gemini 客户端已废弃,简历导入请改用 /api/resume-import 服务端实现"
  );
}

export function formatGeminiErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  return String(e);
}
