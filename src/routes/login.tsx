import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Logo from "@/components/shared/Logo";

export const Route = createFileRoute("/login")({
  component: LoginPage
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("请输入邮箱和密码");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        reason?: string;
      };
      if (!res.ok) {
        if (data.error === "banned") {
          toast.error(`账号已被封禁${data.reason ? `: ${data.reason}` : ""}`);
        } else {
          toast.error("邮箱或密码错误");
        }
        return;
      }
      toast.success("登录成功");
      navigate({ to: "/app/dashboard" });
    } catch (err) {
      console.error(err);
      toast.error("网络异常,请稍后再试");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-background">
      {/* 左:品牌 */}
      <section className="hidden md:flex flex-col justify-between p-12 border-r border-border">
        <div className="flex items-center gap-3">
          <Logo size={32} className="text-foreground" />
          <span className="text-xl font-medium tracking-tight">Magic Resume</span>
        </div>
        <div>
          <h1 className="text-5xl font-serif font-medium tracking-tight leading-tight text-foreground">
            开启你的<br />下一份简历
          </h1>
          <p className="mt-6 text-base text-muted-foreground max-w-md leading-relaxed">
            极简、克制、可云端同步。登录后可在多设备访问你的简历数据。
          </p>
        </div>
        <p className="text-xs text-muted-foreground">© 2026 Magic Resume</p>
      </section>

      {/* 右:表单 */}
      <section className="flex items-center justify-center p-8">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-sm space-y-6"
        >
          <div className="md:hidden flex items-center gap-2 mb-8">
            <Logo size={28} className="text-foreground" />
            <span className="text-lg font-medium">Magic Resume</span>
          </div>

          <div>
            <h2 className="text-2xl font-medium tracking-tight">登录</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              还没有账号?
              <a
                href="/register"
                className="ml-1 text-foreground underline underline-offset-4 hover:opacity-80"
              >
                立即注册
              </a>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">邮箱</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={busy}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">密码</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="至少 8 位"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={busy}
            />
          </div>

          <Button
            type="submit"
            className="w-full h-11"
            disabled={busy}
          >
            {busy ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                登录中…
              </>
            ) : (
              "登录"
            )}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            登录即表示同意服务条款和隐私政策
          </p>
        </form>
      </section>
    </main>
  );
}
