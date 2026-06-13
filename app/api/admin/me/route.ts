import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

// GET /api/admin/me — 返回当前用户的管理员状态
export async function GET() {
  const result = await requireAdmin();

  if (result instanceof NextResponse) {
    return result;
  }

  return NextResponse.json({
    ok: true,
    user: {
      id: result.admin.id,
      email: result.admin.email,
      isAdmin: true,
    },
  });
}
