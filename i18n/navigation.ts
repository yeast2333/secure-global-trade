import { createNavigation } from "next-intl/navigation";

import { routing } from "./routing";

// 包装 next-intl 的导航工具，统一在客户端组件中使用本地化的 Link / useRouter / usePathname
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
