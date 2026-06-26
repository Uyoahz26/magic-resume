/**
 * i18n 运行时 stub
 *
 * 不再从 URL 推断 locale,统一返回 zh。
 */

export function getPreferredLocale(_pathname: string): "zh" {
  return "zh";
}
