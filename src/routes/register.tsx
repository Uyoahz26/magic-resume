import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Logo from "@/components/shared/Logo";

export const Route = createFileRoute("/register")({
  component: RegisterPage
});

function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("请输入邮箱和密码");
      return;
    }
    if (password.length < 8) {
      toast.error("密码至少 8 位");
      return;
    }
    if (password !== confirm) {
      toast.error("两次输入的密码不一致");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          name: name || undefined,
        }),
        credentials: "include",
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!res.ok) {
        if (data.error === "email_exists") {
          toast.error("该邮箱已注册,请直接登录");
        } else if (data.error === "invalid_email") {
          toast.error("邮箱格式不正确");
        } else {
          toast.error("注册失败,请重试");
        }
        return;
      }
      toast.success("注册成功");
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
            创建账号<br />保存到云端
          </h1>
          <p className="mt-6 text-base text-muted-foreground max-w-md leading-relaxed">
            注册即可在多设备同步简历,享受 AI 润色、多模板导出等服务。
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
            <h2 className="text-2xl font-medium tracking-tight">注册</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              已有账号?
              <a
                href="/login"
                className="ml-1 text-foreground underline underline-offset-4 hover:opacity-80"
              >
                直接登录
              </a>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">昵称 (可选)</Label>
            <Input
              id="name"
              type="text"
              autoComplete="nickname"
              placeholder="张三"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={busy}
              maxLength={64}
            />
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
              autoComplete="new-password"
              placeholder="至少 8 位"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={busy}
              minLength={8}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm">确认密码</Label>
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              placeholder="再输入一次"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
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
                注册中…
              </>
            ) : (
              "注册"
            )}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            注册即表示同意服务条款和隐私政策
          </p>
        </form>
      </section>
    </main>
  );
}
