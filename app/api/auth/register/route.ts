import { NextResponse } from "next/server";
import { z } from "zod";

import { createSupabaseAuthRouteClient } from "@/lib/supabase-server";

// =============================================================
// 安全模块 3 · 密码安全（Supabase Auth + bcrypt）
//   - signUp 由 Supabase 服务端 bcrypt 哈希后再写入 auth.users
//   - 文档：https://supabase.com/docs/guides/auth/password-security
//   - Zod：邮箱 + 密码 ≥ 8；同 IP 受 middleware 登录类接口限流
//   - 若有 session：Cookie 必须附加到 NextResponse（见 createSupabaseAuthRouteClient）
// =============================================================
const schema = z.object({
  email: z.string().trim().toLowerCase().email().max(120),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128),
});

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "INVALID_JSON" }, { status: 400 });
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => ({
      path: issue.path.join("."),
      code: issue.code,
      message: issue.message,
    }));
    return NextResponse.json(
      { ok: false, error: "VALIDATION_FAILED", issues },
      { status: 422 },
    );
  }

  const body = parsed.data;
  const { supabase, attachAuthCookies } = await createSupabaseAuthRouteClient();

  const { data, error } = await supabase.auth.signUp({
    email: body.email,
    password: body.password,
  });

  if (error) {
    return NextResponse.json(
      { ok: false, error: "REGISTRATION_FAILED", message: error.message },
      { status: 400 },
    );
  }

  const res = NextResponse.json({
    ok: true,
    user: data.user
      ? { id: data.user.id, email: data.user.email }
      : null,
    needsEmailConfirmation: !data.session,
  });

  if (data.session) {
    attachAuthCookies(res);
  }

  return res;
}
