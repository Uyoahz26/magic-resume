import { createFileRoute } from "@tanstack/react-router";
import { requireUser } from "@/lib/server/auth";
import { deepseekStream } from "@/lib/server/deepseek";
import { assertWithinQuota, incrementQuota, logAiCall } from "@/lib/server/ai-quota";
import { requireEnv } from "@/lib/server/env";

const POLISH_SYSTEM_PROMPT = `你是一个专业的简历优化助手。请帮助优化以下 Markdown 格式的文本，使其更加专业和有吸引力。

优化原则：
1. 使用更专业的词汇和表达方式
2. 突出关键成就和技能
3. 保持简洁清晰
4. 使用主动语气
5. 保持原有信息的完整性
6. 严格保留原有的 Markdown 格式结构（列表项保持为列表项，加粗保持加粗等）

输出强约束（必须遵守）：
1. 只能输出"润色后的正文内容"本身。
2. 禁止输出任何前言、说明、总结、附加建议。
3. 禁止出现这类引导语：如"以下是…""根据您提供…""这是…""特点：""说明：""总结："等。
4. 禁止新增与原文无关的章节标题或收尾段落。
5. 不要使用 Markdown 代码块（\`\`\`）包裹结果。
6. 若你产生了解释性内容，必须在输出前自检并删除，只保留最终正文。`;

export const Route = createFileRoute("/api/polish")({
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
        const { content, customInstructions } = body ?? {};
        if (typeof content !== "string" || content.length === 0) {
          return Response.json({ error: "invalid_content" }, { status: 400 });
        }

        // 配额
        try {
          await assertWithinQuota(env, user.id);
        } catch (e) {
          if (e instanceof Response) return e;
          throw e;
        }

        const systemPrompt =
          POLISH_SYSTEM_PROMPT +
          (typeof customInstructions === "string" && customInstructions.trim()
            ? `\n\n用户额外要求：\n${customInstructions.trim()}`
            : "");

        const start = Date.now();
        try {
          const stream = await deepseekStream(env, [
            { role: "system", content: systemPrompt },
            { role: "user", content },
          ]);
          // 成功后再 +1(避免失败扣费)
          await incrementQuota(env, user.id);
          await logAiCall(env, user.id, {
            kind: "polish",
            model: env.DEEPSEEK_MODEL ?? "deepseek-chat",
            durationMs: Date.now() - start,
            status: "ok",
          });
          return new Response(stream, {
            headers: {
              "Content-Type": "text/event-stream",
              "Cache-Control": "no-cache",
              Connection: "keep-alive",
            },
          });
        } catch (e: any) {
          await logAiCall(env, user.id, {
            kind: "polish",
            model: env.DEEPSEEK_MODEL ?? "deepseek-chat",
            durationMs: Date.now() - start,
            status: "error",
            errorMsg: String(e?.message ?? e).slice(0, 200),
          });
          console.error("[polish] error:", e);
          return Response.json(
            { error: "upstream_error", message: String(e?.message ?? e) },
            { status: 502 }
          );
        }
      },
    },
  },
});
