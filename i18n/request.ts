import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";

import { routing } from "./routing";

// 安全技术点：白名单校验请求侧 locale，非法时回退默认语言，防止路径注入
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  const messages = (await import(`../messages/${locale}.json`)).default;
  const catalog = (await import(`../messages/catalog/${locale}.json`)).default;

  return {
    locale,
    messages: {
      ...messages,
      catalog,
    },
  };
});
