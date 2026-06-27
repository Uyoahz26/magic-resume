import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, ArrowRight, Sparkles, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Logo from "@/components/shared/Logo";
import { motion } from "framer-motion";

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
              开启你的<br />下一份简历
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
            © 2026 Resume · 去其精华合成糟粕
          </motion.p>
        </div>
      </section>

      {/* 右:登录表单 */}
      <section className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <motion.div
          className="w-full max-w-sm space-y-8"
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
            <h2 className="text-2xl sm:text-3xl font-medium tracking-tight">欢迎回来</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              还没有账号?{" "}
              <a
                href="/register"
                className="text-foreground font-medium underline underline-offset-4 hover:opacity-80"
              >
                立即注册
              </a>
            </p>
          </div>

          {/* 表单 */}
          <form onSubmit={handleSubmit} className="space-y-5">
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
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">密码</Label>
                <a
                  href="#"
                  className="text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    toast.info("没做");
                  }}
                >
                  忘记密码?
                </a>
              </div>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={busy}
                className="h-11"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-base font-medium"
              disabled={busy}
            >
              {busy ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  登录中…
                </>
              ) : (
                <>
                  登录
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* 注册入口 */}
          <p className="text-center text-sm text-muted-foreground">
            还没有账号?{" "}
            <a
              href="/register"
              className="text-foreground font-medium underline underline-offset-4 hover:opacity-80"
            >
              立即注册
            </a>
          </p>
        </motion.div>
      </section>
    </main>
  );
}
