import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Users, FileText, Shield, Sparkles } from "lucide-react";

export const Route = createFileRoute("/app/admin/")({
  component: AdminDashboard,
});

interface Stats {
  totalUsers: number;
  totalResumes: number;
  bannedUsers: number;
  aiCallsLast30Days: number;
}

function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats", { credentials: "include" })
      .then((r) => r.json() as Promise<Stats>)
      .then((data: Stats) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const cards = [
    {
      label: "用户总数",
      value: stats?.totalUsers ?? 0,
      icon: Users,
      hint: "包含被封禁用户",
    },
    {
      label: "简历总数",
      value: stats?.totalResumes ?? 0,
      icon: FileText,
      hint: "所有用户简历",
    },
    {
      label: "已封禁用户",
      value: stats?.bannedUsers ?? 0,
      icon: Shield,
      hint: "封禁后无法登录",
    },
    {
      label: "AI 调用 (30 天)",
      value: stats?.aiCallsLast30Days ?? 0,
      icon: Sparkles,
      hint: "polish + grammar 合计",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-medium tracking-tight">总览</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Magic Resume · 管理后台
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-lg border border-border bg-card p-5"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground tracking-widest uppercase">
                {c.label}
              </span>
              <c.icon size={16} className="text-muted-foreground" />
            </div>
            <div className="mt-3 text-3xl font-medium tracking-tight">
              {loading ? "—" : c.value}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{c.hint}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-sm font-medium">快速入口</h2>
        <ul className="mt-4 space-y-2 text-sm">
          <li>
            <a
              href="/app/admin/users"
              className="text-foreground underline underline-offset-4 hover:opacity-80"
            >
              用户列表 →
            </a>
            <span className="ml-3 text-muted-foreground">
              查看 / 封禁 / 调整 AI 配额
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}
