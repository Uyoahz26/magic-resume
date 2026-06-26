import Logo from "@/components/shared/Logo";

export default function Footer() {
  return (
    <footer className="py-12 border-t border-border">
      <div className="mx-auto max-w-[1100px] px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <Logo size={20} className="text-foreground" />
          <span className="text-sm font-medium">Magic Resume</span>
        </div>
        <p className="text-xs text-muted-foreground">
          © 2026 Magic Resume · 让好简历不再难产
        </p>
      </div>
    </footer>
  );
}
