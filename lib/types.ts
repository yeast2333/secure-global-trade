import { z } from "zod";

// ============== 通用分页 ==============
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
});

export type Pagination = z.infer<typeof paginationSchema>;

// ============== 订单状态 ==============
export const ORDER_STATUSES = [
  "pending",
  "paid",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const orderStatusSchema = z.enum(ORDER_STATUSES);

// ============== 安全日志攻击类型 ==============
export const ATTACK_TYPES = [
  "brute_force_attempt",
  "xss_probe",
  "auth_failure_login",
  "schema_validation_failed",
] as const;

export type AttackType = (typeof ATTACK_TYPES)[number];

// ============== 安全日志严重级别 ==============
export const SEVERITY_LEVELS = ["low", "medium", "high"] as const;

export type SeverityLevel = (typeof SEVERITY_LEVELS)[number];
