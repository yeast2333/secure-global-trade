import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/admin-auth";
import { createSupabaseServiceRoleClient } from "@/lib/supabase-server";
import { orderStatusSchema } from "@/lib/types";
import { sendOrderStatusUpdate } from "@/lib/email";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/admin/orders/[id] — 订单详情 + 状态历史
export async function GET(_request: Request, { params }: RouteContext) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const serviceClient = createSupabaseServiceRoleClient();
  if (!serviceClient) {
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }

  // 获取订单
  const { data: order, error } = await serviceClient
    .from("orders")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !order) {
    return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
  }

  // 获取状态历史
  const { data: history } = await serviceClient
    .from("order_status_history")
    .select("*")
    .eq("order_id", id)
    .order("created_at", { ascending: false });

  return NextResponse.json({
    ok: true,
    data: order,
    statusHistory: history ?? [],
  });
}

const updateSchema = z.object({
  status: orderStatusSchema,
  note: z.string().max(500).optional(),
});

// PUT /api/admin/orders/[id] — 更新订单状态
export async function PUT(request: Request, { params }: RouteContext) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "INVALID_JSON" }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({
      ok: false,
      error: "VALIDATION_FAILED",
      issues: parsed.error.issues.map((i) => ({ path: i.path, code: i.code, message: i.message })),
    }, { status: 422 });
  }

  const { status: newStatus, note } = parsed.data;

  const serviceClient = createSupabaseServiceRoleClient();
  if (!serviceClient) {
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }

  // 获取当前状态（含 user_id，用于邮件）
  const { data: order, error: fetchError } = await serviceClient
    .from("orders")
    .select("status, user_id, items, total_usd")
    .eq("id", id)
    .single();

  if (fetchError || !order) {
    return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
  }

  // 更新订单状态
  const { error: updateError } = await serviceClient
    .from("orders")
    .update({ status: newStatus })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ ok: false, error: "DB_ERROR", message: updateError.message }, { status: 500 });
  }

  // 写入状态变更历史
  await serviceClient.from("order_status_history").insert({
    order_id: id,
    from_status: order.status,
    to_status: newStatus,
    changed_by: auth.admin.id,
    note: note ?? null,
  });

  // 发送邮件通知（异步，不阻塞响应）
  const { data: profile } = await serviceClient
    .from("profiles")
    .select("email")
    .eq("id", order.user_id)
    .single();

  const customerEmail = profile?.email;
  if (customerEmail) {
    sendOrderStatusUpdate({
      orderId: id,
      customerEmail,
      items: (order.items as Array<{ name: string; quantity: number; priceUsd: number }>) ?? [],
      totalUsd: order.total_usd ?? 0,
      newStatus,
    }).catch((e) => console.error("[admin] email send failed", e));
  }

  return NextResponse.json({ ok: true });
}
