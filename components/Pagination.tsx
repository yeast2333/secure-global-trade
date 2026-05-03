"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

type PaginationProps = {
  page: number;
  totalPages: number;
  onChange: (next: number) => void;
};

// 简单分页：当前页 + 前后各 1，加省略号缩略
export default function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages: (number | "...")[] = [];
  const push = (value: number | "...") => {
    if (pages[pages.length - 1] === value) return;
    pages.push(value);
  };

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) {
      push(i);
    } else if (Math.abs(i - page) === 2) {
      push("...");
    }
  }

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-wrap items-center justify-center gap-1 pt-2"
    >
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-slate-400 hover:text-slate-900 disabled:opacity-40"
      >
        <ChevronLeft size={16} />
      </button>

      {pages.map((value, index) =>
        value === "..." ? (
          <span
            key={`ellipsis-${index}`}
            className="inline-flex h-9 w-9 items-center justify-center text-xs text-slate-400"
          >
            ...
          </span>
        ) : (
          <button
            key={value}
            type="button"
            onClick={() => onChange(value)}
            aria-current={value === page ? "page" : undefined}
            className={`inline-flex h-9 min-w-9 items-center justify-center rounded-full border px-3 text-xs font-semibold transition ${
              value === page
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-400 hover:text-slate-900"
            }`}
          >
            {value}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-slate-400 hover:text-slate-900 disabled:opacity-40"
      >
        <ChevronRight size={16} />
      </button>
    </nav>
  );
}
