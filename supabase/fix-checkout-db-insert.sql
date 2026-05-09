-- =============================================================
-- 若线上结账返回 DB_INSERT_FAILED，请在 Supabase Dashboard → SQL Editor
-- 以「一次性补丁」执行本脚本（幂等，可重复运行）。
-- 常见原因：orders 已建表且开了 RLS，但未向 authenticated 授予 INSERT/SELECT，
--         尤其 insert().select('id') 需要 SELECT 才能返回新行。
-- =============================================================

grant usage on schema public to anon, authenticated;

grant select on public.products to anon, authenticated;

grant select, insert on public.orders to authenticated;

grant select, insert on public.security_logs to anon, authenticated;
