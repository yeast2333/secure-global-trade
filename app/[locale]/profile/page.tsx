"use client";

import { useEffect, useState } from "react";
import { CalendarClock, Mail, Package, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";

import { useAuth } from "@/components/providers/AuthProvider";
import SafeText from "@/components/SafeText";
import MoneyText from "@/components/MoneyText";

type OrderRow = {
  id: string;
  total_usd: number;
  status: string;
  created_at: string;
  items: { id: string; name: string; quantity: number }[];
};

export default function ProfilePage() {
  const t = useTranslations("profile");
  const { user, supabase } = useAuth();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // 安全技术点：RLS + PostgREST 参数化查询；禁止拼接 SQL，不传 user_id 谓词
      const { data } = await supabase
        .from("orders")
        .select("id,total_usd,status,created_at,items")
        .order("created_at", { ascending: false });
      if (!cancelled) {
        setOrders((data as OrderRow[]) ?? []);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  if (!user) return null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow">
            <ShieldCheck size={18} />
          </span>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{t("title")}</h1>
            <p className="text-xs text-slate-500">
              {t("createdAt")}:{" "}
              {new Date(user.created_at ?? Date.now()).toLocaleDateString()}
            </p>
          </div>
        </div>
        <dl className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg bg-slate-50 p-3">
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              {t("userId")}
            </dt>
            <dd className="mt-1 font-mono text-sm text-slate-700">
              <SafeText value={user.id} variant="order" />
            </dd>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <dt className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              <Mail size={10} />
              {t("email")}
            </dt>
            <dd className="mt-1 text-sm text-slate-700">
              <SafeText value={user.email ?? ""} variant="email" />
            </dd>
          </div>
        </dl>
      </header>

      <section className="mt-6">
        <h2 className="text-base font-bold text-slate-900">
          {t("ordersTitle")}
        </h2>
        <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div className="px-5 py-8 text-center text-sm text-slate-500">
              ...
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-5 py-10 text-center">
              <Package size={28} className="text-slate-300" />
              <p className="text-sm text-slate-500">{t("noOrders")}</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-left text-[10px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2">{t("orderId")}</th>
                  <th className="px-4 py-2">{t("orderTotal")}</th>
                  <th className="px-4 py-2">{t("orderStatus")}</th>
                  <th className="px-4 py-2">{t("orderDate")}</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-slate-700">
                      <SafeText value={order.id} variant="order" />
                    </td>
                    <td className="px-4 py-3 text-slate-900">
                      <MoneyText amountUsd={Number(order.total_usd)} animate={false} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                        {order.status}
                      </span>
                    </td>
                    <td className="inline-flex items-center gap-1 px-4 py-3 text-xs text-slate-500">
                      <CalendarClock size={12} />
                      {new Date(order.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
