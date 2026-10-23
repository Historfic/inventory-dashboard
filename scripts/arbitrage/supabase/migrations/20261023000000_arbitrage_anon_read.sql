-- The merged inventory dashboard reads arbitrage data from the browser with the
-- publishable/anon key — the same exposure model as the inventory views
-- (CLAUDE.md §3, §19). Read-only: anon gets SELECT and a SELECT policy, nothing
-- else. Writes stay with the n8n workflow (service role).

grant select on public.arbitrage_leads, public.sourcing_runs to anon;

drop policy if exists "anon can read arbitrage leads" on public.arbitrage_leads;
create policy "anon can read arbitrage leads"
  on public.arbitrage_leads for select to anon using (true);

drop policy if exists "anon can read sourcing runs" on public.sourcing_runs;
create policy "anon can read sourcing runs"
  on public.sourcing_runs for select to anon using (true);
