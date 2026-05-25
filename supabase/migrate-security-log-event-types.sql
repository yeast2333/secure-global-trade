-- =============================================================
-- Secure Global Trade · security_logs attack_type 迁移脚本
--
-- 目的：把旧版/显示名 attack_type 统一迁移为稳定的机器值，
--       解决前端按新值查询时出现 400 Bad Request 的问题。
--
-- 兼容性：
-- - 如果旧库里还没有 attack_type 列，会先补列
-- - 如果旧库里列名不同，先用 SELECT 检查表结构后再手动改名
-- =============================================================

begin;

-- 0) 保险起见：如果表里还没有 attack_type 列，先补上
alter table public.security_logs
  add column if not exists attack_type text not null default 'generic_event';

-- 1) 先处理最常见的旧显示名 -> 新机器值
update public.security_logs
set attack_type = 'brute_force_attempt'
where attack_type in (
  'Brute-force Attempt',
  'Brute Force Attempt',
  'Brute force Attempt',
  'bruteforce',
  'brute-force',
  'bruteforce_attempt'
);

update public.security_logs
set attack_type = 'xss_probe'
where attack_type in (
  'XSS Attack',
  'XSS',
  'xss'
);

update public.security_logs
set attack_type = 'auth_failure_login'
where attack_type in (
  'Auth Failure',
  'Authentication Failure',
  'Login Failure',
  'auth_failure'
);

update public.security_logs
set attack_type = 'schema_validation_failed'
where attack_type in (
  'Schema Validation',
  'Validation Error',
  'schema_validation'
);

-- 2) 如果有历史数据已经是其它近似机器值，再统一兜底一次
update public.security_logs
set attack_type = 'brute_force_attempt'
where lower(replace(replace(attack_type, '-', '_'), ' ', '_')) in (
  'bruteforce_attempt',
  'bruteforce',
  'brute_force_attempt'
);

update public.security_logs
set attack_type = 'xss_probe'
where lower(replace(replace(attack_type, '-', '_'), ' ', '_')) in (
  'xss_attack',
  'xss'
);

update public.security_logs
set attack_type = 'auth_failure_login'
where lower(replace(replace(attack_type, '-', '_'), ' ', '_')) in (
  'auth_failure',
  'authentication_failure',
  'login_failure',
  'auth_failure_login'
);

update public.security_logs
set attack_type = 'schema_validation_failed'
where lower(replace(replace(attack_type, '-', '_'), ' ', '_')) in (
  'schema_validation',
  'validation_error',
  'schema_validation_failed'
);

-- 3) 给当前表里仍未覆盖到的值一个保底归类
update public.security_logs
set attack_type = case
  when attack_type ilike '%xss%' then 'xss_probe'
  when attack_type ilike '%brute%' then 'brute_force_attempt'
  when attack_type ilike '%auth%' or attack_type ilike '%login%' then 'auth_failure_login'
  when attack_type ilike '%schema%' or attack_type ilike '%validation%' then 'schema_validation_failed'
  when attack_type is null or trim(attack_type) = '' then 'generic_event'
  else attack_type
end
where attack_type not in (
  'brute_force_attempt',
  'xss_probe',
  'auth_failure_login',
  'schema_validation_failed',
  'generic_event'
);

-- 4) 统计检查（执行后可直接查看结果）
-- select attack_type, count(*) from public.security_logs group by attack_type order by count(*) desc;

commit;
