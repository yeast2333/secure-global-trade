-- 002_admin_profiles.sql
-- 管理员配置文件表 + 新用户自动创建触发器
-- 执行方式：在 Supabase SQL Editor 中运行此文件

-- 1. 创建 profiles 表
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. 启用 RLS
alter table public.profiles enable row level security;

-- 3. RLS 策略：用户只能读取自己的 profile
drop policy if exists "profiles selectable by owner" on public.profiles;
create policy "profiles selectable by owner"
  on public.profiles for select
  using (auth.uid() = id);

-- 4. 授权
grant select on public.profiles to authenticated;
grant select, insert, update on public.profiles to service_role;

-- 5. 触发器：新用户注册时自动创建 profile
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, is_admin)
  values (new.id, new.email, false);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 6. 为已有用户补充 profile（如果 profiles 表是新创建的）
insert into public.profiles (id, email, is_admin)
select id, email, false
from auth.users
on conflict (id) do nothing;

-- 7. 设置第一个管理员（替换 <your-admin-user-id> 为实际的 Supabase Auth 用户 UUID）
-- 方式 A：在下面取消注释并填入 UUID
-- update public.profiles set is_admin = true where id = '<your-admin-user-id>';

-- 方式 B：通过 Supabase Dashboard → SQL Editor 单独执行
-- update public.profiles set is_admin = true where email = 'admin@example.com';
