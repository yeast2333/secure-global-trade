import type { Product, ProductCategory } from "@/lib/products";

// 数据库产品行类型（对应实际 Supabase public.products 表）
export type DbProduct = {
  id: string;             // uuid
  name_en: string;
  name_zh: string;
  price_usd: number;
  price_cny: number;
  category: string;
  image_url: string | null;
  description_en: string | null;
  description_zh: string | null;
  stock_code: string | null;
  created_at: string;
};

/**
 * 将数据库行转换为前端 Product 类型（用于前端展示）
 * 注意：数据库用 uuid，无 P-#### 格式，前端 Product.id 仍保留原值
 */
export function dbToProduct(db: DbProduct, locale?: string): Product {
  const isZh = locale === "zh";
  return {
    id: db.id,
    name: isZh ? db.name_zh : db.name_en,
    category: db.category as ProductCategory,
    imageUrl: db.image_url ?? "",
    priceUsd: Number(db.price_usd),
    priceUsdOriginal: Number(db.price_cny),
    stock: 0,
    batchNo: db.stock_code ?? "",
    description: isZh ? (db.description_zh ?? "") : (db.description_en ?? ""),
  };
}

/**
 * Admin 列表用的数据库原始行类型
 */
export type AdminProductRow = DbProduct;
