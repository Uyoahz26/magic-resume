import { createFileRoute } from "@tanstack/react-router";
import { getEnv } from "@/lib/server/env";

const AI_ENDPOINTS: Record<string, { url: string; headers?: (key: string) => Record<string, string> }> = {
  deepseek: {
    url: "https://api.deepseek.com/v1/chat/completions",
    headers: (key) => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    }),
  },
  doubao: {
    url: "https://ark.cn-beijing.volces.com/api/v3/chat/completions",
    headers: (key) => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    }),
  },
  openai: {
    url: "", // will be overridden by apiEndpoint
    headers: (key) => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    }),
  },
  gemini: {
    url: "https://generativelanguage.googleapis.com/v1beta/models",
    headers: () => ({
      "Content-Type": "application/json",
    }),
  },
};

// Test models for each provider
const TEST_MODEL_IDS: Record<string, string> = {
  deepseek: "deepseek-chat",
  doubao: "doubao-pro-32k",
  openai: "gpt-4o-mini",
  gemini: "gemini-flash-latest",
};

function normalizeOpenAIEndpoint(value?: unknown): string {
  const raw = typeof value === "string" && value.trim()
    ? value.trim()
    : "https://api.openai.com/v1";
  const endpoint = raw.replace(/\/+$/, "");
  return endpoint.endsWith("/chat/completions")
    ? endpoint
    : `${endpoint}/chat/completions`;
}

export const Route = createFileRoute("/api/ai/test")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: any;
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "invalid_json" }, { status: 400 });
        }

        const { model, apiKey, modelId, apiEndpoint } = body ?? {};
        const env = getEnv();
        const effectiveApiKey = model === "deepseek" && env.DEEPSEEK_API_KEY
          ? env.DEEPSEEK_API_KEY
          : typeof apiKey === "string" ? apiKey.trim() : "";

        if (!model || !effectiveApiKey) {
          return Response.json({ error: "missing_params" }, { status: 400 });
        }

        const provider = AI_ENDPOINTS[model];
        if (!provider) {
          return Response.json({ error: "invalid_model" }, { status: 400 });
        }

        const endpoint = model === "openai" ? normalizeOpenAIEndpoint(apiEndpoint) : provider.url;
        const headers = provider.headers ? provider.headers(effectiveApiKey) : {};
        const testModelId = model === "deepseek"
          ? env.DEEPSEEK_MODEL || modelId || TEST_MODEL_IDS[model]
          : modelId || TEST_MODEL_IDS[model] || "deepseek-chat";

        try {
          if (model === "gemini") {
            const testResponse = await fetch(
              `${provider.url}/${testModelId}:generateContent?key=${encodeURIComponent(effectiveApiKey)}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  contents: [{ role: "user", parts: [{ text: "Hi" }] }],
                  generationConfig: { maxOutputTokens: 10 },
                }),
              }
            );

            if (!testResponse.ok) {
              const error = await testResponse.text();
              console.error(`[gemini] test error:`, error);
              return Response.json(
                { error: "test_failed", message: "Gemini API 连接失败" },
                { status: 502 }
              );
            }

            return Response.json({ success: true });
          } else {
            // OpenAI-compatible format (DeepSeek, Doubao, OpenAI)
            const response = await fetch(endpoint, {
              method: "POST",
              headers,
              body: JSON.stringify({
                model: testModelId,
                messages: [{ role: "user", content: "Hi" }],
                max_tokens: 10,
              }),
            });

            if (!response.ok) {
              const error = await response.text();
              console.error(`[${model}] test error:`, error);
              return Response.json(
                { error: "test_failed", message: `${model} API 连接失败` },
                { status: 502 }
              );
            }

            return Response.json({ success: true });
          }
        } catch (e: any) {
          console.error("[ai/test] error:", e);
          return Response.json(
            { error: "request_failed", message: String(e?.message ?? e) },
            { status: 500 }
          );
        }
      },
    },
  },
});
