import { NextResponse } from "next/server";
import { z } from "zod";

import {
  createSupabaseAuthRouteClient,
  createSupabaseServiceRoleClient,
} from "@/lib/supabase-server";

const schema = z.object({
  email: z.string().trim().toLowerCase().email().max(120),
  password: z.string().min(6).max(128),
});

// POST /api/admin/login — 管理员专用登录（验证 is_admin）
// 参考 app/api/auth/login/route.ts 的格式，但额外检查 profiles.is_admin
export async function POST(request: Request) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "INVALID_JSON" },
      { status: 400 },
    );
  }

  const parsed = schema.safeParse(raw);
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

  const { email, password } = parsed.data;

  // 1. 先尝试登录
  const { supabase, attachAuthCookies } =
    await createSupabaseAuthRouteClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    const res = NextResponse.json(
      {
        ok: false,
        error: "INVALID_CREDENTIALS",
        message: error?.message ?? "Authentication failed",
      },
      { status: 401 },
    );
    attachAuthCookies(res);
    return res;
  }

  // 2. 检查是否为管理员
  const serviceClient = createSupabaseServiceRoleClient();
  if (!serviceClient) {
    const res = NextResponse.json(
      { ok: false, error: "INTERNAL_ERROR" },
      { status: 500 },
    );
    attachAuthCookies(res);
    return res;
  }

  const { data: profile } = await serviceClient
    .from("profiles")
    .select("is_admin")
    .eq("id", data.user.id)
    .single();

  if (!profile?.is_admin) {
    // 不是管理员 → 登出并返回 403
    await supabase.auth.signOut();
    const res = NextResponse.json(
      { ok: false, error: "FORBIDDEN", message: "Not an admin account" },
      { status: 403 },
    );
    attachAuthCookies(res);
    return res;
  }

  // 3. 管理员验证通过
  const res = NextResponse.json({
    ok: true,
    user: {
      id: data.user.id,
      email: data.user.email,
      isAdmin: true,
    },
  });
  attachAuthCookies(res);
  return res;
}
