import { createFileRoute } from "@tanstack/react-router";
import { requireAdmin, auditLog } from "@/lib/server/admin";
import { requireEnv } from "@/lib/server/env";

const UUID_RE = /^[a-zA-Z0-9-]{1,64}$/;

export const Route = createFileRoute("/api/admin/ban")({
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
        const { userId, banned, reason } = body ?? {};
        if (typeof userId !== "string" || !UUID_RE.test(userId)) {
          return Response.json({ error: "invalid_user_id" }, { status: 400 });
        }
        const next = banned ? 1 : 0;
        await env.DB.prepare(
          "UPDATE users SET is_banned = ?, ban_reason = ? WHERE id = ?"
        )
          .bind(next, typeof reason === "string" ? reason.slice(0, 200) : null, userId)
          .run();

        if (banned) {
          // 封禁后清掉该用户所有 session,迫立即下线
          await env.DB.prepare("DELETE FROM sessions WHERE user_id = ?")
            .bind(userId)
            .run();
        }

        await auditLog(
          env,
          admin.id,
          banned ? "ban" : "unban",
          userId,
          { reason: typeof reason === "string" ? reason : null }
        );

        return Response.json({ ok: true });
      },
    },
  },
});
