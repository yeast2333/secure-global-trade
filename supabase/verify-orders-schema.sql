-- =============================================================
-- 在 Supabase SQL Editor 运行：核对 public.orders 是否包含结账所需列。
-- 期望至少包含：user_id, items, total_usd, status, created_at（及 id）
-- =============================================================

select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'orders'
order by ordinal_position;
