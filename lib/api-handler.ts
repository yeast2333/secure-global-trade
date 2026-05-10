import { NextResponse } from "next/server";
import { ZodError, type ZodSchema } from "zod";

import { recordSchemaValidationAudit } from "@/lib/validation-audit";

// 安全技术点：统一 API 包装器
//   1. 强制使用 zod 进行输入白名单校验，拒绝任何非法字段
//   2. 错误响应永不泄露内部堆栈，只返回结构化的字段错误
//   3. JSON 解析失败按 400 处理，避免 500 给攻击者反馈
//   4. 422 时 await 写入 security_logs（Schema Validation），支撑注入预防看板计数（Serverless 须落库后再返回）
export type ApiHandler<TBody> = (
  payload: TBody,
  request: Request,
) => Promise<NextResponse> | NextResponse;

export function createApiHandler<TBody>(
  schema: ZodSchema<TBody>,
  handler: ApiHandler<TBody>,
) {
  return async (request: Request) => {
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
      const error = parsed.error as ZodError;
      const issues = error.issues.map((issue) => ({
        path: issue.path.join("."),
        code: issue.code,
        message: issue.message,
      }));
      await recordSchemaValidationAudit(request, issues);
      return NextResponse.json(
        {
          ok: false,
          error: "VALIDATION_FAILED",
          issues,
        },
        { status: 422 },
      );
    }

    try {
      return await handler(parsed.data, request);
    } catch (cause) {
      console.error("[api-handler] unexpected", cause);
      return NextResponse.json(
        { ok: false, error: "INTERNAL_ERROR" },
        { status: 500 },
      );
    }
  };
}
