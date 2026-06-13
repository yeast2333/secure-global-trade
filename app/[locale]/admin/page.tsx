"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ShieldCheck, Package, ShoppingCart, Users, AlertTriangle } from "lucide-react";
import { Link } from "@/i18n/navigation";

export default function AdminDashboardPage() {
  const t = useTranslations();
  const [stats, setStats] = useState<{
    products: number;
    orders: number;
    users: number;
    securityEvents: number;
  } | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [prodRes, orderRes, userRes, secRes] = await Promise.all([
          fetch("/api/admin/products?pageSize=1").then((r) => r.json()),
          fetch("/api/admin/orders?pageSize=1").then((r) => r.json()),
          fetch("/api/admin/users?pageSize=1").then((r) => r.json()),
          fetch("/api/admin/security-logs?pageSize=1").then((r) => r.json()),
        ]);
        setStats({
          products: prodRes.total ?? 0,
          orders: orderRes.total ?? 0,
          users: userRes.total ?? 0,
          securityEvents: secRes.total ?? 0,
        });
      } catch {
        // API 尚未就绪时忽略
      }
    }
    fetchStats();
  }, []);

  const cards = [
    {
      label: t("admin.nav.products"),
      value: stats?.products ?? "...",
      href: "/admin/products",
      icon: Package,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      label: t("admin.nav.orders"),
      value: stats?.orders ?? "...",
      href: "/admin/orders",
      icon: ShoppingCart,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      label: t("admin.nav.users"),
      value: stats?.users ?? "...",
      href: "/admin/users",
      icon: Users,
      color: "text-violet-400",
      bg: "bg-violet-500/10",
    },
    {
      label: t("admin.nav.securityLogs"),
      value: stats?.securityEvents ?? "...",
      href: "/admin/security-logs",
      icon: AlertTriangle,
      color: "text-rose-400",
      bg: "bg-rose-500/10",
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">
          {t("admin.dashboard.title")}
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          {t("admin.dashboard.subtitle")}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group rounded-xl border border-slate-800 bg-slate-900 p-5 transition hover:border-slate-700 hover:bg-slate-800/50"
          >
            <div className="flex items-center gap-3">
              <div className={`rounded-lg p-2 ${card.bg}`}>
                <card.icon size={20} className={card.color} />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{card.value}</p>
                <p className="text-xs text-slate-400">{card.label}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick links */}
      <div className="mt-8">
        <h2 className="mb-4 text-lg font-semibold text-white">
          {t("admin.dashboard.quickActions")}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/admin/products?new=true"
            className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900 p-4 transition hover:border-cyan-700 hover:bg-slate-800/50"
          >
            <Package size={18} className="text-cyan-400" />
            <span className="text-sm text-slate-300">
              {t("admin.dashboard.addProduct")}
            </span>
          </Link>
          <Link
            href="/admin/orders"
            className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900 p-4 transition hover:border-emerald-700 hover:bg-slate-800/50"
          >
            <ShoppingCart size={18} className="text-emerald-400" />
            <span className="text-sm text-slate-300">
              {t("admin.dashboard.viewOrders")}
            </span>
          </Link>
          <Link
            href="/admin/security-logs"
            className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900 p-4 transition hover:border-rose-700 hover:bg-slate-800/50"
          >
            <ShieldCheck size={18} className="text-rose-400" />
            <span className="text-sm text-slate-300">
              {t("admin.dashboard.viewSecurityLogs")}
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
