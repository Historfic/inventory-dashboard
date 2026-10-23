// Arbitrage leads schema (CLAUDE.md §19). Rows live in the arbitrage Supabase
// project, not the inventory one, and are written only by the n8n
// "Arbitrage Sourcing Pipeline" (scripts/arbitrage/).

export type ArbitrageLead = {
  id: number;
  upc: string;
  asin: string;
  supplier: string;
  supplier_sku: string | null;
  supplier_mpn: string | null;
  supplier_title: string | null;
  supplier_url: string | null;
  image_url: string | null;
  cost_price: number | null;
  in_stock: boolean | null;
  stock_status: string | null;
  amazon_title: string | null;
  brand: string | null;
  sales_category: string | null;
  buy_box_price: number | null;
  price_source: "buy_box" | "new" | "amazon" | null;
  buy_box_is_fba: boolean | null;
  buy_box_is_amazon: boolean | null;
  bsr_current: number | null;
  bsr_avg_30: number | null;
  bsr_avg_90: number | null;
  new_offer_count: number | null;
  fba_offer_count: number | null;
  referral_fee_pct: number | null;
  referral_fee: number | null;
  fba_fee: number | null;
  fba_fee_estimated: boolean;
  prep_cost: number | null;
  total_fees: number | null;
  net_profit: number | null;
  roi_pct: number | null;
  net_margin_pct: number | null;
  is_profitable: boolean;
  is_stale: boolean;
  keepa_last_update: string | null;
  first_seen_at: string;
  updated_at: string;
};

export type SourcingRun = {
  id: number;
  started_at: string | null;
  finished_at: string;
  trigger: string | null;
  category_url: string | null;
  products_scraped: number | null;
  products_with_upc: number | null;
  asins_matched: number | null;
  profitable: number | null;
  keepa_tokens_consumed: number | null;
  keepa_tokens_left: number | null;
  status: "success" | "partial" | "error" | null;
  error: string | null;
};

// Response of GET /api/arbitrage/status.
export type ArbitrageStatus = {
  latestRun: Pick<SourcingRun, "id" | "finished_at" | "status" | "asins_matched" | "profitable" | "error"> | null;
  n8n: { status: string; startedAt: string | null } | null;
  keepa: { tokensLeft: number; refillRate: number; refillInMs: number } | null;
};
