import { defineRouting } from "next-intl/routing";

// 安全技术点：在路由层面预定义合法语言白名单，避免攻击者通过任意语言段构造非法 URL
export const routing = defineRouting({
  locales: ["en", "zh"],
  defaultLocale: "en",
  localePrefix: "always",
});
