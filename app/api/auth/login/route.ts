import { NextResponse } from "next/server";
import { z } from "zod";

import {
  createSupabaseAuthRouteClient,
  createSupabaseServiceRoleClient,
  createSupabaseServerClient,
} from "@/lib/supabase-server";

// =============================================================
// 安全模块 3 · 密码安全（Supabase Auth + bcrypt）
//   - 会话 Cookie 必须附加到 NextResponse（见 createSupabaseAuthRouteClient）
// =============================================================
const schema = z.object({
  email: z.string().trim().toLowerCase().email().max(120),
  password: z.string().min(6).max(128),
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

  const { data, error } = await supabase.auth.signInWithPassword({
    email: body.email,
    password: body.password,
  });

  if (error || !data.user) {
    await recordAuthFailureAudit(request, body.email);
    return NextResponse.json(
      { ok: false, error: "INVALID_CREDENTIALS" },
      { status: 401 },
    );
  }

  const res = NextResponse.json({
    ok: true,
    user: { id: data.user.id, email: data.user.email },
  });
  attachAuthCookies(res);
  return res;
}

async function recordAuthFailureAudit(request: Request, email: string) {
  const sourceIp =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  try {
    const supabase = createSupabaseServiceRoleClient() ?? (await createSupabaseServerClient());
    const { error } = await supabase.from("security_logs").insert({
      attack_type: "auth_failure_login",
      payload: `email=${maskEmail(email)}`,
      client_ip: sourceIp,
      action_taken: "denied",
      severity: "low",
    });
    if (error) {
      console.error("[security] auth-failure audit failed", error.message);
    }
  } catch (cause) {
    console.error("[security] auth-failure audit crashed", cause);
  }
}

function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  if (!domain) return "***";
  const safeName =
    name.length <= 2
      ? name[0] + "*"
      : name[0] + "*".repeat(Math.max(1, name.length - 2)) + name.slice(-1);
  return `${safeName}@${domain}`;
}
