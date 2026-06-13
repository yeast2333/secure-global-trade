import { z } from "zod";

export const productCategoryEnum = z.enum([
  "electronics",
  "home",
  "industrial",
  "ppe",
  "logistics",
]);

// 匹配实际 Supabase products 表结构
export const createProductSchema = z.object({
  nameEn: z.string().min(1).max(200),
  nameZh: z.string().min(1).max(200),
  category: productCategoryEnum,
  priceUsd: z.coerce.number().nonnegative().max(1_000_000),
  priceCny: z.coerce.number().nonnegative().max(10_000_000),
  imageUrl: z.string().url().optional().or(z.literal("")),
  descriptionEn: z.string().min(1).max(2000),
  descriptionZh: z.string().min(1).max(2000),
  stockCode: z.string().min(1).max(50),
});

export const updateProductSchema = createProductSchema.partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
