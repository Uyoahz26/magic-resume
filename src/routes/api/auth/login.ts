import { createFileRoute } from "@tanstack/react-router";
import {
  attachSessionCookie,
  createSession,
  findUserByEmail,
  normalizeEmail,
  verifyPassword,
} from "@/lib/server/auth";
import { requireEnv } from "@/lib/server/env";

export const Route = createFileRoute("/api/auth/login")({
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

        const { email, password } = body ?? {};
        if (
          typeof email !== "string" ||
          typeof password !== "string" ||
          email.length === 0 ||
          password.length === 0
        ) {
          // 不暴露具体错误,统一 401
          return Response.json(
            { error: "invalid_credentials" },
            { status: 401 }
          );
        }

        const user = await findUserByEmail(env, normalizeEmail(email));
        // 模拟一次 bcrypt 避免时序枚举(无论用户是否存在都做一次)
        const fakeHash =
          "$2a$10$CwTycUXWue0Thq9StjUM0uJ8hZ4i8hKzN7vE8a0ZcF4bH6aF5xk6u";
        const ok = user
          ? await verifyPassword(password, user.password_hash)
          : (await verifyPassword(password, fakeHash), false);

        if (!user || !ok) {
          return Response.json(
            { error: "invalid_credentials" },
            { status: 401 }
          );
        }
        if (user.is_banned) {
          return Response.json(
            { error: "banned", reason: user.ban_reason ?? undefined },
            { status: 403 }
          );
        }

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
          { status: 200, headers }
        );
      },
    },
  },
});
