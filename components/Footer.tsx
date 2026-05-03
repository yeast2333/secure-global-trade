"use client";

import { ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";

export default function Footer() {
  const t = useTranslations("footer");
  const tCategories = useTranslations("categories");

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-8">
        <div className="grid gap-8 sm:grid-cols-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow">
                <ShieldCheck size={18} />
              </span>
              <span className="text-base font-bold text-slate-900">
                Secure Trade
              </span>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-slate-600">
              {t("brand.description")}
            </p>
            <p className="mt-3 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
              <ShieldCheck size={12} />
              {t("brand.compliance")}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900">{t("shop.title")}</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>
                <Link href="/" className="hover:text-slate-900">
                  {t("shop.all")}
                </Link>
              </li>
              <li>
                <Link href="/?category=electronics" className="hover:text-slate-900">
                  {tCategories("electronics")}
                </Link>
              </li>
              <li>
                <Link href="/?category=home" className="hover:text-slate-900">
                  {tCategories("home")}
                </Link>
              </li>
              <li>
                <Link href="/?category=industrial" className="hover:text-slate-900">
                  {tCategories("industrial")}
                </Link>
              </li>
              <li>
                <Link href="/?category=ppe" className="hover:text-slate-900">
                  {tCategories("ppe")}
                </Link>
              </li>
              <li>
                <Link href="/?category=logistics" className="hover:text-slate-900">
                  {tCategories("logistics")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-6 text-xs text-slate-500">
          <span>{t("copyright", { year: new Date().getFullYear() })}</span>
          <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
            <Link href="/security" className="font-medium text-slate-700 hover:text-slate-900">
              {t("legal.security")}
            </Link>
            <span className="hidden sm:inline">·</span>
            <span>USD $ | ¥</span>
            <span className="hidden sm:inline">·</span>
            <span className="hidden sm:inline">EN / 中文</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
