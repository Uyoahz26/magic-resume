import { useEffect, useState } from "react";
import { Menu, Moon, Sun, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Logo from "@/components/shared/Logo";
import { UserMenu } from "@/components/auth/UserMenu";

export default function LandingHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) root.classList.add("dark");
    else root.classList.remove("dark");
  }, [isDark]);

  return (
    <>
      <header
        className={
          "fixed top-0 inset-x-0 z-50 transition-colors duration-200 " +
          (scrolled
            ? "bg-background/80 backdrop-blur-md border-b border-border"
            : "bg-transparent border-b border-transparent")
        }
      >
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="flex items-center justify-between h-16">
            <a
              href="/"
              className="flex items-center gap-2.5 group"
            >
              <Logo size={28} className="text-foreground" />
              <span className="text-base font-medium tracking-tight text-foreground">
                Resume
              </span>
            </a>

            <div className="hidden md:flex items-center gap-3">
              <button
                type="button"
                aria-label="切换主题"
                onClick={() => setIsDark((v) => !v)}
                className="w-9 h-9 rounded-md hover:bg-accent flex items-center justify-center transition-colors text-foreground"
              >
                {isDark ? (
                  <Sun className="h-[1.05rem] w-[1.05rem]" />
                ) : (
                  <Moon className="h-[1.05rem] w-[1.05rem]" />
                )}
              </button>

              <a
                href="/login"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 h-9 inline-flex items-center"
              >
                登录
              </a>
              <Button asChild className="h-9 px-4">
                <a href="/register">免费注册</a>
              </Button>
              <UserMenu />
            </div>

            <button
              type="button"
              className="md:hidden p-2 hover:bg-accent rounded-md transition-colors text-foreground"
              onClick={() => setIsMenuOpen((v) => !v)}
              aria-label="菜单"
            >
              {isMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* 移动端菜单 */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-16 z-40 bg-background border-b border-border">
          <div className="px-6 py-4 flex flex-col gap-3">
            <a
              href="/login"
              className="text-sm py-2 text-foreground"
            >
              登录
            </a>
            <a
              href="/register"
              className="text-sm py-2 text-foreground"
            >
              免费注册
            </a>
          </div>
        </div>
      )}
    </>
  );
}
