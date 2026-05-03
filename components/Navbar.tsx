"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  Globe,
  LogOut,
  Menu,
  Package,
  Search,
  ShieldCheck,
  ShoppingBag,
  User as UserIcon,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { useCart } from "@/components/providers/CartProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { useUI } from "@/components/providers/UIProvider";
import { useCurrency } from "@/components/providers/CurrencyProvider";
import SafeText from "@/components/SafeText";
import { routing } from "@/i18n/routing";

type Locale = (typeof routing.locales)[number];

export default function Navbar({ locale }: { locale: Locale }) {
  const t = useTranslations("nav");
  const router = useRouter();
  const pathname = usePathname();
  const { count } = useCart();
  const { openCart } = useUI();
  const { user, signOut } = useAuth();
  const { currency, setCurrency } = useCurrency();

  const [searchTerm, setSearchTerm] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [securityOpen, setSecurityOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // 切换语言：保留当前路径，只换 locale 段
  const switchLocale = (next: Locale) => {
    router.replace(pathname, { locale: next });
  };

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, []);

  const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = searchTerm.trim();
    const params = trimmed ? `?q=${encodeURIComponent(trimmed)}` : "";
    router.push(`/${params}`);
    setMobileOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    setUserMenuOpen(false);
    router.replace("/");
  };

  const displayName = useMemo(() => {
    if (!user) return "";
    return user.email ?? user.id;
  }, [user]);

  const securityLinks = [
    { href: "/security", label: t("securityCenter") },
    { href: "/security#lab-bruteforce", label: t("securityLabBruteforce") },
    { href: "/security#lab-xss", label: t("securityLabXss") },
    { href: "/security#lab-password", label: t("securityLabPassword") },
    { href: "/security#lab-injection", label: t("securityLabInjection") },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:h-16 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          className="inline-flex items-center justify-center rounded-md p-2 text-slate-700 lg:hidden"
          aria-label={mobileOpen ? t("closeMenu") : t("openMenu")}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow">
            <ShieldCheck size={16} />
          </span>
          <span className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">
            {t("brand")}
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          <Link
            href="/"
            className="rounded-md px-3 py-2 text-sm text-slate-700 hover:text-slate-900"
          >
            {t("home")}
          </Link>
          <Link
            href="/?category=electronics"
            className="rounded-md px-3 py-2 text-sm text-slate-700 hover:text-slate-900"
          >
            {t("products")}
          </Link>
          <div
            className="relative"
            onMouseEnter={() => setSecurityOpen(true)}
            onMouseLeave={() => setSecurityOpen(false)}
          >
            <button
              type="button"
              onClick={() => setSecurityOpen((v) => !v)}
              className="inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm text-slate-700 hover:text-slate-900"
            >
              {t("security")}
              <ChevronDown size={12} />
            </button>
            {securityOpen && (
              <div className="absolute left-0 top-full min-w-[14rem] pt-1">
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                  {securityLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setSecurityOpen(false)}
                      className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </nav>

        <form
          onSubmit={submitSearch}
          className="hidden flex-1 items-center md:flex"
        >
          <div className="flex w-full items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 transition focus-within:border-slate-900 focus-within:bg-white">
            <Search size={14} className="text-slate-400" />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label={t("searchAria")}
              placeholder={t("search")}
              className="ml-2 w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
            />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-1">
          <div className="hidden items-center gap-1 sm:flex">
            <button
              type="button"
              onClick={() => switchLocale(locale === "en" ? "zh" : "en")}
              className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
              aria-label={t("language")}
            >
              <Globe size={12} />
              {locale.toUpperCase()}
            </button>
            <div className="inline-flex overflow-hidden rounded-full border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setCurrency("USD")}
                className={`px-2 py-1 transition ${
                  currency === "USD"
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                $
              </button>
              <button
                type="button"
                onClick={() => setCurrency("CNY")}
                className={`px-2 py-1 transition ${
                  currency === "CNY"
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                ¥
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={openCart}
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-700 hover:bg-slate-100"
            aria-label={t("cart")}
          >
            <ShoppingBag size={18} />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white animate-fade-swap">
                {count}
              </span>
            )}
          </button>

          {user ? (
            <div ref={userMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen((v) => !v)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-bold text-white shadow"
                aria-label="User menu"
              >
                {(displayName[0] ?? "U").toUpperCase()}
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                  <div className="border-b border-slate-100 px-4 py-3">
                    <p className="text-[10px] uppercase tracking-wide text-slate-400">
                      {t("profile")}
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-slate-900">
                      <SafeText value={displayName} variant="email" />
                    </p>
                  </div>
                  <Link
                    href="/profile"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <UserIcon size={14} />
                    {t("profile")}
                  </Link>
                  <Link
                    href="/profile"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <Package size={14} />
                    {t("orders")}
                  </Link>
                  <button
                    type="button"
                    onClick={async () => {
                      await handleSignOut();
                      // toast handled by parent? Could be added with sonner
                    }}
                    className="flex w-full items-center gap-2 border-t border-slate-100 px-4 py-2 text-left text-sm text-rose-600 hover:bg-rose-50"
                  >
                    <LogOut size={14} />
                    {t("logout")}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-800"
            >
              <UserIcon size={12} />
              {t("login")}
            </Link>
          )}
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-3 lg:hidden">
          <form onSubmit={submitSearch} className="mb-3 flex md:hidden">
            <div className="flex w-full items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
              <Search size={14} className="text-slate-400" />
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t("search")}
                className="ml-2 w-full bg-transparent text-sm outline-none"
              />
            </div>
          </form>
          <ul className="grid gap-1 text-sm">
            <li>
              <Link
                href="/"
                onClick={() => setMobileOpen(false)}
                className="block rounded-md px-3 py-2 text-slate-700 hover:bg-slate-50"
              >
                {t("home")}
              </Link>
            </li>
            <li>
              <Link
                href="/?category=electronics"
                onClick={() => setMobileOpen(false)}
                className="block rounded-md px-3 py-2 text-slate-700 hover:bg-slate-50"
              >
                {t("products")}
              </Link>
            </li>
            <li>
              <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                {t("security")}
              </p>
              <ul className="space-y-0.5">
                {securityLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className="block rounded-md px-3 py-2 text-slate-700 hover:bg-slate-50"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
            <li className="mt-2 flex items-center gap-2 px-3">
              <button
                type="button"
                onClick={() => switchLocale(locale === "en" ? "zh" : "en")}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs"
              >
                {locale.toUpperCase()}
              </button>
              <button
                type="button"
                onClick={() => setCurrency(currency === "USD" ? "CNY" : "USD")}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs"
              >
                {currency === "USD" ? "$" : "¥"}
              </button>
              {!user && (
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="ml-auto rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white"
                >
                  {t("login")}
                </Link>
              )}
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
