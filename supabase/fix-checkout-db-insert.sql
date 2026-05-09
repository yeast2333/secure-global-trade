-- =============================================================
-- 结账 DB_INSERT_FAILED 一站式补丁（Supabase → SQL Editor 执行，可重复运行）
--
-- 覆盖：(1) public.orders 不存在 (2) RLS 策略缺失 (3) authenticated 无 INSERT/SELECT
--
-- 若已在 Dashboard 建过同名表但结构不一致，请先备份后再执行；一般以新项目为准。
-- =============================================================

-- 表不存在时会创建（与仓库 init.sql 对齐）
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  items jsonb not null,
  total_usd numeric(10, 2) not null,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

-- 若此前在 Dashboard 手工建过「缺列」的 orders，`CREATE TABLE IF NOT EXISTS` 不会改结构。
-- PostgREST 报错示例：PGRST204 · Could not find the 'items' column of 'orders' in the schema cache
alter table public.orders add column if not exists items jsonb not null default '[]'::jsonb;
alter table public.orders add column if not exists total_usd numeric(10, 2) not null default 0;
alter table public.orders add column if not exists status text not null default 'pending';
alter table public.orders add column if not exists created_at timestamptz not null default now();
alter table public.orders add column if not exists user_id uuid references auth.users(id) on delete cascade;

create index if not exists orders_user_id_idx on public.orders (user_id);

alter table public.orders enable row level security;

drop policy if exists "orders selectable by owner" on public.orders;
create policy "orders selectable by owner"
  on public.orders
  for select
  using (auth.uid() = user_id);

drop policy if exists "orders insertable by owner" on public.orders;
create policy "orders insertable by owner"
  on public.orders
  for insert
  with check (auth.uid() = user_id);

grant usage on schema public to anon, authenticated;

grant select on public.products to anon, authenticated;

grant select, insert on public.orders to authenticated;

grant select, insert on public.security_logs to anon, authenticated;

-- 让 PostgREST 立刻识别新列（否则仍可能短暂报 schema cache）
notify pgrst, 'reload schema';
