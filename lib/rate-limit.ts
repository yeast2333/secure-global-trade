// =============================================================
// 暴力破解防御 · 进程内滑动窗口速率限制
//   - 数据结构：Map<key, { count, resetAt }>
//   - 单个 Edge Runtime 实例内有效；生产应换成 Upstash Redis / Vercel KV 之类共享后端
//   - key 一般使用 `${routeTag}:${ip}` 维度，避免不同接口互相污染
// =============================================================

export type RateLimitConfig = {
  /** 时间窗口长度（毫秒） */
  windowMs: number;
  /** 窗口内允许的最大命中次数 */
  max: number;
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  /** 触发限流时返回剩余的等待秒数，未触发则为 0 */
  retryAfterSec: number;
  /** 当前窗口内累计命中次数（用于 audit log） */
  count: number;
};

const BUCKET = new Map<string, { count: number; resetAt: number }>();

/** 滑动窗口：每次调用 +1，超过 max 拒绝 */
export function consumeRateLimit(
  key: string,
  config: RateLimitConfig,
): RateLimitResult {
  const now = Date.now();
  const entry = BUCKET.get(key);

  if (!entry || entry.resetAt <= now) {
    BUCKET.set(key, { count: 1, resetAt: now + config.windowMs });
    return {
      allowed: true,
      remaining: config.max - 1,
      retryAfterSec: 0,
      count: 1,
    };
  }

  entry.count += 1;
  if (entry.count > config.max) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSec: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
      count: entry.count,
    };
  }
  return {
    allowed: true,
    remaining: Math.max(0, config.max - entry.count),
    retryAfterSec: 0,
    count: entry.count,
  };
}

// 登录类接口的默认配置：60 秒内 5 次（实际项目可下沉到 env）
export const LOGIN_RATE_LIMIT: RateLimitConfig = {
  windowMs: 60_000,
  max: 5,
};
