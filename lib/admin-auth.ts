import { NextResponse } from "next/server";
import {
  createSupabaseServerClient,
  createSupabaseServiceRoleClient,
} from "@/lib/supabase-server";

export type AdminUser = {
  id: string;
  email: string;
};

/**
 * 验证当前会话是否属于管理员。
 * 用于 API 路由：getUser → 查 profiles.is_admin → 返回 AdminUser 或 401/403 响应。
 *
 * 使用方式：
 *   const result = await requireAdmin();
 *   if (result instanceof NextResponse) return result;
 *   const { admin } = result;
 */
export async function requireAdmin(): Promise<
  { admin: AdminUser } | NextResponse
> {
  // 1. 从 cookie 获取当前用户
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json(
      { ok: false, error: "UNAUTHENTICATED" },
      { status: 401 },
    );
  }

  // 2. 通过 service_role 查询 is_admin（绕过 RLS）
  const serviceClient = createSupabaseServiceRoleClient();
  if (!serviceClient) {
    return NextResponse.json(
      { ok: false, error: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }

  const { data: profile, error: profileError } = await serviceClient
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (profileError || !profile?.is_admin) {
    return NextResponse.json(
      { ok: false, error: "FORBIDDEN" },
      { status: 403 },
    );
  }

  return {
    admin: { id: user.id, email: user.email ?? "" },
  };
}

/**
 * 管理员 API 路由包装器：自动执行 requireAdmin，只把 AdminUser 传给 handler。
 *
 * 使用方式：
 *   export const GET = adminHandler(async (admin) => { ... });
 */
export function adminHandler(
  handler: (admin: AdminUser, request: Request) => Promise<NextResponse>,
) {
  return async (request: Request) => {
    const result = await requireAdmin();
    if (result instanceof NextResponse) return result;
    return handler(result.admin, request);
  };
}
