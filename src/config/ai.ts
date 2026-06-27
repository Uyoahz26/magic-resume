/**
 * AI 模型配置
 */

export type AIModelType = "deepseek" | "doubao" | "openai" | "gemini";

export interface AIModelConfig {
  url: () => string;
  requiresModelId: boolean;
  defaultModel?: string;
  headers: (apiKey: string) => Record<string, string>;
  validate: (ctx: { apiKey?: string; modelId?: string }) => boolean;
}

export const AI_MODEL_CONFIGS: Record<AIModelType, AIModelConfig> = {
  deepseek: {
    url: () => "https://api.deepseek.com/v1/chat/completions",
    requiresModelId: false,
    defaultModel: "deepseek-v4-flash",
    headers: (apiKey: string) => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    }),
    validate: (ctx) => !!ctx.apiKey,
  },
  doubao: {
    url: () => "https://ark.cn-beijing.volces.com/api/v3/chat/completions",
    requiresModelId: true,
    defaultModel: "doubao-pro-32k",
    headers: (apiKey: string) => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    }),
    validate: (ctx) => !!ctx.apiKey && !!ctx.modelId,
  },
  openai: {
    url: () => "https://api.openai.com/v1/chat/completions",
    requiresModelId: true,
    defaultModel: "gpt-4o-mini",
    headers: (apiKey: string) => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    }),
    validate: (ctx) => !!ctx.apiKey && !!ctx.modelId,
  },
  gemini: {
    url: () => "https://generativelanguage.googleapis.com/v1beta/models",
    requiresModelId: true,
    defaultModel: "gemini-flash-latest",
    headers: (_apiKey: string) => ({
      "Content-Type": "application/json",
    }),
    validate: (ctx) => !!ctx.apiKey && !!ctx.modelId,
  },
};

/** 历史兼容:旧组件可能读取这些键,但实际不再使用 */
export interface AIValidationContext {
  apiKey?: string;
  model?: string;
}
