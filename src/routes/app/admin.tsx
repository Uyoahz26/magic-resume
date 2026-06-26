import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import Logo from "@/components/shared/Logo";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/app/admin")({
  ssr: false,
  beforeLoad: async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (!res.ok) {
        throw redirect({ to: "/login" });
      }
      const data = (await res.json()) as {
        user: { id: string; email: string; name: string | null } | null;
        isAdmin?: boolean;
        banned?: boolean;
      };
      if (!data.user) throw redirect({ to: "/login" });
      if (!data.isAdmin) throw redirect({ to: "/app/dashboard" });
    } catch (e) {
      if (e instanceof Response) throw e;
      throw redirect({ to: "/login" });
    }
  },
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto max-w-[1200px] px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size={22} className="text-foreground" />
            <span className="text-sm font-medium tracking-tight">管理后台</span>
          </div>
          <Button asChild variant="ghost" size="sm">
            <a href="/app/dashboard">
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              返回应用
            </a>
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-[1200px] px-6 py-10">
        <Outlet />
      </main>
    </div>
  );
}
