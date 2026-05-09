"use client";

import Image from "next/image";
import { Minus, Plus, ShieldCheck, ShoppingBag, Trash2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { useCart } from "@/components/providers/CartProvider";
import { useUI } from "@/components/providers/UIProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { Link, useRouter } from "@/i18n/navigation";
import MoneyText from "@/components/MoneyText";
import { getProductById } from "@/lib/products";

// 右侧滑出购物车抽屉
//   - 商品图 / 名称 / 数量加减 / 移除
//   - 小计 + 运费 + 合计（运费固定显示 Free，呼应 PromoBar 的 Free Shipping）
//   - 结算时未登录跳转登录页（中间件保护 /profile，结算 API 也会拒绝匿名）
export default function CartDrawer() {
  const t = useTranslations("cart");
  const tToast = useTranslations("toast");
  const tCatalog = useTranslations("catalog");
  const { items, removeFromCart, updateQuantity, subtotalUsd, count, clearCart } =
    useCart();
  const { cartOpen, closeCart } = useUI();
  const { user } = useAuth();
  const router = useRouter();

  const handleCheckout = async () => {
    if (!user) {
      toast.message(tToast("loginRequired"));
      closeCart();
      router.push("/login?redirect=/");
      return;
    }
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            id: item.id,
            name: getProductById(item.id)?.name ?? item.name,
            priceUsd: item.priceUsd,
            quantity: item.quantity,
          })),
        }),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok || !json?.ok) {
        const base =
          typeof json?.error === "string" ? json.error : "checkout_failed";
        const hint =
          typeof json?.supabaseMessage === "string" &&
          json.supabaseMessage.length > 0
            ? `: ${json.supabaseMessage.slice(0, 160)}`
            : "";
        throw new Error(`${base}${hint}`);
      }
      toast.success(tToast("checkoutSuccess"));
      clearCart();
      closeCart();
      router.push("/profile");
    } catch (cause) {
      const code = cause instanceof Error ? cause.message : "checkout_failed";
      toast.error(
        code !== "checkout_failed"
          ? `${tToast("checkoutFailed")} (${code})`
          : tToast("checkoutFailed"),
      );
    }
  };

  return (
    <>
      <div
        onClick={closeCart}
        className={`fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm transition-opacity ${
          cartOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        aria-label={t("title")}
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform ${
          cartOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <ShoppingBag size={18} className="text-slate-700" />
            <h2 className="text-base font-bold text-slate-900">{t("title")}</h2>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
              {t("items", { count })}
            </span>
          </div>
          <button
            type="button"
            onClick={closeCart}
            aria-label={t("close")}
            className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            <X size={18} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <ShoppingBag size={36} className="text-slate-300" />
              <p className="text-sm text-slate-500">{t("empty")}</p>
              <Link
                href="/"
                onClick={closeCart}
                className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
              >
                {t("continueShopping")}
              </Link>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => {
                const lineName = tCatalog(`${item.id}.name` as never);
                return (
                <li key={item.id} className="flex gap-3">
                  <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-slate-50">
                    <Image
                      src={item.imageUrl}
                      alt={lineName}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex flex-1 flex-col">
                    <span className="line-clamp-2 text-sm font-medium text-slate-900">
                      {lineName}
                    </span>
                    <MoneyText
                      amountUsd={item.priceUsd}
                      className="mt-0.5 text-xs font-semibold text-slate-700"
                      animate={false}
                    />
                    <div className="mt-2 flex items-center justify-between">
                      <div className="inline-flex items-center rounded-full border border-slate-200">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="flex h-7 w-7 items-center justify-center text-slate-500 hover:text-slate-900"
                          aria-label={t("decrease")}
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-6 text-center text-xs font-semibold text-slate-900">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="flex h-7 w-7 items-center justify-center text-slate-500 hover:text-slate-900"
                          aria-label={t("increase")}
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id)}
                        className="inline-flex items-center gap-1 text-[11px] text-rose-500 hover:text-rose-600"
                      >
                        <Trash2 size={12} />
                        {t("remove")}
                      </button>
                    </div>
                  </div>
                </li>
              );
              })}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <footer className="border-t border-slate-200 px-5 py-4">
            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between text-slate-600">
                <dt>{t("subtotal")}</dt>
                <dd>
                  <MoneyText amountUsd={subtotalUsd} animate={false} />
                </dd>
              </div>
              <div className="flex justify-between text-slate-600">
                <dt>{t("shipping")}</dt>
                <dd className="font-semibold text-emerald-600">
                  {t("shippingFree")}
                </dd>
              </div>
              <div className="flex justify-between text-base font-bold text-slate-900">
                <dt>{t("total")}</dt>
                <dd>
                  <MoneyText amountUsd={subtotalUsd} animate={false} />
                </dd>
              </div>
            </dl>
            <button
              type="button"
              onClick={handleCheckout}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-md hover:bg-slate-800"
            >
              <ShieldCheck size={14} />
              {t("checkout")}
            </button>
          </footer>
        )}
      </aside>
    </>
  );
}
