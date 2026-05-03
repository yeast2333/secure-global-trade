import { z } from "zod";

// 安全模块 4 · 注入预防 — URL / body 中的商品 ID
//   1. 正则锁定 P- 前缀
//   2. parseInt 将数字段强制为整数，拒绝非数字、前导零混淆、溢出
//   3. 输出规范化为 P-#### 四位（与 lib/products.ts 一致）
export const productIdSchema = z
  .string()
  .trim()
  .regex(/^P-\d{1,6}$/i, "Invalid product id format")
  .transform((raw, ctx) => {
    const suffix = raw.slice(2);
    const seq = parseInt(suffix, 10);
    if (!Number.isFinite(seq) || String(seq) !== suffix) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Product id must use canonical decimal form",
      });
      return z.NEVER;
    }
    if (seq < 1000 || seq > 9999) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Product seq out of allowed range",
      });
      return z.NEVER;
    }
    return `P-${String(seq).padStart(4, "0")}`;
  });

export type ProductId = z.infer<typeof productIdSchema>;
