/**
 * AI 模型配置 (服务端配置已接管)
 *
 * 此处仅保留类型导出,客户端不再使用 API key 配置。
 * 历史组件如 AIPolishDialog 等仍可能 import 此处的类型,但已无运行逻辑。
 */

export type AIModelType = "deepseek";

export interface AIModelConfig {
  url: () => string;
  requiresModelId: boolean;
  defaultModel?: string;
  headers: (apiKey: string) => Record<string, string>;
  validate: (ctx: { apiKey?: string }) => boolean;
}

export const AI_MODEL_CONFIGS: Record<AIModelType, AIModelConfig> = {
  deepseek: {
    url: () => "https://api.deepseek.com/v1/chat/completions",
    requiresModelId: false,
    defaultModel: "deepseek-chat",
    headers: (apiKey: string) => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    }),
    validate: (ctx) => !!ctx.apiKey,
  },
};

/** 历史兼容:旧组件可能读取这些键,但实际不再使用 */
export interface AIValidationContext {
  apiKey?: string;
  model?: string;
}
