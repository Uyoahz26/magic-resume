import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search, Ban, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const Route = createFileRoute("/app/admin/users")({
  component: AdminUsersPage,
});

interface UserRow {
  id: string;
  email: string;
  name: string | null;
  created_at: number;
  is_banned: number;
  ban_reason: string | null;
  monthly_limit: number;
  used: number;
  resume_count: number;
}

function AdminUsersPage() {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async (search: string) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/users?q=${encodeURIComponent(search)}&limit=100`,
        { credentials: "include" }
      );
      const data = (await res.json()) as { items?: UserRow[] };
      setItems(data.items ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => void load(q), 200);
    return () => clearTimeout(t);
  }, [q]);

  const toggleBan = async (u: UserRow) => {
    const banned = !u.is_banned;
    const reason = banned ? prompt("封禁原因 (可选):") ?? undefined : undefined;
    const res = await fetch("/api/admin/ban", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ userId: u.id, banned, reason }),
    });
    if (res.ok) {
      toast.success(banned ? "已封禁" : "已解封");
      void load(q);
    } else {
      toast.error("操作失败");
    }
  };

  const updateQuota = async (u: UserRow) => {
    const input = prompt(`设置 ${u.email} 的 AI 每月配额`, String(u.monthly_limit));
    if (input == null) return;
    const limit = parseInt(input, 10);
    if (!Number.isFinite(limit) || limit < 0) {
      toast.error("配额必须是 ≥ 0 的整数");
      return;
    }
    const res = await fetch("/api/admin/quota", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ userId: u.id, monthlyLimit: limit }),
    });
    if (res.ok) {
      toast.success("配额已更新");
      void load(q);
    } else {
      toast.error("更新失败");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-medium tracking-tight">用户管理</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          共 {items.length} 个用户
        </p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="搜索邮箱或昵称"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-3 font-medium">用户</th>
              <th className="text-left px-4 py-3 font-medium">状态</th>
              <th className="text-left px-4 py-3 font-medium">简历</th>
              <th className="text-left px-4 py-3 font-medium">AI 用量</th>
              <th className="text-left px-4 py-3 font-medium">注册时间</th>
              <th className="text-right px-4 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading && (
              <tr>
                <td colSpan={6} className="text-center py-12 text-muted-foreground">
                  加载中…
                </td>
              </tr>
            )}
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-12 text-muted-foreground">
                  无匹配用户
                </td>
              </tr>
            )}
            {items.map((u) => (
              <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex flex-col">
                    <span className="font-medium">{u.name || "—"}</span>
                    <span className="text-xs text-muted-foreground">{u.email}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {u.is_banned ? (
                    <span className="inline-flex items-center gap-1 text-destructive text-xs">
                      <Ban size={12} /> 已封禁
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-emerald-600 text-xs">
                      <CheckCircle2 size={12} /> 正常
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 tabular-nums">{u.resume_count}</td>
                <td className="px-4 py-3 tabular-nums text-xs">
                  {u.used} / {u.monthly_limit}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground tabular-nums">
                  {new Date(u.created_at).toLocaleDateString("zh-CN")}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateQuota(u)}
                    >
                      配额
                    </Button>
                    <Button
                      size="sm"
                      variant={u.is_banned ? "outline" : "destructive"}
                      onClick={() => toggleBan(u)}
                    >
                      {u.is_banned ? "解封" : "封禁"}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
