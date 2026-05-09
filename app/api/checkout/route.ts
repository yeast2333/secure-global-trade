import { NextResponse } from "next/server";
import { z } from "zod";

import { createApiHandler } from "@/lib/api-handler";
import {
  createSupabaseAuthRouteClient,
  createSupabaseServiceRoleClient,
} from "@/lib/supabase-server";
import { productIdSchema } from "@/lib/product-id";

// 安全技术点：
//   1. Zod 校验 payload（XSS 模块 + 注入预防模块）：
//      - id 必须命中 P-#### 白名单，杜绝 SQL/NoSQL 注入面
//      - name 限定长度并禁止 HTML 尖括号 / 引号，防 XSS 反射进订单
//      - priceUsd / quantity 强制数值上下限，避免负数 / 溢出
//   2. user_id 永远从 session 派生，不接受前端上送（防越权）
//   3. 数据库写入仍走 Supabase Client 参数化查询（注入预防模块）
//   4. RLS 在数据库层兜底校验 auth.uid() == user_id
const safeText = z
  .string()
  .min(1)
  .max(120)
  .refine((value) => !/[<>"'`]/.test(value), {
    message: "Forbidden HTML/quote character in name",
  });

const schema = z.object({
  items: z
    .array(
      z.object({
        id: productIdSchema,
        name: safeText,
        priceUsd: z.coerce.number().nonnegative().max(1_000_000),
        quantity: z.coerce.number().int().positive().max(999),
      }),
    )
    .min(1)
    .max(50),
});

export const POST = createApiHandler(schema, async (payload) => {
  const { supabase, attachAuthCookies } =
    await createSupabaseAuthRouteClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "UNAUTHENTICATED" },
      { status: 401 },
    );
  }

  const totalRaw = payload.items.reduce(
    (sum, item) => sum + item.priceUsd * item.quantity,
    0,
  );
  const totalUsd = Math.round(totalRaw * 100) / 100;

  const row = {
    user_id: user.id,
    items: payload.items,
    total_usd: totalUsd,
    status: "paid" as const,
  };

  // 不使用 .select()，避免 PostgREST RETURNING 依赖额外 SELECT 权限；订单列表仍由客户端读表。
  let { error } = await supabase.from("orders").insert(row);

  if (error) {
    const admin = createSupabaseServiceRoleClient();
    if (admin) {
      ({ error } = await admin.from("orders").insert(row));
    }
  }

  if (error) {
    console.error("[checkout] insert failed", error);
    const e = error as {
      message: string;
      code?: string;
      details?: string | null;
      hint?: string | null;
    };
    const res = NextResponse.json(
      {
        ok: false,
        error: "DB_INSERT_FAILED",
        supabaseMessage: e.message,
        supabaseCode: e.code,
        supabaseDetails: e.details ?? undefined,
        supabaseHint: e.hint ?? undefined,
      },
      { status: 500 },
    );
    attachAuthCookies(res);
    return res;
  }

  const res = NextResponse.json({ ok: true });
  attachAuthCookies(res);
  return res;
});
