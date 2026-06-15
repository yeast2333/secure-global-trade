-- ============================================================
-- 修复：security_logs 匿名 INSERT 策略
--
-- 问题：middleware (Edge) 中 XSS / brute_force 审计写入使用
--       anon_key，但 security_logs 缺少匿名用户 INSERT 策略，
--       导致 insert 被 RLS 拒绝 → 安全看板计数恒为 0。
--
-- 解决：添加两条策略：
--   1. 匿名 INSERT（演示/教学模式）
--   2. 匿名 SELECT（看板初始加载）
--
-- 运行方式：在 Supabase Dashboard → SQL Editor 中执行本文件
-- ============================================================

-- 确保 RLS 已启用
alter table public.security_logs enable row level security;

-- 1) 允许匿名用户插入安全日志（XSS/暴力破解/注入均来自未认证请求）
drop policy if exists "security_logs insert for all" on public.security_logs;
create policy "security_logs insert for all"
  on public.security_logs
  for insert
  with check (true);

-- 2) 允许公开读取安全日志（安全看板需要统计数据）
drop policy if exists "security_logs are public readable" on public.security_logs;
create policy "security_logs are public readable"
  on public.security_logs
  for select
  using (true);

-- 验证策略
select tablename, policyname, cmd, qual, roles
from pg_policies
where tablename = 'security_logs';
