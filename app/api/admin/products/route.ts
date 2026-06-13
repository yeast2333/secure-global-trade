import { NextResponse } from "next/server";

import { createApiHandler } from "@/lib/api-handler";
import { adminHandler } from "@/lib/admin-auth";
import { createSupabaseServiceRoleClient } from "@/lib/supabase-server";
import { createProductSchema, productCategoryEnum } from "@/lib/product-schema";

// GET /api/admin/products — 列出所有产品（分页、搜索、按分类筛选）
export const GET = adminHandler(async (_admin, request) => {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize")) || 20));
  const search = searchParams.get("search") || undefined;
  const category = searchParams.get("category") || undefined;

  const serviceClient = createSupabaseServiceRoleClient();
  if (!serviceClient) {
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }

  let query = serviceClient.from("products").select("*", { count: "exact" });

  // 搜索：按中英文名称
  if (search) {
    query = query.or(`name_en.ilike.%${search}%,name_zh.ilike.%${search}%,stock_code.ilike.%${search}%`);
  }

  // 按分类筛选
  if (category && category !== "all") {
    const parsed = productCategoryEnum.safeParse(category);
    if (parsed.success) {
      query = query.eq("category", parsed.data);
    }
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    return NextResponse.json({ ok: false, error: "DB_ERROR", message: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    data: data ?? [],
    total: count ?? 0,
    page,
    pageSize,
  });
});

// POST /api/admin/products — 创建新产品
export const POST = adminHandler(async (_admin, request) => {
  const handler = createApiHandler(createProductSchema, async (payload) => {
    const serviceClient = createSupabaseServiceRoleClient();
    if (!serviceClient) {
      return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
    }

    const { error } = await serviceClient.from("products").insert({
      name_en: payload.nameEn,
      name_zh: payload.nameZh,
      category: payload.category,
      image_url: payload.imageUrl || null,
      price_usd: payload.priceUsd,
      price_cny: payload.priceCny,
      description_en: payload.descriptionEn,
      description_zh: payload.descriptionZh,
      stock_code: payload.stockCode,
    });

    if (error) {
      return NextResponse.json({ ok: false, error: "DB_ERROR", message: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  });

  return handler(request);
});
