import { NextResponse } from "next/server";
import { z } from "zod";

import { createApiHandler } from "@/lib/api-handler";
import { createSupabaseServerClient } from "@/lib/supabase-server";

// =============================================================
// 安全模块 3 · 密码安全（Supabase Auth + bcrypt）
//   - GoTrue 默认使用 bcrypt 存储密码哈希（算法与轮次由 Supabase 托管升级）
//   - 官方说明：https://supabase.com/docs/guides/auth/password-security
//   - 客户端仅 POST 到本路由；middleware 对 /api/auth/* 做 IP 限流（防暴力破解）
//   - Zod 校验邮箱/密码形态；失败返回 401 + INVALID_CREDENTIALS（防用户名枚举）
//   - 失败事件异步写入 security_logs（event_type=Auth Failure）
// =============================================================
const schema = z.object({
  email: z.string().trim().toLowerCase().email().max(120),
  password: z.string().min(6).max(128),
});

export const dynamic = "force-dynamic";

export const POST = createApiHandler(schema, async (body, request) => {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: body.email,
    password: body.password,
  });

  if (error || !data.user) {
    queueAuthFailureLog(request, body.email);
    return NextResponse.json(
      { ok: false, error: "INVALID_CREDENTIALS" },
      { status: 401 },
    );
  }

  return NextResponse.json({
    ok: true,
    user: { id: data.user.id, email: data.user.email },
  });
});

// 异步写入 security_logs（不 await，避免影响 401 响应延迟）
function queueAuthFailureLog(request: Request, email: string) {
  const sourceIp =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  const task = (async () => {
    try {
      const supabase = await createSupabaseServerClient();
      const { error } = await supabase.from("security_logs").insert({
        event_type: "Auth Failure",
        attack_type: "Invalid credential attempt",
        payload: `email=${maskEmail(email)}`,
        source_ip: sourceIp,
        severity: "low",
        defense_level: "api",
        matched_rule: "supabase.auth.signInWithPassword:invalid",
        verdict: "denied",
      });
      if (error) {
        console.error("[security] auth-failure audit failed", error.message);
      }
    } catch (cause) {
      console.error("[security] auth-failure task crashed", cause);
    }
  })();
  task.catch(() => {});
}

// 简单脱敏：只保留首末字符，避免审计表中残留完整邮箱
function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  if (!domain) return "***";
  const safeName =
    name.length <= 2
      ? name[0] + "*"
      : name[0] + "*".repeat(Math.max(1, name.length - 2)) + name.slice(-1);
  return `${safeName}@${domain}`;
}
