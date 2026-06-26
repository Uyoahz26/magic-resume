import { createFileRoute } from "@tanstack/react-router";
import { clearSessionCookie, destroySession } from "@/lib/server/auth";
import { requireEnv } from "@/lib/server/env";

export const Route = createFileRoute("/api/auth/logout")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const env = requireEnv();
        await destroySession(env, request);
        const headers = new Headers({ "Content-Type": "application/json" });
        clearSessionCookie(headers);
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers,
        });
      },
    },
  },
});
