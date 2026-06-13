import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/admin-auth";
import { createSupabaseServiceRoleClient } from "@/lib/supabase-server";

type RouteContext = { params: Promise<{ id: string }> };

const toggleSchema = z.object({
  isAdmin: z.boolean(),
});

// PUT /api/admin/users/[id] — 切换管理员状态
export async function PUT(request: Request, { params }: RouteContext) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  // 防止自我降级
  if (id === auth.admin.id) {
    return NextResponse.json(
      { ok: false, error: "CANNOT_MODIFY_SELF" },
      { status: 400 },
    );
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "INVALID_JSON" },
      { status: 400 },
    );
  }

  const parsed = toggleSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "VALIDATION_FAILED",
        issues: parsed.error.issues.map((i) => ({
          path: i.path,
          code: i.code,
          message: i.message,
        })),
      },
      { status: 422 },
    );
  }

  const { isAdmin } = parsed.data;
  const serviceClient = createSupabaseServiceRoleClient();
  if (!serviceClient) {
    return NextResponse.json(
      { ok: false, error: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }

  const { error } = await serviceClient
    .from("profiles")
    .update({ is_admin: isAdmin, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { ok: false, error: "DB_ERROR", message: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
