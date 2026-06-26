/**
 * UnifiedDateRangeInput - 轻量日期范围输入(stub)
 */

import * as React from "react";

interface Props {
  startValue?: string;
  endValue?: string;
  onStartChange?: (v: string) => void;
  onEndChange?: (v: string) => void;
  className?: string;
}

export const UnifiedDateRangeInput: React.FC<Props> = ({
  startValue = "",
  endValue = "",
  onStartChange,
  onEndChange,
  className,
}) => {
  const inputCls =
    "flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";
  return (
    <div className={"flex items-center gap-2 " + (className ?? "")}>
      <input
        type="date"
        value={startValue}
        onChange={(e) => onStartChange?.(e.target.value)}
        className={inputCls + " flex-1"}
        placeholder="开始"
      />
      <span className="text-xs text-muted-foreground">至</span>
      <input
        type="date"
        value={endValue}
        onChange={(e) => onEndChange?.(e.target.value)}
        className={inputCls + " flex-1"}
        placeholder="结束"
      />
    </div>
  );
};
