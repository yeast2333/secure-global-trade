"use client";

import { useCurrency } from "@/components/providers/CurrencyProvider";

// 统一货币展示：依赖 CurrencyProvider，币种切换会触发 fade-swap 动画
type MoneyTextProps = {
  amountUsd: number;
  className?: string;
  /** 是否给文本应用过渡动画。聚合页可关闭以减少 DOM 重排 */
  animate?: boolean;
};

export default function MoneyText({
  amountUsd,
  className = "",
  animate = true,
}: MoneyTextProps) {
  const { format, currency } = useCurrency();
  return (
    <span
      key={animate ? currency : undefined}
      className={`${animate ? "inline-block animate-fade-swap" : ""} ${className}`}
    >
      {format(amountUsd)}
    </span>
  );
}
