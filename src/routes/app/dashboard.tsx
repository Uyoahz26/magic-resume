import {
  createFileRoute,
  Outlet,
  redirect,
} from "@tanstack/react-router";
import DashboardLayout from "@/app/app/dashboard/client";

export const Route = createFileRoute("/app/dashboard")({
  head: () => ({
    meta: [{ name: "robots", content: "noindex,nofollow" }]
  }),
  // 客户端守卫:未登录跳 /login
  // 注: dashboard 子路由 ssr: false,这里 beforeLoad 在客户端导航时执行
  beforeLoad: async ({ location }) => {
    try {
      const res = await fetch("/api/auth/me", {
        credentials: "include",
      });
      if (!res.ok) {
        throw redirect({
          to: "/login",
          search: { redirect: location.href },
        });
      }
      const data = (await res.json()) as {
        user: { id: string; email: string; name: string | null } | null;
        isAdmin?: boolean;
        banned?: boolean;
      };
      if (!data.user || data.banned) {
        throw redirect({ to: "/login" });
      }
      // 把 user 注入 context
      return { user: data.user, isAdmin: !!data.isAdmin };
    } catch (e) {
      // redirect 抛错会被框架处理,这里再 throw 一次
      if (e instanceof Response) throw e;
      throw redirect({ to: "/login" });
    }
  },
  ssr: false,
  component: DashboardRouteLayout,
});

function DashboardRouteLayout() {
  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
}
