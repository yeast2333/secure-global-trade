import { createServerClient } from "@supabase/ssr";
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
