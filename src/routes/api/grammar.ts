import { createFileRoute } from "@tanstack/react-router";
import { requireUser } from "@/lib/server/auth";
import { deepseekJson } from "@/lib/server/deepseek";
import { assertWithinQuota, incrementQuota, logAiCall } from "@/lib/server/ai-quota";
import { requireEnv } from "@/lib/server/env";

const GRAMMAR_SYSTEM_PROMPT = `你是一个专业的中文简历校对助手。你的任务是**仅**找出简历中的**错别字**和**标点符号错误**。

**严格禁止**：
1. ❌ **禁止**提供任何风格、语气、润色或改写建议。如果句子在语法上是正确的（即使读起来不够优美），也**绝对不要**报错。
2. ❌ **禁止**报告"无明显错误"或类似的信息。如果没有发现错别字或标点错误，"errors" 数组必须为空。
3. ❌ **禁止**对专业术语进行过度纠正，除非通过上下文非常确定是打字错误。

**仅检查以下两类错误**：
1. ✅ **错别字**：例如将"作为"写成"做为"，将"经理"写成"经里"。
2. ✅ **严重标点错误**：仅报告重复标点（如"，，"）或完全错误的符号位置。

**重要例外（绝不报错）**：
- ❌ **忽略中英文标点混用**：在技术简历中，中文内容使用英文标点（如使用英文逗号, 代替中文逗号，或使用英文句点. 代替中文句号）是**完全接受**的风格。**绝对不要**报告此类"错误"。
- ❌ **忽略空格使用**：不要报告中英文之间的空格遗漏或多余。

返回格式示例（JSON）：
{
  "errors": [
    {
      "context": "包含错误的完整句子（必须是原文）",
      "text": "具体的错误部分（必须是原文中实际存在的字符串）",
      "suggestion": "仅包含修正后的词汇或片段（**不要**返回整句，除非整句都是错误的）",
      "reason": "错别字 / 标点错误",
      "type": "spelling"
    }
  ]
}

再次强调：**只找错别字和标点错误，不要做任何润色！**`;

export const Route = createFileRoute("/api/grammar")({
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
        const { content } = body ?? {};
        if (typeof content !== "string" || content.length === 0) {
          return Response.json({ error: "invalid_content" }, { status: 400 });
        }

        try {
          await assertWithinQuota(env, user.id);
        } catch (e) {
          if (e instanceof Response) return e;
          throw e;
        }

        const start = Date.now();
        try {
          const data = (await deepseekJson(env, [
            { role: "system", content: GRAMMAR_SYSTEM_PROMPT },
            { role: "user", content },
          ])) as any;

          await incrementQuota(env, user.id);
          await logAiCall(env, user.id, {
            kind: "grammar",
            model: env.DEEPSEEK_MODEL ?? "deepseek-v4-flash",
            durationMs: Date.now() - start,
            status: "ok",
          });

          // 兼容前端 grammar 调用:把 content 包成 OpenAI 风格 choices
          const inner =
            data?.choices?.[0]?.message?.content ??
            (typeof data === "string" ? data : JSON.stringify(data));
          return Response.json({
            choices: [{ message: { content: inner } }],
          });
        } catch (e: any) {
          await logAiCall(env, user.id, {
            kind: "grammar",
            model: env.DEEPSEEK_MODEL ?? "deepseek-v4-flash",
            durationMs: Date.now() - start,
            status: "error",
            errorMsg: String(e?.message ?? e).slice(0, 200),
          });
          console.error("[grammar] error:", e);
          return Response.json(
            { error: "upstream_error", message: String(e?.message ?? e) },
            { status: 502 }
          );
        }
      },
    },
  },
});
