import { createBrowserClient } from "@supabase/ssr";

// 浏览器侧 Supabase 客户端：基于 cookie 的会话同步，方便服务端中间件读取同一份 token
// 安全技术点：anon key 仅暴露公开权限，敏感操作必须配合 RLS / Edge Function
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
