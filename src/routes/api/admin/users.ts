import { createFileRoute } from "@tanstack/react-router";
import { requireAdmin, auditLog } from "@/lib/server/admin";
import { requireEnv } from "@/lib/server/env";

export const Route = createFileRoute("/api/admin/users")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const env = requireEnv();
        await requireAdmin(env, request);
        const url = new URL(request.url);
        const q = url.searchParams.get("q")?.toLowerCase() ?? "";
        const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50", 10) || 50, 200);
        const offset = Math.max(parseInt(url.searchParams.get("offset") ?? "0", 10) || 0, 0);

        const rows = await env.DB.prepare(
          `SELECT u.id, u.email, u.name, u.created_at, u.is_banned, u.ban_reason,
                  COALESCE(q.monthly_limit, 200) AS monthly_limit,
                  COALESCE(q.used, 0) AS used,
                  (SELECT COUNT(*) FROM resumes_meta WHERE user_id = u.id) AS resume_count
           FROM users u
           LEFT JOIN ai_quota q ON q.user_id = u.id
           WHERE (? = '' OR LOWER(u.email) LIKE ? OR LOWER(IFNULL(u.name,'')) LIKE ?)
           ORDER BY u.created_at DESC
           LIMIT ? OFFSET ?`
        )
          .bind(q, `%${q}%`, `%${q}%`, limit, offset)
          .all();

        const total = await env.DB.prepare(
          `SELECT COUNT(*) AS c FROM users
           WHERE (? = '' OR LOWER(email) LIKE ? OR LOWER(IFNULL(name,'')) LIKE ?)`
        )
          .bind(q, `%${q}%`, `%${q}%`)
          .first<{ c: number }>();

        return Response.json({
          items: rows.results ?? [],
          total: total?.c ?? 0,
          limit,
          offset,
        });
      },
    },
  },
});
