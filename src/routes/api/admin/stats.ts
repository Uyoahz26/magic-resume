import { createFileRoute } from "@tanstack/react-router";
import { requireAdmin } from "@/lib/server/admin";
import { requireEnv } from "@/lib/server/env";

export const Route = createFileRoute("/api/admin/stats")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const env = requireEnv();
        await requireAdmin(env, request);

        const [users, resumes, banned, aiCalls] = await Promise.all([
          env.DB.prepare("SELECT COUNT(*) AS c FROM users").first<{ c: number }>(),
          env.DB.prepare("SELECT COUNT(*) AS c FROM resumes_meta").first<{ c: number }>(),
          env.DB.prepare("SELECT COUNT(*) AS c FROM users WHERE is_banned = 1").first<{ c: number }>(),
          env.DB.prepare("SELECT COUNT(*) AS c FROM ai_logs WHERE created_at > ?")
            .bind(Date.now() - 30 * 86400_000)
            .first<{ c: number }>(),
        ]);

        return Response.json({
          totalUsers: users?.c ?? 0,
          totalResumes: resumes?.c ?? 0,
          bannedUsers: banned?.c ?? 0,
          aiCallsLast30Days: aiCalls?.c ?? 0,
        });
      },
    },
  },
});
