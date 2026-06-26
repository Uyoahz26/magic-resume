/**
 * i18n 服务端兼容层 (stub)
 */

const messages: Record<string, unknown> = {};

export function getMessages(): Promise<Record<string, unknown>> {
  return Promise.resolve(messages);
}

type Translator = ((key: string) => string) & {
  raw: (key: string) => unknown;
};

export async function getTranslations(opts: {
  locale: string;
  namespace?: string;
}): Promise<Translator> {
  const t: Translator = ((key: string) => key) as Translator;
  t.raw = (key: string) => key;
  return t;
}

export function setRequestLocale(_locale: string): void {
  // no-op
}
