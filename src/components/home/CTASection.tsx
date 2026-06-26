import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CTASection() {
  return (
    <section className="py-32 border-t border-border">
      <div className="mx-auto max-w-[1100px] px-6 text-center">
        <h2 className="text-5xl md:text-7xl font-medium tracking-tight leading-[1.05]">
          现在就开始<br />你的下一份简历
        </h2>
        <p className="mt-6 text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
          30 秒注册,立即使用全部基础功能。
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button asChild size="lg" className="h-12 px-8 text-base">
            <a href="/register">
              免费注册
              <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
