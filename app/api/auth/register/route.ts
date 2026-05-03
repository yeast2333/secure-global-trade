import { NextResponse } from "next/server";
import { z } from "zod";

import { createApiHandler } from "@/lib/api-handler";
import { createSupabaseServerClient } from "@/lib/supabase-server";

// =============================================================
// 安全模块 3 · 密码安全（Supabase Auth + bcrypt）
//   - signUp 由 Supabase 服务端 bcrypt 哈希后再写入 auth.users
//   - 文档：https://supabase.com/docs/guides/auth/password-security
//   - Zod：邮箱 + 密码 ≥ 8；同 IP 受 middleware 登录类接口限流
// =============================================================
const schema = z.object({
  email: z.string().trim().toLowerCase().email().max(120),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128),
});

export const dynamic = "force-dynamic";

export const POST = createApiHandler(schema, async (body) => {
  const supabase = await createSupabaseServerClient();

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

  return NextResponse.json({
    ok: true,
    user: data.user
      ? { id: data.user.id, email: data.user.email }
      : null,
    needsEmailConfirmation: !data.session,
  });
});
