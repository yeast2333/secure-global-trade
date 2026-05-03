"use client";

import Image from "next/image";
import { useParams } from "next/navigation";
import { ArrowLeft, Lock, Package, ShieldCheck, Truck } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { productIdSchema } from "@/lib/product-id";
import { calculateDiscountPercent, getProductById } from "@/lib/products";
import { Link } from "@/i18n/navigation";
import { useCart } from "@/components/providers/CartProvider";
import { useUI } from "@/components/providers/UIProvider";
import MoneyText from "@/components/MoneyText";
import SafeText from "@/components/SafeText";

export default function ProductDetailPage() {
  const t = useTranslations("product");
  const tToast = useTranslations("toast");
  const tCategories = useTranslations("categories");
  const tCatalog = useTranslations("catalog");
  const params = useParams<{ id: string }>();
  const idCandidate = decodeURIComponent(params?.id ?? "");
  const parsedId = productIdSchema.safeParse(idCandidate);
  const product = parsedId.success ? getProductById(parsedId.data) : null;
  const { addToCart } = useCart();
  const { openCart } = useUI();
  const displayName = product ? tCatalog(`${product.id}.name` as never) : "";
  const displayDescription = product
    ? tCatalog(`${product.id}.description` as never)
    : "";

  if (!product) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-xl font-bold text-slate-900">{t("notFound")}</h1>
        <Link
          href="/"
          className="mt-4 inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
        >
          <ArrowLeft size={14} />
          {t("backToCatalog")}
        </Link>
      </div>
    );
  }

  const discount = calculateDiscountPercent(product);

  const handleAdd = () => {
    addToCart(product, 1);
    toast.success(tToast("addedToCart"), { description: displayName });
    openCart();
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft size={12} />
        {t("backToCatalog")}
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <Image
            src={product.imageUrl}
            alt={displayName}
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
            priority
          />
          {discount > 0 && (
            <span className="absolute left-4 top-4 rounded-full bg-rose-500 px-3 py-1 text-xs font-bold text-white shadow-md">
              {t("save", { percent: discount })}
            </span>
          )}
        </div>

        <div className="flex flex-col">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-600">
            {tCategories(product.category)}
          </span>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {displayName}
          </h1>

          <div className="mt-4 flex items-baseline gap-3">
            <MoneyText
              amountUsd={product.priceUsd}
              className={`text-2xl font-bold ${
                discount > 0 ? "text-rose-600" : "text-slate-900"
              }`}
            />
            {product.priceUsdOriginal && discount > 0 && (
              <MoneyText
                amountUsd={product.priceUsdOriginal}
                className="text-sm text-slate-400 line-through"
              />
            )}
          </div>

          <p className="mt-4 text-sm leading-relaxed text-slate-600">
            {displayDescription}
          </p>

          <ul className="mt-5 grid gap-2 text-xs text-slate-600">
            <li className="inline-flex items-center gap-2">
              <Package size={14} className="text-slate-400" />
              {t("inStock", { count: product.stock })}
            </li>
            <li className="inline-flex items-center gap-2">
              <Lock size={14} className="text-emerald-600" />
              {t("batch")}: <SafeText value={product.batchNo} variant="order" />
            </li>
            <li className="inline-flex items-center gap-2">
              <Truck size={14} className="text-blue-600" />
              {t("shippingNote")}
            </li>
            <li className="inline-flex items-center gap-2">
              <ShieldCheck size={14} className="text-indigo-600" />
              {t("encryptedShipping")}
            </li>
          </ul>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleAdd}
              className="inline-flex flex-1 items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 sm:flex-none"
            >
              {t("addToCart")}
            </button>
            <button
              type="button"
              onClick={() => {
                handleAdd();
              }}
              className="inline-flex flex-1 items-center justify-center rounded-full border border-slate-900 bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50 sm:flex-none"
            >
              {t("buyNow")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
