-- Inventory dashboard schema (views, RPC, RLS) for the `branch_stock_reports` table.
--
-- Context: the live Supabase project (ref iijqoarquipovpfhkbvz) had the base
-- table + data but was missing the dashboard's views and the RPC the frontend
-- calls, so every inventory page failed. This file recreates exactly what the
-- app expects. Run it in the Supabase SQL Editor against the project, in order.
-- Idempotent: safe to re-run.
--
-- Scope: inventory only. GMROI / freight / line-count tables + data are loaded
-- by the n8n pipeline and are out of scope here.

-- 1. Row Level Security on the base table (fixes the "RLS Disabled in Public"
--    linter item) + a read-only policy for the anon role the dashboard uses.
alter table public.branch_stock_reports enable row level security;

drop policy if exists "anon read-only branch_stock_reports" on public.branch_stock_reports;
create policy "anon read-only branch_stock_reports"
  on public.branch_stock_reports
  for select
  to anon
  using (true);

-- 2. The RPC the inventory page calls (hooks/useInventoryData.ts).
--    Returns the latest snapshot WITHIN the selected date range, optionally
--    filtered by branch. security definer so it returns data regardless of RLS.
create or replace function public.latest_inventory_in_range(
  start_date date,
  end_date date,
  branch_filter text[] default null
)
returns setof public.branch_stock_reports
language sql
stable
security definer
set search_path = public
as $$
  select *
  from public.branch_stock_reports
  where report_date = (
    select max(report_date)
    from public.branch_stock_reports
    where report_date between start_date and end_date
  )
  and (branch_filter is null or branch_id::text = any (branch_filter));
$$;

grant execute on function public.latest_inventory_in_range(date, date, text[]) to anon;

-- 3. Convenience snapshot view (CLAUDE.md §3). The page uses the RPC above;
--    this exists for ad-hoc queries / parity with the docs.
create or replace view public.latest_inventory_snapshot
  with (security_invoker = on) as
select *
from public.branch_stock_reports
where report_date = (select max(report_date) from public.branch_stock_reports);
grant select on public.latest_inventory_snapshot to anon;

-- 4. Trend views (CLAUDE.md §18) — column names match hooks/useInventoryTrend.ts.
--    critical_fires_count uses the §13 alert predicate: stockout_pct >= 1.0 AND on_po = 0.
create or replace view public.inventory_daily_summary
  with (security_invoker = on) as
select
  report_date,
  count(*)                                                   as total_items,
  avg(stockout_pct)                                          as avg_stockout_pct,
  count(*) filter (where stockout_pct >= 1.0 and on_po = 0)  as critical_fires_count
from public.branch_stock_reports
group by report_date;
grant select on public.inventory_daily_summary to anon;

create or replace view public.inventory_buyer_summary
  with (security_invoker = on) as
select
  report_date,
  buyer,
  count(*)           as item_count,
  avg(stockout_pct)  as avg_stockout_pct
from public.branch_stock_reports
group by report_date, buyer;
grant select on public.inventory_buyer_summary to anon;

-- 5. Tell PostgREST to pick up the new objects immediately.
notify pgrst, 'reload schema';
