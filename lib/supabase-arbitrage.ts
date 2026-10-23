import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Second Supabase project. arbitrage_leads and sourcing_runs live in the
// arbitrage project, not the inventory one (CLAUDE.md §19). Browser-safe
// anon/publishable key only — RLS grants anon SELECT and nothing else.
// Created lazily so a missing env var breaks only the Arbitrage page.
let client: SupabaseClient | null = null;

export function getArbitrageSupabase(): SupabaseClient {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_ARBITRAGE_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_ARBITRAGE_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_ARBITRAGE_SUPABASE_URL or NEXT_PUBLIC_ARBITRAGE_SUPABASE_ANON_KEY. Check .env.local."
    );
  }
  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}
