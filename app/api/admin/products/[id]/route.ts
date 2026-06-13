import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import { createSupabaseServiceRoleClient } from "@/lib/supabase-server";
import { updateProductSchema } from "@/lib/product-schema";
import { createApiHandler } from "@/lib/api-handler";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/admin/products/[id] — 获取单个产品
export async function GET(_request: Request, { params }: RouteContext) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const serviceClient = createSupabaseServiceRoleClient();
  if (!serviceClient) {
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }

  const { data, error } = await serviceClient
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, data });
}

// PUT /api/admin/products/[id] — 更新产品
export async function PUT(request: Request, { params }: RouteContext) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  const handler = createApiHandler(updateProductSchema, async (payload) => {
    const serviceClient = createSupabaseServiceRoleClient();
    if (!serviceClient) {
      return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
    }

    // 检查产品是否存在
    const { error: checkError } = await serviceClient
      .from("products")
      .select("id")
      .eq("id", id)
      .single();

    if (checkError) {
      return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    }

    // 构建更新对象（只更新传入的字段）
    const updates: Record<string, unknown> = {};
    if (payload.nameEn !== undefined) updates.name_en = payload.nameEn;
    if (payload.nameZh !== undefined) updates.name_zh = payload.nameZh;
    if (payload.category !== undefined) updates.category = payload.category;
    if (payload.priceUsd !== undefined) updates.price_usd = payload.priceUsd;
    if (payload.priceCny !== undefined) updates.price_cny = payload.priceCny;
    if (payload.descriptionEn !== undefined) updates.description_en = payload.descriptionEn;
    if (payload.descriptionZh !== undefined) updates.description_zh = payload.descriptionZh;
    if (payload.stockCode !== undefined) updates.stock_code = payload.stockCode;
    if (payload.imageUrl !== undefined) updates.image_url = payload.imageUrl || null;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ ok: false, error: "NO_FIELDS" }, { status: 400 });
    }

    const { error } = await serviceClient
      .from("products")
      .update(updates)
      .eq("id", id);

    if (error) {
      return NextResponse.json({ ok: false, error: "DB_ERROR", message: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  });

  return handler(request);
}

// DELETE /api/admin/products/[id] — 删除产品
export async function DELETE(_request: Request, { params }: RouteContext) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const serviceClient = createSupabaseServiceRoleClient();
  if (!serviceClient) {
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }

  const { error } = await serviceClient.from("products").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ ok: false, error: "DB_ERROR", message: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
