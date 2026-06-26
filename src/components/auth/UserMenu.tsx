/**
 * UserMenu - 头像下拉,显示当前用户邮箱 + 退出登录
 */

import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LogOut, Settings, Shield } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface MeResponse {
  user: { id: string; email: string; name: string | null } | null;
  isAdmin?: boolean;
  banned?: boolean;
}

export function UserMenu() {
  const navigate = useNavigate();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => r.json() as Promise<MeResponse>)
      .then((data: MeResponse) => {
        if (!cancelled) {
          setMe(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      toast.success("已退出登录");
      navigate({ to: "/" });
    } catch {
      toast.error("退出失败");
    }
  };

  if (loading) {
    return (
      <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
    );
  }
  if (!me?.user) return null;

  const display = me.user.name || me.user.email.split("@")[0];
  const initial = display.slice(0, 1).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full bg-foreground text-background font-medium"
        >
          {initial}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="font-medium">{display}</span>
          <span className="text-xs font-normal text-muted-foreground">
            {me.user.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {me.isAdmin && (
          <DropdownMenuItem onClick={() => navigate({ to: "/app/admin" })}>
            <Shield className="mr-2 h-4 w-4" />
            管理后台
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => navigate({ to: "/app/dashboard/settings" })}>
          <Settings className="mr-2 h-4 w-4" />
          偏好设置
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          退出登录
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
