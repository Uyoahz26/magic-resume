/**
 * UnifiedDateInput - 轻量日期输入(stub)
 *
 * 旧版基于 HeroUI;现改为原生 input[type=date],保证 build 通过。
 */

import * as React from "react";

interface Props {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const UnifiedDateInput: React.FC<Props> = ({
  value = "",
  onChange,
  placeholder,
  className,
}) => {
  return (
    <input
      type="date"
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      className={
        "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring " +
        (className ?? "")
      }
    />
  );
};
