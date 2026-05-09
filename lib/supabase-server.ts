import { createServerClient } from "@supabase/ssr";
import type { NextResponse } from "next/server";
import { cookies } from "next/headers";

// 服务端 Supabase 客户端：用在 RSC / Route Handler 中，确保 auth.uid() 自动绑定当前会话
// 安全技术点：所有 RLS 策略依赖该客户端读取 cookie 中的 access token
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // RSC 环境下不可写 cookie，由中间件兜底刷新
          }
        },
      },
    },
  );
}

type CookiePair = {
  name: string;
  value: string;
  options?: Parameters<NextResponse["cookies"]["set"]>[2];
};

/**
 * Route Handler（登录 / 注册）专用：Supabase 登录成功后必须把 Session Cookie 写到「将要返回的
 * NextResponse」上；仅用 cookieStore.set 在某些环境下不会合并进 NextResponse.json()，
 * 导致浏览器不带会话调用 /api/checkout → UNAUTHENTICATED。
 */
export async function createSupabaseAuthRouteClient() {
  const cookieStore = await cookies();
  const pendingCookies: CookiePair[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach((c) => pendingCookies.push(c));
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            /* Route Handler 中通常可写；失败时不阻断 */
          }
        },
      },
    },
  );

  function attachAuthCookies(response: NextResponse) {
    pendingCookies.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options);
    });
  }

  return { supabase, attachAuthCookies };
}
