"use client";

import { useTranslations } from "next-intl";

import {
  productCategories,
  type ProductCategory,
} from "@/lib/products";

export type CategoryValue = "all" | ProductCategory;

type CategoryTabsProps = {
  value: CategoryValue;
  onChange: (next: CategoryValue) => void;
};

export default function CategoryTabs({ value, onChange }: CategoryTabsProps) {
  const t = useTranslations("categories");
  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
      {productCategories.map((category) => {
        const active = category === value;
        return (
          <button
            key={category}
            type="button"
            onClick={() => onChange(category)}
            className={`shrink-0 rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
              active
                ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-400 hover:text-slate-900"
            }`}
          >
            {t(category)}
          </button>
        );
      })}
    </div>
  );
}
