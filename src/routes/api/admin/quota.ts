import { createFileRoute } from "@tanstack/react-router";
import { requireAdmin, auditLog } from "@/lib/server/admin";
import { requireEnv } from "@/lib/server/env";

const UUID_RE = /^[a-zA-Z0-9-]{1,64}$/;

export const Route = createFileRoute("/api/admin/quota")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const env = requireEnv();
        const admin = await requireAdmin(env, request);
        let body: any;
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "invalid_json" }, { status: 400 });
        }
        const { userId, monthlyLimit } = body ?? {};
        if (typeof userId !== "string" || !UUID_RE.test(userId)) {
          return Response.json({ error: "invalid_user_id" }, { status: 400 });
        }
        const limit = parseInt(monthlyLimit, 10);
        if (!Number.isFinite(limit) || limit < 0 || limit > 100000) {
          return Response.json({ error: "invalid_limit" }, { status: 400 });
        }

        await env.DB.prepare(
          `INSERT INTO ai_quota(user_id, monthly_limit, used, reset_at)
           VALUES(?, ?, 0, ?)
           ON CONFLICT(user_id) DO UPDATE SET monthly_limit = excluded.monthly_limit`
        )
          .bind(userId, limit, new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).getTime())
          .run();

        await auditLog(env, admin.id, "set_quota", userId, { monthlyLimit: limit });

        return Response.json({ ok: true });
      },
    },
  },
});
