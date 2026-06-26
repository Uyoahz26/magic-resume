/**
 * i18n 兼容层 (stub)
 *
 * 为兼容旧的 useTranslations / useLocale 调用而存在。
 * - 不再读 zh.json / en.json
 * - 默认返回 key 本身(中英文混合),保证 build 通过
 * - 后续逐步替换核心页面中文硬编码后可删除整个 compat 目录
 */

import React, { createContext, useContext, ReactNode, useMemo } from "react";

type Messages = Record<string, unknown>;

const I18nContext = createContext<{
  locale: string;
  messages: Messages;
}>({
  locale: "zh",
  messages: {},
});

export function NextIntlClientProvider({
  children,
  locale = "zh",
  messages = {},
}: {
  children: ReactNode;
  locale?: string;
  messages?: Messages;
  timeZone?: string;
}) {
  const value = useMemo(() => ({ locale, messages }), [locale, messages]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useLocale(): string {
  return useContext(I18nContext).locale;
}

type Translator = ((key: string) => string) & {
  raw: (key: string) => unknown;
};

/**
 * 把 "home.hero.title" 这类嵌套 key 拆出来
 * 如果 messages 里没有,返回 key 本身
 */
function resolve(messages: Messages, key: string): unknown {
  const parts = key.split(".");
  let cur: any = messages;
  for (const p of parts) {
    if (cur && typeof cur === "object" && p in cur) {
      cur = cur[p];
    } else {
      return undefined;
    }
  }
  return cur;
}

export function useTranslations(namespace?: string): Translator {
  const { messages } = useContext(I18nContext);
  const base = (namespace ? resolve(messages, namespace) : messages) as Messages | undefined;

  const t: Translator = ((key: string) => {
    const v = base ? resolve(base as Messages, key) : undefined;
    if (typeof v === "string") return v;
    // fallback: 返回 key 本身,这样 UI 至少不会崩
    return key;
  }) as Translator;

  t.raw = (key: string) => (base ? resolve(base as Messages, key) : undefined);

  return t;
}
