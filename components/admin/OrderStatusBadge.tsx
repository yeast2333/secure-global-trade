"use client";

import { useTranslations } from "next-intl";

type StatusColorMap = Record<string, string>;

const statusColors: StatusColorMap = {
  pending: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  paid: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
  shipped: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
  delivered: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  cancelled: "bg-rose-500/10 text-rose-400 border-rose-500/30",
  refunded: "bg-orange-500/10 text-orange-400 border-orange-500/30",
};

export default function OrderStatusBadge({ status }: { status: string }) {
  const t = useTranslations();
  const colorClass = statusColors[status] ?? "bg-slate-500/10 text-slate-400 border-slate-500/30";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${colorClass}`}
    >
      {t(`admin.orders.statuses.${status}` as never) || status}
    </span>
  );
}
