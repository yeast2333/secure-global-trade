import { NextResponse } from "next/server";

import { adminHandler } from "@/lib/admin-auth";
import { createSupabaseServiceRoleClient } from "@/lib/supabase-server";

// GET /api/admin/security-logs — 分页筛选安全日志
export const GET = adminHandler(async (_admin, request) => {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize")) || 30));
  const attackType = searchParams.get("attack_type") || undefined;
  const severity = searchParams.get("severity") || undefined;
  const dateFrom = searchParams.get("dateFrom") || undefined;
  const dateTo = searchParams.get("dateTo") || undefined;

  const serviceClient = createSupabaseServiceRoleClient();
  if (!serviceClient) {
    return NextResponse.json(
      { ok: false, error: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }

  let query = serviceClient
    .from("security_logs")
    .select("*", { count: "exact" });

  if (attackType) {
    query = query.eq("attack_type", attackType);
  }

  if (severity) {
    query = query.eq("severity", severity);
  }

  if (dateFrom) {
    query = query.gte("created_at", dateFrom);
  }

  if (dateTo) {
    query = query.lte("created_at", dateTo);
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
