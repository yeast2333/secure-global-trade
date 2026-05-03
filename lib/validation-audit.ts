import { createSupabaseServerClient } from "@/lib/supabase-server";

// 安全模块 4（续）· API 层 Zod 校验失败审计
//   - 与业务成功路径解耦：异步 insert，不 await，避免 422 响应变慢
//   - event_type = Schema Validation，供安全看板「注入预防」模块统计拦截次数
//   - payload 仅记录脱敏后的路径 + 第一条 issue，避免日志灌入用户原始 body

type IssueLite = { path: string; code: string; message: string };

function getSourceIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

export function queueSchemaValidationAudit(request: Request, issues: IssueLite[]) {
  const first = issues[0];
  if (!first) return;

  let pathname = "unknown";
  try {
    pathname = new URL(request.url).pathname;
  } catch {
    /* ignore */
  }

  const task = (async () => {
    try {
      const supabase = await createSupabaseServerClient();
      const { error } = await supabase.from("security_logs").insert({
        event_type: "Schema Validation",
        attack_type: "Zod schema rejection (injection / type confusion)",
        payload: `${pathname} · ${first.path}: ${first.code}`.slice(0, 500),
        source_ip: getSourceIp(request),
        severity: "low",
        defense_level: "api",
        matched_rule: first.path || "zod",
        verdict: "blocked",
      });
      if (error) {
        console.warn("[audit] schema validation log skipped", error.message);
      }
    } catch (cause) {
      console.warn("[audit] schema validation task failed", cause);
    }
  })();
  task.catch(() => {});
}
