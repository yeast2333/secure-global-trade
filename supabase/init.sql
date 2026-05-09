-- =============================================================
-- Secure Global Trade · Supabase 初始化脚本
-- =============================================================

-- 商品表：公开可读，写入由后台脚本完成
create table if not exists public.products (
  id text primary key,
  name text not null,
  category text not null,
  image_url text,
  price_usd numeric(10, 2) not null,
  price_usd_original numeric(10, 2),
  stock int not null default 0,
  batch_no text,
  description text,
  created_at timestamptz not null default now()
);

alter table public.products enable row level security;

drop policy if exists "products are public readable" on public.products;
create policy "products are public readable"
  on public.products
  for select
  using (true);

-- 订单表：每条订单严格归属一个用户
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  items jsonb not null,
  total_usd numeric(10, 2) not null,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create index if not exists orders_user_id_idx on public.orders (user_id);

alter table public.orders enable row level security;

-- 安全技术点：RLS 行级安全
-- 1) 用户只能 SELECT 自己的订单（防止越权读取）
drop policy if exists "orders selectable by owner" on public.orders;
create policy "orders selectable by owner"
  on public.orders
  for select
  using (auth.uid() = user_id);

-- 2) 用户只能 INSERT user_id = 自己的订单（防止伪造他人订单）
drop policy if exists "orders insertable by owner" on public.orders;
create policy "orders insertable by owner"
  on public.orders
  for insert
  with check (auth.uid() = user_id);

-- 表级权限：RLS 只约束「能看到哪些行」，并不代替 GRANT。
-- 缺少 INSERT/SELECT 时 PostgREST 会 permission denied；insert 若带 RETURNING/.select() 还需 SELECT。
grant usage on schema public to anon, authenticated;
grant select on public.products to anon, authenticated;
grant select, insert on public.orders to authenticated;

-- =============================================================
-- 安全审计 · security_logs 表
--   - 由 middleware 的 fire-and-forget 写入：
--     * event_type='Brute-force Attempt' （登录类接口速率限制触发）
--     * event_type='XSS Attack'           （URL 命中 XSS 关键字正则）
--   - 由 /api/auth/login 写入：
--     * event_type='Auth Failure'         （Supabase Auth 校验失败）
--   - 浏览器侧通过 Supabase Realtime 订阅 INSERT 事件，驱动 /security 状态看板
-- =============================================================
create table if not exists public.security_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  event_type text not null default 'Generic Event',
  attack_type text not null,
  payload text not null,
  source_ip text,
  severity text not null default 'medium',
  defense_level text not null,
  matched_rule text,
  verdict text not null default 'blocked'
);

-- 兼容已存在的库：旧版本 schema 没有 event_type 列时给它加上
alter table public.security_logs
  add column if not exists event_type text not null default 'Generic Event';

create index if not exists security_logs_created_at_idx
  on public.security_logs (created_at desc);

create index if not exists security_logs_event_type_idx
  on public.security_logs (event_type);

alter table public.security_logs enable row level security;

-- 安全技术点：审计日志为公开演示用，浏览器需要可读才能驱动实时大屏
drop policy if exists "security_logs are public readable" on public.security_logs;
create policy "security_logs are public readable"
  on public.security_logs
  for select
  using (true);

-- 实验室演示模式下允许匿名 INSERT（生产环境应改为 service_role only）
drop policy if exists "security_logs are demo insertable" on public.security_logs;
create policy "security_logs are demo insertable"
  on public.security_logs
  for insert
  with check (true);

grant select, insert on public.security_logs to anon, authenticated;

-- 启用 Realtime：把表加入 supabase_realtime 发布通道
do $$
begin
  if exists (
    select 1
      from pg_publication
     where pubname = 'supabase_realtime'
  ) then
    if not exists (
      select 1
        from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'security_logs'
    ) then
      execute 'alter publication supabase_realtime add table public.security_logs';
    end if;
  end if;
end$$;
