import { NextResponse } from "next/server";
import { z } from "zod";

import { createApiHandler } from "@/lib/api-handler";
import { productIdSchema } from "@/lib/product-id";

// 演示用：仅校验 productId。非法值 → 422 + Schema Validation 审计（注入预防看板 +1）
const schema = z.object({
  productId: productIdSchema,
});

export const dynamic = "force-dynamic";

export const POST = createApiHandler(schema, async (body) => {
  return NextResponse.json({
    ok: true,
    message: "ID passed strict Zod + parseInt normalization",
    normalized: body.productId,
  });
});
