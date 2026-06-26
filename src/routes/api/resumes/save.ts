import { createFileRoute } from "@tanstack/react-router";
import { requireUser } from "@/lib/server/auth";
import { putResume as cosPut, resumeKey } from "@/lib/server/cos";
import { randomId } from "@/lib/server/db";
import { requireEnv } from "@/lib/server/env";

const UUID_RE = /^[a-zA-Z0-9-]{1,64}$/;

export const Route = createFileRoute("/api/resumes/save")({
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
        const { id, title, templateId, data } = body ?? {};
        if (!data || typeof data !== "object") {
          return Response.json({ error: "invalid_data" }, { status: 400 });
        }
        // id 可选:有就 upsert,没有就生成
        const resumeId =
          typeof id === "string" && UUID_RE.test(id) ? id : randomId();

        try {
          const now = Date.now();
          const safeTitle = String(title ?? data.title ?? "未命名简历").slice(
            0,
            200
          );
          const safeTemplateId =
            typeof templateId === "string" || templateId === null
              ? (templateId as string | null)
              : null;

          // 1) 写 COS
          await cosPut(env, user.id, resumeId, data);
          const size = new TextEncoder().encode(JSON.stringify(data)).length;

          // 2) upsert meta
          const existing = await env.DB.prepare(
            "SELECT created_at FROM resumes_meta WHERE id = ? AND user_id = ?"
          )
            .bind(resumeId, user.id)
            .first<{ created_at: number }>();

          if (existing) {
            await env.DB.prepare(
              `UPDATE resumes_meta
               SET title = ?, template_id = ?, updated_at = ?, size = ?
               WHERE id = ? AND user_id = ?`
            )
              .bind(safeTitle, safeTemplateId, now, size, resumeId, user.id)
              .run();
          } else {
            await env.DB.prepare(
              `INSERT INTO resumes_meta(id, user_id, title, template_id, updated_at, created_at, cos_key, size)
               VALUES(?, ?, ?, ?, ?, ?, ?, ?)`
            )
              .bind(
                resumeId,
                user.id,
                safeTitle,
                safeTemplateId,
                now,
                now,
                resumeKey(user.id, resumeId),
                size
              )
              .run();
          }

          return Response.json({
            ok: true,
            id: resumeId,
            updatedAt: now,
          });
        } catch (e) {
          console.error("[resumes/save] error:", e);
          return Response.json({ error: "save_failed" }, { status: 500 });
        }
      },
    },
  },
});
