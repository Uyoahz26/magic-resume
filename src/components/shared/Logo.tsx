import React from "react";

interface LogoProps {
  size?: number;
  className?: string;
  onClick?: () => void;
  /** "light" 强制深色 (用 currentColor), "dark" 强制浅色; 默认跟随主题 */
  variant?: "auto" | "light" | "dark";
  ariaLabel?: string;
}

/**
 * Magic Resume Logo
 *
 * 设计:24×24 viewBox,三个直角矩形拼出抽象 "R"(头部方块 + 横条 + 右下腿)
 * 极简、克制、纯几何直角,fill="currentColor" 跟随文字颜色自动适配主题
 */
const Logo: React.FC<LogoProps> = ({
  size = 24,
  className = "",
  onClick,
  ariaLabel = "Magic Resume",
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      onClick={onClick}
      role="img"
      aria-label={ariaLabel}
    >
      <rect x="3" y="3" width="4" height="4" />
      <rect x="3" y="10" width="14" height="4" />
      <rect x="13" y="14" width="4" height="7" />
    </svg>
  );
};

export default Logo;
