"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";

import { Link } from "@/i18n/navigation";
import OrderStatusBadge from "@/components/admin/OrderStatusBadge";

type OrderDetail = {
  id: string;
  user_id: string;
  items: Array<{ id: string; name: string; quantity: number; priceUsd: number }>;
  total_usd: number;
  status: string;
  created_at: string;
};

type StatusHistory = {
  id: string;
  from_status: string | null;
  to_status: string;
  changed_by: string | null;
  note: string | null;
  created_at: string;
};

const ALL_STATUSES = ["pending", "paid", "shipped", "delivered", "cancelled", "refunded"];

export default function AdminOrderDetailPage() {
  const t = useTranslations();
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [history, setHistory] = useState<StatusHistory[]>([]);
  const [newStatus, setNewStatus] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    async function fetchOrder() {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/orders/${orderId}`);
        const data = await res.json();
        if (data.ok) {
          setOrder(data.data);
          setHistory(data.statusHistory ?? []);
          setNewStatus(data.data.status);
        }
      } catch {
        toast.error("Failed to load order");
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [orderId]);

  const handleStatusUpdate = async () => {
    if (!newStatus || newStatus === order?.status) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, note: note || undefined }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success(t("admin.orders.statusUpdated"));
        setOrder((prev) => prev ? { ...prev, status: newStatus } : null);
        setNote("");
        // 刷新历史
        const fresh = await fetch(`/api/admin/orders/${orderId}`).then((r) => r.json());
        if (fresh.ok) setHistory(fresh.statusHistory ?? []);
      } else {
        toast.error(data.message ?? "Update failed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-slate-400">Loading...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="py-20 text-center">
        <p className="text-slate-400">{t("admin.orders.noOrders")}</p>
        <Link href="/admin/orders" className="mt-2 inline-block text-sm text-cyan-400 hover:underline">
          Back to orders
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link href="/admin/orders" className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-white">{t("admin.orders.detail")}</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Order Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs text-slate-400">{t("admin.orders.id")}</p>
                <p className="font-mono text-sm text-cyan-400">{order.id}</p>
              </div>
              <OrderStatusBadge status={order.status} />
            </div>
            <div className="mb-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-slate-400">{t("admin.orders.date")}</p>
                <p className="text-slate-200">{new Date(order.created_at).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">{t("admin.orders.total")}</p>
                <p className="text-lg font-bold text-white">${order.total_usd.toFixed(2)}</p>
              </div>
            </div>

            <h3 className="mb-2 text-sm font-semibold text-slate-300">{t("admin.orders.items")}</h3>
            <div className="overflow-hidden rounded-lg border border-slate-800">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-800/50">
                  <tr>
                    <th className="px-3 py-2 text-slate-400 font-medium">Item</th>
                    <th className="px-3 py-2 text-right text-slate-400 font-medium">Qty</th>
                    <th className="px-3 py-2 text-right text-slate-400 font-medium">Price</th>
                    <th className="px-3 py-2 text-right text-slate-400 font-medium">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {order.items?.map((item, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2 text-slate-200">{item.name}</td>
                      <td className="px-3 py-2 text-right text-slate-300">{item.quantity}</td>
                      <td className="px-3 py-2 text-right text-slate-300">${item.priceUsd.toFixed(2)}</td>
                      <td className="px-3 py-2 text-right text-slate-200">${(item.priceUsd * item.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Status Update & History */}
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <h3 className="mb-3 text-sm font-semibold text-white">{t("admin.orders.updateStatus")}</h3>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="mb-3 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 outline-none"
            >
              {ALL_STATUSES.map((s) => (
                <option key={s} value={s}>{t(`admin.orders.statuses.${s}` as never)}</option>
              ))}
            </select>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional note..."
              rows={2}
              className="mb-3 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 outline-none placeholder:text-slate-500"
            />
            <button
              type="button"
              onClick={handleStatusUpdate}
              disabled={updating || newStatus === order.status}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-400 disabled:opacity-50 transition"
            >
              <Save size={14} />
              {updating ? "Updating..." : t("admin.orders.updateStatus")}
            </button>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <h3 className="mb-3 text-sm font-semibold text-white">{t("admin.orders.statusHistory")}</h3>
            {history.length === 0 ? (
              <p className="text-xs text-slate-500">No history</p>
            ) : (
              <div className="space-y-2">
                {history.map((h) => (
                  <div key={h.id} className="rounded-lg border border-slate-800 bg-slate-800/30 px-3 py-2">
                    <div className="flex items-center gap-2 text-xs">
                      {h.from_status ? (
                        <span className="text-slate-400">{t(`admin.orders.statuses.${h.from_status}` as never)}</span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                      <span className="text-slate-500">→</span>
                      <span className="text-cyan-400 font-semibold">{t(`admin.orders.statuses.${h.to_status}` as never)}</span>
                    </div>
                    {h.note && <p className="mt-1 text-xs text-slate-400">{h.note}</p>}
                    <p className="mt-1 text-[10px] text-slate-500">{new Date(h.created_at).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
