import { createFileRoute } from "@tanstack/react-router";
import { requireUser } from "@/lib/server/auth";

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
  deepseek: "deepseek-v4-flash",
  doubao: "doubao-pro-32k",
  openai: "gpt-4o-mini",
  gemini: "gemini-flash-latest",
};

export const Route = createFileRoute("/api/ai/test")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Auth check
        try {
          const authHeader = request.headers.get("Authorization");
          if (!authHeader) {
            // For test endpoint, we may not have full auth - just check content-type
            const contentType = request.headers.get("Content-Type");
            if (!contentType?.includes("application/json")) {
              return Response.json({ error: "invalid_request" }, { status: 400 });
            }
          }
        } catch {
          // Continue with test even if auth fails
        }

        let body: any;
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "invalid_json" }, { status: 400 });
        }

        const { model, apiKey, modelId, apiEndpoint } = body ?? {};

        if (!model || !apiKey) {
          return Response.json({ error: "missing_params" }, { status: 400 });
        }

        const provider = AI_ENDPOINTS[model];
        if (!provider) {
          return Response.json({ error: "invalid_model" }, { status: 400 });
        }

        const endpoint = model === "openai" && apiEndpoint ? apiEndpoint : provider.url;
        const headers = provider.headers ? provider.headers(apiKey) : {};
        const testModelId = modelId || TEST_MODEL_IDS[model] || "deepseek-v4-flash";

        try {
          if (model === "gemini") {
            const testResponse = await fetch(
              `${provider.url}/${testModelId}:generateContent?key=${apiKey}`,
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
