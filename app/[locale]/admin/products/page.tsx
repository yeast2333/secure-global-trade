"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Plus, Pencil, Trash2, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

import { Link } from "@/i18n/navigation";

type Product = {
  id: string;
  name_en: string;
  name_zh: string;
  category: string;
  image_url: string | null;
  price_usd: number;
  price_cny: number;
  stock_code: string;
  description_en: string;
  description_zh: string;
  created_at: string;
};

const PAGE_SIZE = 12;

function AdminProductsList() {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const isNew = searchParams.get("new") === "true";

  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", String(PAGE_SIZE));
      if (search) params.set("search", search);
      if (category && category !== "all") params.set("category", category);

      const res = await fetch(`/api/admin/products?${params}`);
      const data = await res.json();
      if (data.ok) {
        setProducts(data.data);
        setTotal(data.total);
      }
    } catch {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [page, search, category]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => { if (isNew) fetchProducts(); }, [isNew, fetchProducts]);

  const handleDelete = async (product: Product) => {
    if (!confirm(t("admin.products.list.confirmDelete", { name: product.name_en }))) return;
    const res = await fetch(`/api/admin/products/${product.id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.ok) {
      toast.success(t("admin.products.form.deleteSuccess"));
      fetchProducts();
    } else {
      toast.error(data.message ?? "Delete failed");
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const categories = ["all", "electronics", "home", "industrial", "ppe", "logistics"];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-white">{t("admin.products.title")}</h1>
        <Link
          href="/admin/products/new?new=true"
          className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-400 transition"
        >
          <Plus size={16} />
          {t("admin.products.list.createNew")}
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="flex items-center rounded-lg border border-slate-700 bg-slate-900 px-3 py-2">
          <Search size={14} className="text-slate-400" />
          <input type="search" value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder={t("admin.products.list.search")}
            className="ml-2 w-56 bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-500" />
        </div>
        <select value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1); }}
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 outline-none">
          <option value="all">{t("admin.products.list.filterCategory")}</option>
          {categories.filter((c) => c !== "all").map((cat) => (
            <option key={cat} value={cat}>{t(`categories.${cat}`)}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-800 bg-slate-900/50">
            <tr>
              <th className="px-4 py-3 text-slate-400 font-medium">{t("admin.products.list.image")}</th>
              <th className="px-4 py-3 text-slate-400 font-medium">{t("admin.products.list.name")} (EN/ZH)</th>
              <th className="px-4 py-3 text-slate-400 font-medium">{t("admin.products.list.category")}</th>
              <th className="px-4 py-3 text-right text-slate-400 font-medium">USD / CNY</th>
              <th className="px-4 py-3 text-slate-400 font-medium">Stock Code</th>
              <th className="px-4 py-3 text-right text-slate-400 font-medium">{t("admin.products.list.actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-500">Loading...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-500">{t("admin.products.list.empty")}</td></tr>
            ) : (
              products.map((p) => (
                <tr key={p.id} className="hover:bg-slate-900/30 transition">
                  <td className="px-4 py-3">
                    {p.image_url ? (
                      <Image src={p.image_url} alt={p.name_en} width={40} height={40} className="rounded-md object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded-md bg-slate-800" />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-slate-200 text-xs">{p.name_en}</p>
                    <p className="text-slate-500 text-[10px]">{p.name_zh}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-300">
                      {t(`categories.${p.category}`)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <p className="text-slate-200 text-xs">${Number(p.price_usd).toFixed(2)}</p>
                    <p className="text-slate-500 text-[10px]">¥{Number(p.price_cny).toFixed(2)}</p>
                  </td>
                  <td className="px-4 py-3 font-mono text-[10px] text-slate-400">{p.stock_code}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/admin/products/${p.id}`}
                        className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-cyan-400 transition">
                        <Pencil size={14} />
                      </Link>
                      <button type="button" onClick={() => handleDelete(p)}
                        className="rounded-md p-1.5 text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-slate-400">
          <span>{total} products</span>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
              className="rounded-md p-1 hover:bg-slate-800 disabled:opacity-30">
              <ChevronLeft size={16} /></button>
            <span>{page} / {totalPages}</span>
            <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
              className="rounded-md p-1 hover:bg-slate-800 disabled:opacity-30">
              <ChevronRight size={16} /></button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminProductsPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-slate-400">Loading...</div>}>
      <AdminProductsList />
    </Suspense>
  );
}
