-- 003_order_status_history.sql
-- 订单状态变更审计表
-- 在 Supabase SQL Editor 中运行此文件

create table if not exists public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  from_status text,
  to_status text not null,
  changed_by uuid references auth.users(id),
  note text,
  created_at timestamptz not null default now()
);

alter table public.order_status_history enable row level security;

-- 索引：按订单 ID 查询历史
create index if not exists order_status_history_order_id_idx
  on public.order_status_history (order_id);

-- 索引：按时间倒序
create index if not exists order_status_history_created_at_idx
  on public.order_status_history (created_at desc);

-- 授权 service_role 完全访问（admin API 使用）
grant select, insert on public.order_status_history to service_role;
grant select, insert on public.order_status_history to authenticated;
