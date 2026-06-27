import Logo from "@/components/shared/Logo";

export default function Footer() {
  return (
    <footer className="py-12 border-t border-border">
      <div className="mx-auto max-w-[1100px] px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <Logo size={20} className="text-foreground" />
          <span className="text-sm font-medium">Resume</span>
        </div>
        <p className="text-xs text-muted-foreground">
          © 2026 Resume · 去其精华合成糟粕
        </p>
      </div>
    </footer>
  );
}
