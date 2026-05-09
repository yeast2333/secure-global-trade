import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";

import { routing } from "./i18n/routing";
import { createSupabaseMiddlewareClient } from "./lib/supabase-middleware";
import { LOGIN_RATE_LIMIT, consumeRateLimit } from "./lib/rate-limit";

const intlMiddleware = createMiddleware(routing);

// 受保护路由：未登录访问会被重定向到登录页
const PROTECTED_PATHS = ["/profile"];

// 安全模块 1：XSS 关键字识别（多重 decode 后再匹配，防止 %3Cscript%3E 绕过）
const XSS_KEYWORDS =
  /<\s*\/?\s*script\b|javascript\s*:|\balert\s*\(|\bon(error|load|click|focus|mouseover|submit|toggle)\s*=/i;

function safeDecode(input: string) {
  try {
    return decodeURIComponent(input);
  } catch {
    return input;
  }
}

function detectXss(rawUrl: string) {
  const decoded = safeDecode(rawUrl);
  const match =
    decoded.match(XSS_KEYWORDS) ?? rawUrl.match(XSS_KEYWORDS) ?? null;
  return match ? match[0] : null;
}

function getSourceIp(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    request.ip ??
    "unknown"
  );
}

// 审计写入必须在返回响应之前 await 完成：Edge / Serverless 中间件返回后进程可能被冻结，
// fire-and-forget 的 insert 往往来不及执行 → security_logs 无行 → 安全看板计数恒为 0。
async function insertEdgeSecurityAudit(
  request: NextRequest,
  payload: {
    event_type: string;
    attack_type: string;
    matched_rule: string;
    target_url: string;
    severity: "low" | "medium" | "high";
    source_ip: string;
  },
) {
  try {
    const { supabase } = createSupabaseMiddlewareClient(request);
    const { error } = await supabase.from("security_logs").insert({
      event_type: payload.event_type,
      attack_type: payload.attack_type,
      payload: payload.target_url.slice(0, 500),
      source_ip: payload.source_ip,
      severity: payload.severity,
      defense_level: "edge",
      matched_rule: payload.matched_rule,
      verdict: "blocked",
    });
    if (error) {
      console.error("[security] audit insert failed", error.message);
    }
  } catch (cause) {
    console.error("[security] audit insert crashed", cause);
  }
}

