import { createFileRoute } from "@tanstack/react-router";
import { requireUser } from "@/lib/server/auth";
import {
  deleteResume as cosDelete,
  getResume as cosGet,
  listResumes as cosList,
  resumeKey,
} from "@/lib/server/cos";
import { requireEnv } from "@/lib/server/env";

const UUID_RE = /^[a-zA-Z0-9-]{1,64}$/;

export const Route = createFileRoute("/api/resumes/list")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const env = requireEnv();
        const user = await requireUser(env, request);

        try {
          const keys = await cosList(env, user.id);
          // 并发拉取每份简历的 JSON
          const items = await Promise.all(
            keys.map(async (key) => {
              const resumeId = key.split("/").pop()?.replace(/\.json$/, "");
              if (!resumeId) return null;
              const data = (await cosGet(env, user.id, resumeId)) as any;
              if (!data || typeof data !== "object") return null;
              const meta = await env.DB.prepare(
                `SELECT id, title, template_id, updated_at, created_at
                 FROM resumes_meta WHERE id = ? AND user_id = ?`
              )
                .bind(resumeId, user.id)
                .first<{
                  id: string;
                  title: string;
                  template_id: string | null;
                  updated_at: number;
                  created_at: number;
                }>();
              return {
                id: resumeId,
                title: meta?.title ?? data.title ?? "未命名简历",
                templateId: meta?.template_id ?? data.templateId ?? null,
                updatedAt: meta?.updated_at ?? null,
                createdAt: meta?.created_at ?? null,
                data,
              };
            })
          );

          return Response.json({
            items: items.filter(Boolean),
          });
        } catch (e) {
          console.error("[resumes/list] error:", e);
          return Response.json({ error: "list_failed" }, { status: 500 });
        }
      },

      // DELETE 用 ?id= 删单条 (内部 API,可被 UI 调)
      DELETE: async ({ request }) => {
        const env = requireEnv();
        const user = await requireUser(env, request);
        const url = new URL(request.url);
        const id = url.searchParams.get("id");
        if (!id || !UUID_RE.test(id)) {
          return Response.json({ error: "invalid_id" }, { status: 400 });
        }
        try {
          await env.DB.prepare(
            "DELETE FROM resumes_meta WHERE id = ? AND user_id = ?"
          )
            .bind(id, user.id)
            .run();
          await cosDelete(env, user.id, id);
          return Response.json({ ok: true });
        } catch (e) {
          console.error("[resumes/delete] error:", e);
          return Response.json({ error: "delete_failed" }, { status: 500 });
        }
      },
    },
  },
});
