"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { products } from "@/lib/products";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import CategoryTabs, {
  type CategoryValue,
} from "@/components/CategoryTabs";
import ProductCard from "@/components/ProductCard";
import ProductCardSkeleton from "@/components/ProductCardSkeleton";
import Pagination from "@/components/Pagination";
import SafeText from "@/components/SafeText";

const PAGE_SIZE = 12;

// 主页 / Collection 视图（仿照 Shopify 集合页布局）
//   - URL 驱动：?q=xxx & ?category=xxx & ?page=N
//   - 客户端筛选：搜索 + 分类组合
//   - 分页：12 条 / 页
export default function TradeHome() {
  const t = useTranslations("home");
  const tCategories = useTranslations("categories");
  const tCatalog = useTranslations("catalog");
  const tHero = useTranslations("home.hero");
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading: authLoading } = useAuth();

  const query = params.get("q") ?? "";
  const categoryParam = (params.get("category") as CategoryValue) ?? "all";
  const page = Math.max(1, Number(params.get("page") ?? "1"));

  const [category, setCategory] = useState<CategoryValue>(categoryParam);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setCategory(categoryParam);
  }, [categoryParam]);

  // 模拟从 Supabase 拉数据：实际上直接读 lib/products，但为了演示骨架屏延迟一下
  useEffect(() => {
    const timer = setTimeout(() => setHydrated(true), 350);
    return () => clearTimeout(timer);
  }, []);

  const filtered = useMemo(() => {
    const lower = query.trim().toLowerCase();
    return products.filter((product) => {
      const matchesCategory =
        category === "all" || product.category === category;
      const localizedName = tCatalog(`${product.id}.name` as never);
      const localizedDesc = tCatalog(`${product.id}.description` as never);
      const matchesSearch =
        !lower ||
        localizedName.toLowerCase().includes(lower) ||
        localizedDesc.toLowerCase().includes(lower) ||
        product.name.toLowerCase().includes(lower) ||
        product.description.toLowerCase().includes(lower);
      return matchesCategory && matchesSearch;
    });
  }, [category, query, tCatalog]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const visible = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );
  const start = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const end = Math.min(safePage * PAGE_SIZE, filtered.length);

  const updateUrl = (overrides: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    Object.entries(overrides).forEach(([key, value]) => {
      if (!value) {
        next.delete(key);
      } else {
        next.set(key, value);
      }
    });
    const search = next.toString();
    router.push(search ? `${pathname}?${search}` : pathname);
  };

  const handleCategoryChange = (next: CategoryValue) => {
    setCategory(next);
    updateUrl({
      category: next === "all" ? null : next,
      page: null,
    });
  };

  const handlePageChange = (next: number) => {
    updateUrl({ page: next === 1 ? null : String(next) });
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const clearFilters = () => {
    setCategory("all");
    router.push(pathname);
  };

  return (
    <div className="bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-600">
            {tHero("tagline")}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {t("collection.title")}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {t("collection.showing", {
              start,
              end,
              total: filtered.length,
            })}
            {query && (
              <>
                {" · "}
                <span className="text-slate-900">
                  {t("collection.searchResultsFor", { query })}
                </span>
              </>
            )}
          </p>
          {!authLoading && user?.email && (
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
              {tHero("welcomeBack", {
                email: "",
              })}
              <SafeText value={user.email} variant="email" />
            </p>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <CategoryTabs value={category} onChange={handleCategoryChange} />
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-12 pt-6 sm:px-6 lg:px-8">
        {!hydrated ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <ProductCardSkeleton key={index} />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <p className="text-sm text-slate-600">{t("collection.empty")}</p>
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-full border border-slate-300 bg-white px-4 py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-500"
            >
              {t("collection.clearFilters")}
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 xl:grid-cols-4">
              {visible.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            <div className="mt-10">
              <Pagination
                page={safePage}
                totalPages={totalPages}
                onChange={handlePageChange}
              />
            </div>
          </>
        )}
      </section>

      <section
        aria-label={tCategories("all")}
        className="border-t border-slate-200 bg-white"
      >
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-8 sm:grid-cols-3 sm:px-6 lg:px-8">
          {[
            {
              title: tCategories("electronics"),
              description: "1000+ SKU",
            },
            {
              title: tCategories("industrial"),
              description: "Heavy-duty grade",
            },
            {
              title: tCategories("logistics"),
              description: "Cross-border ready",
            },
          ].map((card) => (
            <div
              key={card.title}
              className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5 shadow-sm"
            >
              <h3 className="text-sm font-semibold text-slate-900">{card.title}</h3>
              <p className="mt-1 text-xs text-slate-500">{card.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
