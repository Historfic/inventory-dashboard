-- GMROI / Inbound Freight / Line Counts / Buy-Line schema for project
-- iijqoarquipovpfhkbvz: base tables + RLS + the views the dashboard reads.
-- Inventory schema lives in recreate-inventory-schema.sql. Idempotent; run in order.

-- ============ Base tables ============
create table if not exists public.branch_gmroi_reports (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  report_date date not null, branch_id text not null, buy_line text not null,
  gp_dollars numeric, cogs_dollars numeric,
  gp_dollars_adjusted numeric, cogs_dollars_adjusted numeric,
  on_hand_dollars numeric, turns numeric, markup_pct numeric,
  gmroi numeric, adjusted_margin_pct numeric,
  unique (report_date, branch_id, buy_line)
);

create table if not exists public.branch_inbound_freight_reports (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  report_date date not null, order_number text not null, line_number integer not null,
  writer text, vendor_name text,
  gen_total_dollars numeric, freight_dollars numeric, inbound_pct numeric,
  unique (report_date, order_number, line_number)
);

create table if not exists public.branch_buy_line_buyers (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  report_date date not null, buy_line text not null, branch_id text not null, buyer text,
  unique (report_date, buy_line, branch_id)
);

-- Line counts: month + system_source (AR/OQ) are part of the identity.
-- The filename export date is shared across months, so month MUST be in the key,
-- and system_source keeps AR and OQ rows distinct (merged later on the frontend).
create table if not exists public.branch_line_count_reports (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  report_date date not null, month text, system_source text,
  writer text not null, line_type text not null, line_count integer,
  unique (report_date, month, system_source, line_type, writer)
);

-- ============ RLS + anon read policy on every feature table ============
do $$
declare t text;
begin
  foreach t in array array[
    'branch_gmroi_reports','branch_inbound_freight_reports',
    'branch_line_count_reports','branch_buy_line_buyers'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "anon read-only %1$s" on public.%1$I', t);
    execute format('create policy "anon read-only %1$s" on public.%1$I for select to anon using (true)', t);
  end loop;
end $$;

-- ============ Dashboard views (security_invoker so RLS applies) ============
create or replace view public.latest_gmroi_snapshot with (security_invoker=on) as
  select * from public.branch_gmroi_reports
  where report_date = (select max(report_date) from public.branch_gmroi_reports);
create or replace view public.gmroi_all with (security_invoker=on) as
  select * from public.branch_gmroi_reports;

create or replace view public.latest_inbound_freight_snapshot with (security_invoker=on) as
  select * from public.branch_inbound_freight_reports
  where report_date = (select max(report_date) from public.branch_inbound_freight_reports);
create or replace view public.inbound_freight_all with (security_invoker=on) as
  select * from public.branch_inbound_freight_reports;

create or replace view public.latest_line_counts_snapshot with (security_invoker=on) as
  select * from public.branch_line_count_reports
  where report_date = (select max(report_date) from public.branch_line_count_reports);
create or replace view public.line_counts_all with (security_invoker=on) as
  select * from public.branch_line_count_reports;

grant select on
  public.latest_gmroi_snapshot, public.gmroi_all,
  public.latest_inbound_freight_snapshot, public.inbound_freight_all,
  public.latest_line_counts_snapshot, public.line_counts_all
  to anon;

notify pgrst, 'reload schema';
