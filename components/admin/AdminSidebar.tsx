"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Shield,
  Settings,
  LogOut,
  ChevronLeft,
} from "lucide-react";
import { useState } from "react";

import { Link } from "@/i18n/navigation";
import { useAuth } from "@/components/providers/AuthProvider";

const navItems = [
  {
    href: "/admin",
    icon: LayoutDashboard,
    labelKey: "admin.nav.dashboard",
    exact: true,
  },
  {
    href: "/admin/products",
    icon: Package,
    labelKey: "admin.nav.products",
  },
  {
    href: "/admin/orders",
    icon: ShoppingCart,
    labelKey: "admin.nav.orders",
  },
  {
    href: "/admin/users",
    icon: Users,
    labelKey: "admin.nav.users",
  },
  {
    href: "/admin/security-logs",
    icon: Shield,
    labelKey: "admin.nav.securityLogs",
  },
  {
    href: "/admin/settings",
    icon: Settings,
    labelKey: "admin.nav.settings",
  },
];

export default function AdminSidebar() {
  const t = useTranslations();
  const pathname = usePathname();
  const { signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (href: string, exact?: boolean) => {
    // pathname 格式: /en/admin/products 或 /zh/admin
    const normalized = pathname.replace(/^\/(en|zh)/, "");
    if (exact) return normalized === href;
    return normalized === href || normalized.startsWith(href + "/");
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <aside
      className={`${
        collapsed ? "w-16" : "w-56"
      } flex shrink-0 flex-col border-r border-slate-800 bg-slate-950 transition-all duration-200`}
    >
      {/* Logo / Header */}
      <div className="flex h-14 items-center justify-between border-b border-slate-800 px-4">
        {!collapsed && (
          <Link
            href="/admin"
            className="text-sm font-bold tracking-tight text-white"
          >
            {t("admin.title")}
          </Link>
        )}
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          className="rounded-md p-1 text-slate-500 hover:bg-slate-800 hover:text-slate-300"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeft
            size={16}
            className={`transition-transform ${collapsed ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-2 py-3">
        {navItems.map((item) => {
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                active
                  ? "bg-cyan-500/10 text-cyan-400 font-semibold"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
              title={collapsed ? t(item.labelKey) : undefined}
            >
              <item.icon size={18} />
              {!collapsed && <span>{t(item.labelKey)}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-800 px-2 py-3">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition"
          title={collapsed ? t("security.lab.backHome") : undefined}
        >
          <ChevronLeft size={18} />
          {!collapsed && <span>{t("security.lab.backHome")}</span>}
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition"
          title={collapsed ? t("nav.logout") : undefined}
        >
          <LogOut size={18} />
          {!collapsed && <span>{t("nav.logout")}</span>}
        </button>
      </div>
    </aside>
  );
}
