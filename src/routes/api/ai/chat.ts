import { createFileRoute } from "@tanstack/react-router";
import { requireUser } from "@/lib/server/auth";
import { requireEnv } from "@/lib/server/env";
import { deepseekJson } from "@/lib/server/deepseek";

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

export const Route = createFileRoute("/api/ai/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const env = requireEnv();
        const user = await requireUser(env, request);

        let body: any;
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "invalid_json" }, { status: 400 });
        }

        const { messages, model, apiKey, modelId, apiEndpoint } = body ?? {};

        if (!messages || !Array.isArray(messages)) {
          return Response.json({ error: "invalid_messages" }, { status: 400 });
        }

        // 构建请求
        const provider = AI_ENDPOINTS[model] || AI_ENDPOINTS.deepseek;
        const endpoint = model === "openai" && apiEndpoint ? apiEndpoint : provider.url;
        const headers = provider.headers ? provider.headers(apiKey) : {};

        try {
          if (model === "gemini") {
            // Gemini API format
            const geminiModel = modelId || "gemini-flash-latest";
            const contents = messages
              .filter((m: any) => m.role === "user" || m.role === "assistant")
              .map((m: any) => ({
                role: m.role === "assistant" ? "model" : "user",
                parts: [{ text: m.content }],
              }));

            const geminiResponse = await fetch(
              `${provider.url}/${geminiModel}:generateContent?key=${apiKey}`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  contents,
                  generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 2048,
                  },
                }),
              }
            );

            if (!geminiResponse.ok) {
              const error = await geminiResponse.text();
              console.error("[gemini] error:", error);
              return Response.json(
                { error: "gemini_error", message: "Gemini API 调用失败" },
                { status: 502 }
              );
            }

            const geminiData = await geminiResponse.json();
            const content = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";

            return Response.json({
              choices: [{ message: { content } }],
            });
          } else {
            // OpenAI-compatible format (DeepSeek, Doubao, OpenAI)
            const response = await fetch(endpoint, {
              method: "POST",
              headers,
              body: JSON.stringify({
                model: modelId || "deepseek-chat",
                messages,
                temperature: 0.7,
                max_tokens: 2048,
              }),
            });

            if (!response.ok) {
              const error = await response.text();
              console.error(`[${model}] error:`, error);
              return Response.json(
                { error: "upstream_error", message: `${model} API 调用失败` },
                { status: 502 }
              );
            }

            return response.json();
          }
        } catch (e: any) {
          console.error("[ai/chat] error:", e);
          return Response.json(
            { error: "request_failed", message: String(e?.message ?? e) },
            { status: 500 }
          );
        }
      },
    },
  },
});
