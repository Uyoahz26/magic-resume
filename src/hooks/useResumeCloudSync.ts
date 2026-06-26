/**
 * useResumeCloudSync
 *
 * - hydrateFromCloud():登录后从 /api/resumes/list 拉全部简历,写入 useResumeStore
 * - saveToCloud():把当前 active 简历保存到云端(供自动保存 hook 调用)
 * - deleteFromCloud():删除云端简历
 *
 * 不依赖任何 React 状态,函数式导出方便外部调用。
 */

import { useResumeStore } from "@/store/useResumeStore";
import type { ResumeData } from "@/types/resume";

export interface CloudResumeItem {
  id: string;
  title: string;
  templateId: string | null;
  updatedAt: number | null;
  createdAt: number | null;
  data: ResumeData;
}

export async function hydrateFromCloud(): Promise<{
  ok: boolean;
  count: number;
  error?: string;
}> {
  try {
    const res = await fetch("/api/resumes/list", {
      method: "GET",
      credentials: "include",
    });
    if (!res.ok) {
      return { ok: false, count: 0, error: `HTTP ${res.status}` };
    }
    const json = (await res.json()) as { items: CloudResumeItem[] };
    const items = json.items ?? [];

    const resumes: Record<string, ResumeData> = {};
    let firstId: string | null = null;
    for (const it of items) {
      if (!it.data || typeof it.data !== "object") continue;
      resumes[it.id] = it.data;
      if (!firstId) firstId = it.id;
    }

    const store = useResumeStore.getState();
    // 用现有 setState 模式:替换 resumes 但保留其他字段
    useResumeStore.setState((s) => ({
      resumes,
      activeResumeId: s.activeResumeId ?? firstId,
      activeResume: s.activeResumeId
        ? resumes[s.activeResumeId] ?? null
        : firstId
          ? resumes[firstId]
          : null,
    }));

    return { ok: true, count: items.length };
  } catch (e: any) {
    return { ok: false, count: 0, error: String(e?.message ?? e) };
  }
}

export async function saveResumeToCloud(
  resume: ResumeData
): Promise<{ ok: boolean; updatedAt?: number; error?: string }> {
  try {
    const res = await fetch("/api/resumes/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        id: resume.id,
        title: resume.title,
        templateId: resume.templateId ?? null,
        data: resume,
      }),
    });
    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status}` };
    }
    const json = (await res.json()) as { ok: boolean; updatedAt?: number };
    return { ok: !!json.ok, updatedAt: json.updatedAt };
  } catch (e: any) {
    return { ok: false, error: String(e?.message ?? e) };
  }
}

export async function deleteResumeFromCloud(
  resumeId: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(
      `/api/resumes/list?id=${encodeURIComponent(resumeId)}`,
      {
        method: "DELETE",
        credentials: "include",
      }
    );
    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status}` };
    }
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: String(e?.message ?? e) };
  }
}

/**
 * useAutoSyncToCloud
 *
 * 在工作台挂载时启用,监听 store 变化,1.5s 去抖后自动保存当前 active 简历。
 * 失败时入 pending 队列,下次成功调用时清空。
 *
 * 用法:
 *   useEffect(() => {
 *     const cleanup = useAutoSyncToCloud();
 *     return cleanup;
 *   }, []);
 */

const PENDING_KEY = "mr_pending_sync";

type PendingItem = { id: string; updatedAt: number };

function readPending(): PendingItem[] {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writePending(arr: PendingItem[]) {
  try {
    if (arr.length === 0) localStorage.removeItem(PENDING_KEY);
    else localStorage.setItem(PENDING_KEY, JSON.stringify(arr));
  } catch {
    /* quota exceeded - ignore */
  }
}

export function useAutoSyncToCloud(): () => void {
  if (typeof window === "undefined") return () => {};

  let timer: ReturnType<typeof setTimeout> | null = null;
  let lastSyncedUpdatedAt: number | null = null;
  let isSyncing = false;

  const tryFlushPending = async () => {
    const pending = readPending();
    if (pending.length === 0) return;
    const store = useResumeStore.getState();
    const remaining: PendingItem[] = [];
    for (const item of pending) {
      const resume = store.resumes[item.id];
      if (!resume) continue;
      const r = await saveResumeToCloud(resume);
      if (!r.ok) remaining.push(item);
    }
    writePending(remaining);
  };

  const flush = async () => {
    if (isSyncing) return;
    const state = useResumeStore.getState();
    const resume = state.activeResume;
    if (!resume) return;
    const updatedAt = new Date(resume.updatedAt ?? Date.now()).getTime();
    if (lastSyncedUpdatedAt && updatedAt <= lastSyncedUpdatedAt) return;

    isSyncing = true;
    try {
      const r = await saveResumeToCloud(resume);
      if (r.ok) {
        lastSyncedUpdatedAt = updatedAt;
        // 成功则清掉 pending 中此 id
        const pending = readPending().filter(
          (p) => p.id !== resume.id
        );
        writePending(pending);
      } else {
        // 失败入队
        const pending = readPending();
        if (!pending.find((p) => p.id === resume.id)) {
          pending.push({ id: resume.id, updatedAt });
          writePending(pending);
        }
      }
    } finally {
      isSyncing = false;
    }
  };

  const schedule = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      flush();
      void tryFlushPending();
    }, 1500);
  };

  // 立即尝试一次 flush(登录后 mount 时)
  void tryFlushPending();
  void flush();

  const unsub = useResumeStore.subscribe((state, prev) => {
    // 只在 active 简历内容变化时触发
    if (state.activeResume === prev.activeResume) return;
    schedule();
  });

  // 切到前台时尝试 flush pending
  const onVisible = () => {
    if (document.visibilityState === "visible") {
      void tryFlushPending();
      schedule();
    }
  };
  document.addEventListener("visibilitychange", onVisible);

  return () => {
    if (timer) clearTimeout(timer);
    unsub();
    document.removeEventListener("visibilitychange", onVisible);
  };
}
