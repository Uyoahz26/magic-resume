import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, ArrowRight, Sparkles, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Logo from "@/components/shared/Logo";
import { motion } from "framer-motion";

export const Route = createFileRoute("/register")({
  component: RegisterPage
});

function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [inviteCode, setInviteCode] = useState("");
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
    if (!inviteCode.trim()) {
      toast.error("请输入邀请码");
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
          inviteCode: inviteCode.trim(),
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
        } else if (data.error === "invalid_invite_code") {
          toast.error("邀请码不正确");
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
    <main className="min-h-screen flex bg-background">
      {/* 左:品牌展示 */}
      <section className="hidden lg:flex flex-col justify-center w-1/2 px-12 xl:px-20 bg-gradient-to-br from-foreground to-foreground/80 relative overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute inset-0 overflow-hidden">
          {/* 右上角圆形 */}
          <motion.div
            className="absolute -top-24 -right-24 w-96 h-96 rounded-full border border-white/10"
            animate={{ rotate: 360 }}
            transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          />
          {/* 左下角圆形 */}
          <motion.div
            className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full border border-white/5"
            animate={{ rotate: -360 }}
            transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
          />
          {/* 网格 */}
          <div className="absolute inset-0 opacity-[0.02]" style={{
            backgroundImage: `linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }} />
        </div>

        {/* 内容 */}
        <div className="relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <Logo size={40} className="text-white" />
            <span className="text-2xl font-medium tracking-tight text-white">Resume</span>
          </div>

          {/* 标题区 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-sm text-white/70 mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              AI 驱动的简历编辑器
            </div>
            <h1 className="text-4xl xl:text-5xl font-medium tracking-tight leading-tight text-white">
              创建账号<br />开始制作简历
            </h1>
          </motion.div>

          {/* 特性列表 */}
          <motion.div
            className="mt-10 space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {[
              "AI 智能润色 - 一键优化简历内容",
              "多模板选择 - 覆盖各类求职场景",
              "实时预览 - 所见即所得",
              "一键导出 - PDF/JSON 多格式"
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-white/60">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-white/10 flex items-center justify-center">
                  <Check className="w-3 h-3 text-white/80" />
                </div>
                {feature}
              </div>
            ))}
          </motion.div>

          {/* 底部 */}
          <motion.p
            className="mt-16 text-sm text-white/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            © 2026 Resume · 让好简历不再难产
          </motion.p>
        </div>
      </section>

      {/* 右:注册表单 */}
      <section className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <motion.div
          className="w-full max-w-sm space-y-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
        >
          {/* 移动端 Logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-6">
            <Logo size={28} className="text-foreground" />
            <span className="text-lg font-medium">Resume</span>
          </div>

          {/* 标题 */}
          <div className="text-center lg:text-left">
            <h2 className="text-2xl sm:text-3xl font-medium tracking-tight">创建账号</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              已有账号?{" "}
              <a
                href="/login"
                className="text-foreground font-medium underline underline-offset-4 hover:opacity-80"
              >
                直接登录
              </a>
            </p>
          </div>

          {/* 表单 */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">昵称 (可选)</Label>
              <Input
                id="name"
                type="text"
                autoComplete="nickname"
                placeholder="张三"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={busy}
                maxLength={64}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">邮箱</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={busy}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">密码</Label>
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
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm" className="text-sm font-medium">确认密码</Label>
              <Input
                id="confirm"
                type="password"
                autoComplete="new-password"
                placeholder="再输入一次"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                disabled={busy}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="inviteCode" className="text-sm font-medium">邀请码</Label>
              <Input
                id="inviteCode"
                type="text"
                autoComplete="off"
                placeholder="请输入邀请码"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                required
                disabled={busy}
                className="h-11"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-base font-medium mt-2"
              disabled={busy}
            >
              {busy ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  注册中…
                </>
              ) : (
                <>
                  注册
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* 条款 */}
          <p className="text-center text-xs text-muted-foreground">
            注册即表示同意服务条款和隐私政策
          </p>
        </motion.div>
      </section>
    </main>
  );
}
