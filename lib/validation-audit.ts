import { createSupabaseServiceRoleClient } from "@/lib/supabase-server";

// 安全模块 4（续）· API 层 Zod 校验失败审计
//   - 使用 service_role 写入，绕过 RLS（未认证请求无法通过 INSERT 策略）
//   - payload 仅记录脱敏后的路径 + 第一条 issue，避免日志灌入用户原始 body

type IssueLite = { path: string; code: string; message: string };

function getSourceIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function recordSchemaValidationAudit(
  request: Request,
  issues: IssueLite[],
) {
  const first = issues[0];
  if (!first) return;

  let pathname = "unknown";
  try {
    pathname = new URL(request.url).pathname;
  } catch {
    /* ignore */
  }

  try {
    const supabase = createSupabaseServiceRoleClient();
    if (!supabase) {
      console.warn("[audit] schema validation log skipped: missing SERVICE_ROLE_KEY");
      return;
    }
    const { error } = await supabase.from("security_logs").insert({
      attack_type: "schema_validation_failed",
      payload: `${pathname} · ${first.path}: ${first.code}`.slice(0, 500),
      client_ip: getSourceIp(request),
      action_taken: "blocked",
      severity: "low",
    });
    if (error) {
      console.warn("[audit] schema validation log skipped", error.message);
    }
  } catch (cause) {
    console.warn("[audit] schema validation audit failed", cause);
  }
}
