import { createFileRoute } from "@tanstack/react-router";
import { requireUser } from "@/lib/server/auth";
import { getResume as cosGet } from "@/lib/server/cos";
import { requireEnv } from "@/lib/server/env";

const UUID_RE = /^[a-zA-Z0-9-]{1,64}$/;

export const Route = createFileRoute("/api/resumes/get")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const env = requireEnv();
        const user = await requireUser(env, request);
        const url = new URL(request.url);
        const id = url.searchParams.get("id");
        if (!id || !UUID_RE.test(id)) {
          return Response.json({ error: "invalid_id" }, { status: 400 });
        }
        try {
          const data = await cosGet(env, user.id, id);
          if (data == null) {
            return Response.json({ error: "not_found" }, { status: 404 });
          }
          const meta = await env.DB.prepare(
            `SELECT id, title, template_id, updated_at, created_at
             FROM resumes_meta WHERE id = ? AND user_id = ?`
          )
            .bind(id, user.id)
            .first<{
              id: string;
              title: string;
              template_id: string | null;
              updated_at: number;
              created_at: number;
            }>();
          return Response.json({ data, meta });
        } catch (e) {
          console.error("[resumes/get] error:", e);
          return Response.json({ error: "get_failed" }, { status: 500 });
        }
      },
    },
  },
});
