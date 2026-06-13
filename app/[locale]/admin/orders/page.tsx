"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Search, ChevronLeft, ChevronRight, Eye } from "lucide-react";

import { Link } from "@/i18n/navigation";
import OrderStatusBadge from "@/components/admin/OrderStatusBadge";

type Order = {
  id: string;
  user_id: string;
  items: Array<{ name: string; quantity: number; priceUsd: number }>;
  total_usd: number;
  status: string;
  created_at: string;
};

const PAGE_SIZE = 15;

export default function AdminOrdersPage() {
  const t = useTranslations();

  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", String(PAGE_SIZE));
      if (status) params.set("status", status);
      if (search) params.set("search", search);

      const res = await fetch(`/api/admin/orders?${params}`);
      const data = await res.json();
      if (data.ok) {
        setOrders(data.data);
        setTotal(data.total);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [page, status, search]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const allStatuses = ["", "pending", "paid", "shipped", "delivered", "cancelled", "refunded"];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-white">{t("admin.orders.title")}</h1>

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="flex items-center rounded-lg border border-slate-700 bg-slate-900 px-3 py-2">
          <Search size={14} className="text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder={t("admin.orders.search")}
            className="ml-2 w-56 bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-500"
          />
        </div>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 outline-none"
        >
          <option value="">{t("admin.orders.filterStatus")}</option>
          {allStatuses.filter(Boolean).map((s) => (
            <option key={s} value={s}>{t(`admin.orders.statuses.${s}` as never)}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-800 bg-slate-900/50">
            <tr>
              <th className="px-4 py-3 font-mono text-slate-400 font-medium">{t("admin.orders.id")}</th>
              <th className="px-4 py-3 text-slate-400 font-medium">{t("admin.orders.items")}</th>
              <th className="px-4 py-3 text-right text-slate-400 font-medium">{t("admin.orders.total")}</th>
              <th className="px-4 py-3 text-slate-400 font-medium">{t("admin.orders.status")}</th>
              <th className="px-4 py-3 text-slate-400 font-medium">{t("admin.orders.date")}</th>
              <th className="px-4 py-3 text-right text-slate-400 font-medium">{t("admin.orders.actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-500">Loading...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-500">{t("admin.orders.noOrders")}</td></tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-900/30 transition">
                  <td className="px-4 py-3 font-mono text-xs text-cyan-400">
                    {order.id.slice(0, 8)}...
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    {order.items?.length ?? 0} item(s)
                  </td>
                  <td className="px-4 py-3 text-right text-slate-200">
                    ${order.total_usd?.toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <OrderStatusBadge status={order.status} />
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-cyan-400 transition inline-block"
                    >
                      <Eye size={14} />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-slate-400">
          <span>{total} orders</span>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="rounded-md p-1 hover:bg-slate-800 disabled:opacity-30">
              <ChevronLeft size={16} />
            </button>
            <span>{page} / {totalPages}</span>
            <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="rounded-md p-1 hover:bg-slate-800 disabled:opacity-30">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
