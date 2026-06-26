import { createFileRoute } from "@tanstack/react-router";
import {
  EmailExistsError,
  attachSessionCookie,
  createSession,
  normalizeEmail,
  registerUser,
  validateEmail,
  validatePassword,
} from "@/lib/server/auth";
import { requireEnv } from "@/lib/server/env";

export const Route = createFileRoute("/api/auth/register")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const env = requireEnv();
        let body: any;
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "invalid_json" }, { status: 400 });
        }

        const { email, password, name } = body ?? {};
        if (!validateEmail(email)) {
          return Response.json({ error: "invalid_email" }, { status: 400 });
        }
        if (!validatePassword(password)) {
          return Response.json(
            { error: "invalid_password", message: "密码至少 8 位" },
            { status: 400 }
          );
        }

        try {
          const user = await registerUser(
            env,
            normalizeEmail(email),
            password,
            typeof name === "string" ? name.slice(0, 64) : undefined
          );
          const sid = await createSession(
            env,
            user.id,
            request.headers.get("user-agent") ?? undefined
          );
          const headers = new Headers({ "Content-Type": "application/json" });
          attachSessionCookie(headers, sid);
          return new Response(
            JSON.stringify({
              id: user.id,
              email: user.email,
              name: user.name,
            }),
            { status: 201, headers }
          );
        } catch (e) {
          if (e instanceof EmailExistsError) {
            return Response.json({ error: "email_exists" }, { status: 409 });
          }
          console.error("[register] error:", e);
          return Response.json({ error: "server_error" }, { status: 500 });
        }
      },
    },
  },
});
