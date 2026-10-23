-- Keepa returns its last cached snapshot when it can't refresh a listing
-- (e.g. a dead ASIN), so a months-old Buy Box can look like a great lead.
-- Leads whose Keepa data is older than the run's max age are flagged stale
-- and never count as profitable.
alter table public.arbitrage_leads
  add column if not exists is_stale boolean not null default false;

-- Backfill existing rows with the same 7-day rule the sanitizer applies.
update public.arbitrage_leads
set is_stale = coalesce(keepa_last_update < now() - interval '7 days', true),
    is_profitable = is_profitable and coalesce(keepa_last_update >= now() - interval '7 days', false);