// 安全模块 1 (续) · XSS 拦截响应页（深色品牌风）
function buildXssBlockedResponse(matched: string, targetUrl: string) {
  const safeMatched = matched.replace(/[<>&"']/g, "_");
  const safeUrl = targetUrl.replace(/[<>&"']/g, "_").slice(0, 200);

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8" /><title>403 · Blocked by WAF</title>
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>body{margin:0;background:#020617;color:#e2e8f0;font-family:ui-sans-serif,system-ui,Segoe UI,Roboto,Helvetica,Arial,"PingFang SC",sans-serif;}.wrap{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:32px;background-image:radial-gradient(900px 500px at 20% 10%,rgba(244,63,94,.18),transparent 60%),radial-gradient(700px 380px at 80% 90%,rgba(34,211,238,.15),transparent 60%);}.card{max-width:560px;width:100%;border:1px solid rgba(248,113,113,.35);background:rgba(15,23,42,.7);border-radius:20px;padding:28px;backdrop-filter:blur(8px);box-shadow:0 20px 60px rgba(244,63,94,.18);}.badge{display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:9999px;border:1px solid rgba(248,113,113,.5);background:rgba(244,63,94,.12);color:#fda4af;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;}h1{font-size:28px;margin:14px 0 6px;font-weight:800;color:#fff;}p{color:#94a3b8;line-height:1.6;font-size:13px;margin:8px 0;}code{display:block;margin-top:6px;padding:10px 12px;border-radius:10px;background:#020617;border:1px solid #1e293b;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:11px;color:#67e8f9;word-break:break-all;}.meta{margin-top:20px;display:grid;gap:6px;font-size:11px;color:#cbd5e1;}.meta b{color:#fca5a5;font-weight:600;}a{color:#67e8f9;text-decoration:none;font-weight:600;}</style></head>
<body><div class="wrap"><div class="card"><span class="badge">● HTTP 403 Forbidden</span><h1>Request blocked by Edge WAF</h1><p>Your request matched a known cross-site scripting signature and was rejected before reaching the application.</p><p>This event has been written to the <b>security_logs</b> audit table.</p><div class="meta"><span><b>Matched keyword:</b> <code>${safeMatched}</code></span><span><b>Decoded URL:</b> <code>${safeUrl}</code></span><span><b>Event type:</b> <code>XSS Attack</code></span></div><p style="margin-top:18px;">Return to the <a href="/">store homepage</a> or open the <a href="/en/security">security command center</a>.</p></div></div></body></html>`;

  return new NextResponse(html, {
    status: 403,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex",
      "X-Blocked-By": "secure-trade-edge-waf",
    },
  });
}

// 安全模块 2 · 暴力破解防御
//   - 仅针对「修改态」登录接口：POST /api/auth/* （GET 不计入，避免浪费预算）
//   - key = `auth:${ip}` 维度；超过 LOGIN_RATE_LIMIT.max 后返 429 + 写审计
//   - 单实例 Map 计数；生产可替换为 Upstash Redis 共享存储
async function handleAuthRateLimit(request: NextRequest) {
  if (request.method !== "POST") {
    return NextResponse.next();
  }
  const url = request.nextUrl;
  const ip = getSourceIp(request);
  const key = `auth:${ip}`;
  const result = consumeRateLimit(key, LOGIN_RATE_LIMIT);

  if (!result.allowed) {
    await insertEdgeSecurityAudit(request, {
      event_type: "Brute-force Attempt",
      attack_type: "Login rate limit exceeded",
      matched_rule: `${LOGIN_RATE_LIMIT.max} req / ${LOGIN_RATE_LIMIT.windowMs}ms`,
      target_url: url.pathname,
      severity: "medium",
      source_ip: ip,
    });
    console.warn("[security] brute-force throttled", {
      ip,
      url: url.pathname,
      count: result.count,
    });
    return new NextResponse(
      JSON.stringify({
        ok: false,
        error: "RATE_LIMITED",
        retryAfter: result.retryAfterSec,
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
          "Retry-After": String(result.retryAfterSec),
          "X-RateLimit-Limit": String(LOGIN_RATE_LIMIT.max),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(
            Math.floor(Date.now() / 1000) + result.retryAfterSec,
          ),
        },
      },
    );
  }

  const response = NextResponse.next();
  response.headers.set("X-RateLimit-Limit", String(LOGIN_RATE_LIMIT.max));
  response.headers.set("X-RateLimit-Remaining", String(result.remaining));
  return response;
}

export default async function middleware(request: NextRequest) {
  const url = request.nextUrl;

  // ============== Branch A · 登录类接口的暴力破解防御 ==============
  if (url.pathname.startsWith("/api/auth/")) {
    return await handleAuthRateLimit(request);
  }

  // ============== Branch B · 页面路由 ==============
  const targetUrl = url.pathname + url.search;

  // 1) XSS 关键字拦截（异步审计 + 403 错误页）
  const matched = detectXss(targetUrl);
  if (matched) {
    const sourceIp = getSourceIp(request);
    console.warn("[security] XSS Attack blocked", {
      matched,
      url: targetUrl,
      ip: sourceIp,
    });
    await insertEdgeSecurityAudit(request, {
      event_type: "XSS Attack",
      attack_type: /alert\s*\(/i.test(matched)
        ? "JS execution attempt"
        : /javascript\s*:/i.test(matched)
          ? "javascript: protocol"
          : /on\w+\s*=/i.test(matched)
            ? "Event handler injection"
            : "Script tag injection",
      matched_rule: matched,
      target_url: targetUrl,
      severity: "high",
      source_ip: sourceIp,
    });
    return buildXssBlockedResponse(matched, safeDecode(targetUrl));
  }

  // ============== Branch B2 · 结账 API（matcher 原先排除了通用 /api/*）
  // Supabase SSR：须在命中路由处理器前刷新 access token，否则仅页面导航经过 middleware 时续签，
  // POST /api/checkout 容易读到过期 JWT → getUser() 为空 → UNAUTHENTICATED。
  if (url.pathname === "/api/checkout") {
    const { supabase, response } = createSupabaseMiddlewareClient(request);
    await supabase.auth.getUser();
    return response;
  }

  // 2) i18n 路由
  const intlResponse = intlMiddleware(request);

  // 3) 受保护路由的会话校验
  const segments = url.pathname.split("/").filter(Boolean);
  const locale = routing.locales.includes(
    segments[0] as (typeof routing.locales)[number],
  )
    ? segments[0]
    : routing.defaultLocale;

  const pathWithoutLocale =
    segments[0] === locale ? `/${segments.slice(1).join("/")}` : url.pathname;

  const isProtected = PROTECTED_PATHS.some(
    (p) => pathWithoutLocale === p || pathWithoutLocale.startsWith(`${p}/`),
  );

  if (isProtected) {
    const { supabase, response } = createSupabaseMiddlewareClient(
      request,
      intlResponse,
    );
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const loginUrl = new URL(`/${locale}/login`, request.url);
      loginUrl.searchParams.set("redirect", url.pathname + url.search);
      return NextResponse.redirect(loginUrl);
    }
    return response;
  }

  return intlResponse;
}

export const config = {
  // matcher：页面（排除 api/静态）、登录类 API、结账 API（需续签会话 Cookie）
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
    "/api/auth/:path*",
    "/api/checkout",
  ],
};
