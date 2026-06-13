import { NextResponse } from "next/server";

import { adminHandler } from "@/lib/admin-auth";
import { createSupabaseServiceRoleClient } from "@/lib/supabase-server";

// GET /api/admin/users — 列出所有用户（分页、搜索）
export const GET = adminHandler(async (_admin, request) => {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize")) || 20));
  const search = searchParams.get("search") || undefined;

  const serviceClient = createSupabaseServiceRoleClient();
  if (!serviceClient) {
    return NextResponse.json(
      { ok: false, error: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }

  // 从 profiles 表查询（Supabase free tier 不支持 auth.admin.listUsers）
  let query = serviceClient
    .from("profiles")
    .select("id, email, is_admin, created_at", { count: "exact" });

  if (search) {
    query = query.ilike("email", `%${search}%`);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    return NextResponse.json(
      { ok: false, error: "DB_ERROR", message: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    data: data ?? [],
    total: count ?? 0,
    page,
    pageSize,
  });
});
