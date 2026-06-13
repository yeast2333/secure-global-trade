import { NextResponse } from "next/server";
import { adminHandler } from "@/lib/admin-auth";
import { createSupabaseServiceRoleClient } from "@/lib/supabase-server";
import { orderStatusSchema } from "@/lib/types";

// GET /api/admin/orders — 列出所有订单（分页、状态/搜索过滤）
export const GET = adminHandler(async (_admin, request) => {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize")) || 20));
  const status = searchParams.get("status") || undefined;
  const search = searchParams.get("search") || undefined;

  const serviceClient = createSupabaseServiceRoleClient();
  if (!serviceClient) {
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }

  let query = serviceClient.from("orders").select("*", { count: "exact" });

  // 按状态筛选
  if (status) {
    const parsed = orderStatusSchema.safeParse(status);
    if (parsed.success) {
      query = query.eq("status", parsed.data);
    }
  }

  // 搜索：按订单 ID 或用户 ID
  if (search) {
    query = query.or(`id.eq.${search},user_id.eq.${search}`);
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
