import { createFileRoute } from "@tanstack/react-router";
import { getCurrentUser } from "@/lib/server/auth";
import { isAdmin } from "@/lib/server/admin";
import { requireEnv } from "@/lib/server/env";

export const Route = createFileRoute("/api/auth/me")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const env = requireEnv();
        const result = await getCurrentUser(env, request);
        if (result.kind === "anon") {
          return Response.json({ user: null });
        }
        const admin = await isAdmin(env, result.user.id);
        return Response.json({
          user: result.user,
          isAdmin: admin,
          banned: result.kind === "banned",
        });
      },
    },
  },
});
