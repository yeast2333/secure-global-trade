"use client";

import Image from "next/image";
import { Lock, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { calculateDiscountPercent, type Product } from "@/lib/products";
import { useProductName } from "@/hooks/use-product-name";
import { Link } from "@/i18n/navigation";
import { useCart } from "@/components/providers/CartProvider";
import { useUI } from "@/components/providers/UIProvider";
import MoneyText from "@/components/MoneyText";
import SafeText from "@/components/SafeText";

// 商品卡片 · Shopify Collection 风格
//   - 方形产品图 + 正方形比例
//   - 「Sale」徽章 + 折扣百分比
//   - 当前价 / 划线原价（next-intl 多语言键 product.regularPrice / salePrice）
//   - 悬停浮现 Quick Add 按钮，避免点击穿透 Link
export default function ProductCard({ product }: { product: Product }) {
  const t = useTranslations("product");
  const tToast = useTranslations("toast");
  const tCategories = useTranslations("categories");
  const { addToCart } = useCart();
  const { openCart } = useUI();
  const displayName = useProductName(product);

  const discount = calculateDiscountPercent(product);
  const isOnSale = discount > 0;

  const handleQuickAdd = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    addToCart(product, 1);
    toast.success(tToast("addedToCart"), { description: displayName });
    openCart();
  };

  return (
    <Link
      href={`/products/${product.id}`}
      className="group flex flex-col"
      aria-label={displayName}
    >
      <div className="relative aspect-square overflow-hidden rounded-lg bg-slate-50">
        <Image
          src={product.imageUrl}
          alt={displayName}
          fill
          sizes="(min-width: 1280px) 22vw, (min-width: 768px) 33vw, 50vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {isOnSale && (
          <span className="absolute left-3 top-3 rounded-full bg-rose-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-md">
            {t("sale")}
          </span>
        )}

        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/85 px-2 py-0.5 text-[10px] font-semibold text-slate-700 backdrop-blur">
          <Lock size={10} className="text-emerald-600" />
          {tCategories(product.category)}
        </span>

        <button
          type="button"
          onClick={handleQuickAdd}
          className="absolute inset-x-3 bottom-3 flex translate-y-3 items-center justify-center gap-1 rounded-full bg-slate-900/95 px-4 py-2 text-xs font-semibold text-white opacity-0 shadow-lg backdrop-blur transition group-hover:translate-y-0 group-hover:opacity-100"
        >
          <Plus size={14} />
          {t("quickAdd")}
        </button>
      </div>

      <div className="mt-3 flex flex-col gap-1">
        <h3 className="line-clamp-2 text-sm font-medium leading-snug text-slate-900">
          {displayName}
        </h3>

        {isOnSale && (
          <span className="text-[10px] font-semibold uppercase tracking-wide text-rose-600">
            {t("save", { percent: discount })}
          </span>
        )}

        <div className="flex items-baseline gap-2">
          <MoneyText
            amountUsd={product.priceUsd}
            className={`text-base font-semibold ${
              isOnSale ? "text-rose-600" : "text-slate-900"
            }`}
          />
          {isOnSale && product.priceUsdOriginal && (
            <MoneyText
              amountUsd={product.priceUsdOriginal}
              className="text-xs text-slate-400 line-through"
            />
          )}
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-500">
          <span className="inline-flex items-center gap-1">
            <Lock size={10} className="text-emerald-600" />
            {t("encryptedShipping")}
          </span>
          <span>
            {t("batch")}:{" "}
            <SafeText value={product.batchNo} variant="order" />
          </span>
        </div>
      </div>
    </Link>
  );
}
