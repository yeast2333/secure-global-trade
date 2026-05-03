"use client";

import { useTranslations } from "next-intl";

import type { Product } from "@/lib/products";

/** 商品展示名称：随界面语言读取 catalog.{id}.name（与 messages/catalog/{locale}.json 对齐） */
export function useProductName(product: Pick<Product, "id" | "name">): string {
  const t = useTranslations("catalog");
  return t(`${product.id}.name` as never);
}

/** 商品描述：随界面语言读取 catalog.{id}.description */
export function useProductDescription(
  product: Pick<Product, "id" | "description">,
): string {
  const t = useTranslations("catalog");
  return t(`${product.id}.description` as never);
}
