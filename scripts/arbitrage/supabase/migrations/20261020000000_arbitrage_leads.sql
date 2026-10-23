-- Flat lead + run-log tables for the arbitrage sourcing pipeline.
-- Access model: n8n writes and the dashboard reads server-side, both with the
-- service-role / secret key. No anon or authenticated access, so RLS is enabled
-- with no policies (deny-all for public roles).

create table if not exists public.arbitrage_leads (
  id                 bigint generated always as identity primary key,
  upc                text        not null,
  asin               text        not null,

  -- Supplier side
  supplier           text        not null default 'plumbersstock',
  supplier_sku       text,
  supplier_mpn       text,
  supplier_title     text,
  supplier_url       text,
  image_url          text,
  cost_price         numeric(10,2),
  in_stock           boolean,
  stock_status       text,

  -- Amazon side (Keepa)
  amazon_title       text,
  brand              text,
  sales_category     text,
  buy_box_price      numeric(10,2),
  price_source       text,          -- buy_box | new | amazon
  buy_box_is_fba     boolean,
  buy_box_is_amazon  boolean,
  bsr_current        integer,
  bsr_avg_30         integer,
  bsr_avg_90         integer,
  new_offer_count    integer,
  fba_offer_count    integer,

  -- Economics
  referral_fee_pct   numeric(5,2),
  referral_fee       numeric(10,2),
  fba_fee            numeric(10,2),
  fba_fee_estimated  boolean     not null default false,
  prep_cost          numeric(10,2),
  total_fees         numeric(10,2),
  net_profit         numeric(10,2),
  roi_pct            numeric(8,2),
  net_margin_pct     numeric(8,2),
  is_profitable      boolean     not null default false,

  keepa_last_update  timestamptz,
  first_seen_at      timestamptz not null default now(),
  updated_at         timestamptz not null default now(),

  constraint arbitrage_leads_upc_asin_key unique (upc, asin)
);

create index if not exists arbitrage_leads_profitable_roi_idx
  on public.arbitrage_leads (is_profitable, roi_pct desc);

create table if not exists public.sourcing_runs (
  id                     bigint generated always as identity primary key,
  started_at             timestamptz,
  finished_at            timestamptz not null default now(),
  trigger                text,
  category_url           text,
  products_scraped       integer,
  products_with_upc      integer,
  asins_matched          integer,
  profitable             integer,
  keepa_tokens_consumed  integer,
  keepa_tokens_left      integer,
  status                 text,
  error                  text
);

create index if not exists sourcing_runs_finished_idx
  on public.sourcing_runs (finished_at desc);

alter table public.arbitrage_leads enable row level security;
alter table public.sourcing_runs  enable row level security;

-- Data API exposure is opt-in on Supabase (enforced for all projects from
-- 2026-10-30), so grant the server role explicitly and nothing to anon.
revoke all on public.arbitrage_leads, public.sourcing_runs from anon, authenticated;
grant select, insert, update, delete on public.arbitrage_leads, public.sourcing_runs to service_role;
