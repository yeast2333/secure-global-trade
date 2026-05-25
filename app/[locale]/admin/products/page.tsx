"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  CloudUpload,
  LayoutGrid,
  Trash2,
  ImagePlus,
  ShieldCheck,
  Package,
  Sparkles,
} from "lucide-react";

import { products } from "@/lib/products";

type UploadMode = "manual" | "auto";
type UploadItem = { name: string; preview: string; file: File };
type ExistingImage = Record<string, string>;

export default function AdminProductImagesPage() {
  const router = useRouter();
  const [mode, setMode] = useState<UploadMode>("manual");
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id ?? "");
  const [items, setItems] = useState<UploadItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [existingImages, setExistingImages] = useState<ExistingImage>({});
  const [dragActive, setDragActive] = useState(false);

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedProductId),
    [selectedProductId],
  );

  useEffect(() => {
    let alive = true;
    fetch("/api/admin/product-images")
      .then((response) => response.json())
      .then((data: { ok: boolean; images?: ExistingImage }) => {
        if (alive && data.ok && data.images) setExistingImages(data.images);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      items.forEach((item) => URL.revokeObjectURL(item.preview));
    };
  }, [items]);

  const onFiles = (fileList: FileList | File[]) => {
    const next = Array.from(fileList).map((file) => ({
      file,
      name: file.name,
      preview: URL.createObjectURL(file),
    }));
    setItems(next);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (items.length === 0) {
      toast.error("请先选择图片文件");
      return;
    }

    setSubmitting(true);
    setProgress(15);
    try {
      const formData = new FormData();
      formData.append("mode", mode);
      if (mode === "manual") {
        formData.append("productId", selectedProductId);
      }
      items.forEach((item) => formData.append("files", item.file));

      setProgress(55);
      const response = await fetch("/api/admin/product-images", {
        method: "POST",
        body: formData,
      });
      setProgress(80);
      const result = (await response.json()) as {
        ok: boolean;
        message?: string;
        updates?: Array<{ productId: string; filename: string; url: string }>;
      };

      if (!response.ok || !result.ok) {
        throw new Error(result.message ?? "上传失败");
      }

      result.updates?.forEach((item) => {
        setExistingImages((prev) => ({ ...prev, [item.productId]: item.url }));
      });
      toast.success("图片已更新", {
        description: result.updates?.map((item) => `${item.productId} → ${item.filename}`).join("，"),
      });
      setItems([]);
      setProgress(100);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "上传失败");
    } finally {
      setSubmitting(false);
      setTimeout(() => setProgress(0), 800);
    }
  };

  const removeImage = async (productId: string) => {
    const response = await fetch(`/api/admin/product-images?productId=${encodeURIComponent(productId)}`, {
      method: "DELETE",
    });
    const result = (await response.json()) as { ok: boolean; message?: string };
    if (!response.ok || !result.ok) {
      toast.error(result.message ?? "删除失败");
      return;
    }
    setExistingImages((prev) => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });
    toast.success("图片已删除");
    router.refresh();
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) onFiles(event.target.files);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    if (event.dataTransfer.files?.length) onFiles(event.dataTransfer.files);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="border-b border-white/10 bg-slate-950/80 px-6 py-5 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-400">Admin Console</p>
            <h1 className="mt-1 text-2xl font-bold text-white">商品图片管理中心</h1>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-300">
            <ShieldCheck size={16} />
            本地管理模式
          </div>
        </div>
      </div>

      <main className="mx-auto grid max-w-7xl gap-6 px-6 py-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/20 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-cyan-400/10 p-3 text-cyan-300"><Sparkles size={20} /></div>
            <div>
              <h2 className="text-lg font-semibold text-white">上传与替换</h2>
              <p className="text-sm text-slate-400">支持手动选择商品、拖拽上传、批量预览与进度显示。</p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {[
              { value: "manual", label: "手动选择商品" },
              { value: "auto", label: "按文件名自动匹配" },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setMode(option.value as UploadMode)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  mode === option.value
                    ? "bg-cyan-400 text-slate-950"
                    : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {mode === "manual" && (
            <div className="mt-6">
              <label className="mb-2 block text-sm font-medium text-slate-300">选择商品</label>
              <select
                value={selectedProductId}
                onChange={(event) => setSelectedProductId(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
              >
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.id} · {product.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            className={`mt-6 rounded-3xl border-2 border-dashed p-8 transition ${
              dragActive ? "border-cyan-400 bg-cyan-400/10" : "border-white/15 bg-slate-900/60"
            }`}
          >
            <div className="flex flex-col items-center text-center">
              <div className="rounded-2xl bg-white/5 p-4 text-cyan-300"><CloudUpload size={28} /></div>
              <p className="mt-4 text-base font-semibold text-white">拖拽图片到这里，或点击选择文件</p>
              <p className="mt-1 text-sm text-slate-400">支持 JPG / PNG / WebP / GIF / AVIF</p>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileInputChange}
                className="mt-5 block w-full max-w-sm cursor-pointer rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300 file:mr-4 file:rounded-full file:border-0 file:bg-cyan-400 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-950"
              />
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-3 flex items-center justify-between text-sm text-slate-400">
              <span>上传进度</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 flex items-center gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <ImagePlus size={16} />
              {submitting ? "上传中..." : "上传并替换图片"}
            </button>
            <button
              type="button"
              onClick={() => setItems([])}
              className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-300 hover:bg-white/10"
            >
              清空选择
            </button>
          </form>

          <div className="mt-8">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <LayoutGrid size={16} className="text-cyan-300" />
              批量预览
            </div>
            {items.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-white/10 bg-slate-900/50 p-6 text-sm text-slate-400">当前还没有选择图片。</div>
            ) : (
              <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((item) => (
                  <div key={item.preview} className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60">
                    <div className="relative aspect-square">
                      <Image src={item.preview} alt={item.name} fill className="object-cover" unoptimized />
                    </div>
                    <div className="flex items-center justify-between gap-3 p-3 text-xs text-slate-300">
                      <span className="truncate">{item.name}</span>
                      <button
                        type="button"
                        onClick={() => setItems((prev) => prev.filter((current) => current.preview !== item.preview))}
                        className="inline-flex items-center gap-1 text-rose-300 hover:text-rose-200"
                      >
                        <Trash2 size={14} />
                        移除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <div className="flex items-center gap-2 text-sm font-semibold text-white"><Package size={16} className="text-cyan-300" /> 当前商品预览</div>
            <div className="mt-4 overflow-hidden rounded-3xl border border-white/10 bg-slate-900">
              <div className="relative aspect-square w-full">
                {selectedProduct && (
                  <Image src={existingImages[selectedProduct.id] ?? selectedProduct.imageUrl} alt={selectedProduct.name} fill className="object-cover" unoptimized={Boolean(existingImages[selectedProduct.id])} />
                )}
              </div>
            </div>
            {selectedProduct && (
              <div className="mt-4 space-y-1 text-sm text-slate-300">
                <p className="font-semibold text-white">{selectedProduct.name}</p>
                <p>{selectedProduct.id}</p>
                <p className="text-slate-400">{selectedProduct.category}</p>
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <div className="flex items-center gap-2 text-sm font-semibold text-white"><ImagePlus size={16} className="text-cyan-300" /> 已配置图片</div>
            <div className="mt-4 max-h-[520px] space-y-3 overflow-auto pr-1">
              {products.map((product) => {
                const src = existingImages[product.id] ?? product.imageUrl;
                return (
                  <div key={product.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/70 p-3">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                      <Image src={src} alt={product.name} fill className="object-cover" unoptimized={Boolean(existingImages[product.id])} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">{product.id} · {product.name}</p>
                      <p className="truncate text-xs text-slate-400">{src}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeImage(product.id)}
                      className="inline-flex items-center gap-1 rounded-full border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/20"
                    >
                      <Trash2 size={14} />
                      删除
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
