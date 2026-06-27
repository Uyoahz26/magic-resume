import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "@/lib/image";

export default function HeroSection() {
  return (
    <section className="relative pt-40 pb-24">
      <div className="mx-auto max-w-[1100px] px-6 text-center">
        <span className="inline-block text-xs tracking-widest text-muted-foreground mb-6 uppercase">
          Resume · 简历编辑器
        </span>

        <h1 className="text-5xl md:text-7xl font-medium tracking-tight leading-[1.05] text-foreground">
          开启你的<br />
          <span className="italic font-normal text-muted-foreground">下一份</span> 简历
        </h1>

        <p className="mt-8 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-light">
          极简、克制、可云端同步。<br className="hidden md:inline" />
          一键 AI 润色、多模板导出,让好简历不再难产。
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button asChild size="lg" className="h-12 px-8 text-base">
            <a href="/register">
              免费注册
              <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </Button>
          <Button asChild variant="ghost" size="lg" className="h-12 px-6 text-base">
            <a href="/login">已有账号 · 登录</a>
          </Button>
        </div>
      </div>

      <div className="mt-20 mx-auto max-w-[1100px] px-6">
        <div className="rounded-lg overflow-hidden border border-border bg-card">
          <Image
            src="/web-shot.png"
            alt="Resume 编辑器预览"
            width={1200}
            height={800}
            className="w-full h-auto"
            priority
          />
        </div>
      </div>
    </section>
  );
}
