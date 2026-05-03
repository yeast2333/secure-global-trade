import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// 中间件 Supabase 客户端：用于 Edge Middleware 读取 / 续签 access token
// 安全技术点：在边缘节点完成 getUser() 校验，防止伪造 cookie 进入受保护路由
export function createSupabaseMiddlewareClient(
  request: NextRequest,
  baseResponse?: NextResponse,
) {
  let response =
    baseResponse ??
    NextResponse.next({
      request: { headers: request.headers },
    });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  return { supabase, response };
}
