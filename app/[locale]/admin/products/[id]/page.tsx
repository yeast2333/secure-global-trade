"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter as useNextRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";

import { Link } from "@/i18n/navigation";

type ProductForm = {
  nameEn: string;
  nameZh: string;
  category: string;
  priceUsd: string;
  priceCny: string;
  descriptionEn: string;
  descriptionZh: string;
  stockCode: string;
  imageUrl: string;
};

const EMPTY_FORM: ProductForm = {
  nameEn: "", nameZh: "", category: "electronics",
  priceUsd: "", priceCny: "",
  descriptionEn: "", descriptionZh: "",
  stockCode: "", imageUrl: "",
};

const CATEGORIES = ["electronics", "home", "industrial", "ppe", "logistics"];

export default function AdminProductEditPage() {
  const t = useTranslations();
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useNextRouter();
  const isNew = searchParams.get("new") === "true";
  const productId = params.id as string;

  const [form, setForm] = useState<ProductForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isNew) { setForm(EMPTY_FORM); setLoading(false); return; }

    async function fetchProduct() {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/products/${productId}`);
        const data = await res.json();
        if (data.ok && data.data) {
          const p = data.data;
          setForm({
            nameEn: p.name_en ?? "",
            nameZh: p.name_zh ?? "",
            category: p.category ?? "electronics",
            priceUsd: p.price_usd != null ? String(p.price_usd) : "",
            priceCny: p.price_cny != null ? String(p.price_cny) : "",
            descriptionEn: p.description_en ?? "",
            descriptionZh: p.description_zh ?? "",
            stockCode: p.stock_code ?? "",
            imageUrl: p.image_url ?? "",
          });
        } else { toast.error("Product not found"); }
      } catch { toast.error("Failed to load product"); }
      finally { setLoading(false); }
    }

    fetchProduct();
  }, [productId, isNew]);

  const handleChange = (field: keyof ProductForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const body = {
      nameEn: form.nameEn,
      nameZh: form.nameZh,
      category: form.category,
      priceUsd: Number(form.priceUsd) || 0,
      priceCny: Number(form.priceCny) || 0,
      descriptionEn: form.descriptionEn,
      descriptionZh: form.descriptionZh,
      stockCode: form.stockCode,
      imageUrl: form.imageUrl || undefined,
    };

    try {
      const url = isNew ? "/api/admin/products" : `/api/admin/products/${productId}`;
      const method = isNew ? "POST" : "PUT";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success(isNew ? t("admin.products.form.createSuccess") : t("admin.products.form.updateSuccess"));
        router.push("/admin/products");
      } else {
        toast.error(data.message ?? data.error ?? "Save failed");
      }
    } catch { toast.error("Network error"); }
    finally { setSaving(false); }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><p className="text-slate-400">Loading...</p></div>;
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link href="/admin/products" className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white">
          <ArrowLeft size={20} /></Link>
        <h1 className="text-2xl font-bold text-white">
          {isNew ? t("admin.products.form.createTitle") : t("admin.products.form.editTitle", { name: form.nameEn || form.nameZh })}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Name (English)</label>
            <input type="text" value={form.nameEn} onChange={(e) => handleChange("nameEn", e.target.value)} required
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-cyan-500" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">名称 (中文)</label>
            <input type="text" value={form.nameZh} onChange={(e) => handleChange("nameZh", e.target.value)} required
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-cyan-500" />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">{t("admin.products.form.category")}</label>
            <select value={form.category} onChange={(e) => handleChange("category", e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-cyan-500">
              {CATEGORIES.map((cat) => (<option key={cat} value={cat}>{t(`categories.${cat}`)}</option>))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Price USD</label>
            <input type="number" step="0.01" min="0" value={form.priceUsd} onChange={(e) => handleChange("priceUsd", e.target.value)} required
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-cyan-500" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Price CNY</label>
            <input type="number" step="0.01" min="0" value={form.priceCny} onChange={(e) => handleChange("priceCny", e.target.value)} required
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-cyan-500" />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-300">Stock Code</label>
          <input type="text" value={form.stockCode} onChange={(e) => handleChange("stockCode", e.target.value)} required
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-cyan-500" />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Description (English)</label>
            <textarea value={form.descriptionEn} onChange={(e) => handleChange("descriptionEn", e.target.value)} rows={3} required
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-cyan-500" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">描述 (中文)</label>
            <textarea value={form.descriptionZh} onChange={(e) => handleChange("descriptionZh", e.target.value)} rows={3} required
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-cyan-500" />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-300">Image URL</label>
          <input type="url" value={form.imageUrl} onChange={(e) => handleChange("imageUrl", e.target.value)}
            placeholder="https://..."
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-cyan-500 placeholder:text-slate-600" />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button type="submit" disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-cyan-400 disabled:opacity-50 transition">
            <Save size={16} />{saving ? "Saving..." : t("admin.products.form.save")}</button>
          <Link href="/admin/products"
            className="rounded-lg px-5 py-2.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition">
            {t("admin.products.form.cancel")}</Link>
        </div>
      </form>
    </div>
  );
}
