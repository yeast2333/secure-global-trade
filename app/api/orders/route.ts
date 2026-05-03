import { NextResponse } from "next/server";
import { z } from "zod";

import { createApiHandler } from "@/lib/api-handler";
import { productIdSchema } from "@/lib/product-id";

// 仅作演示：实际下单流程在 /api/checkout
// 安全模块 4 · 注入预防：productId 同商品详情页一致（Zod + parseInt 规范化）
const schema = z.object({
  productId: productIdSchema,
  quantity: z.coerce.number().int().positive().max(999),
});

export const POST = createApiHandler(schema, async (payload) => {
  return NextResponse.json({ ok: true, payload });
});
