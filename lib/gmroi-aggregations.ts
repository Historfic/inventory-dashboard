import { ALL_BRANCHES, type GmroiRow } from "./gmroi-types";

// Field mapping note (verified against Oliver's CSV on 2026-05-15):
//   CSV "Actual COGS$"  → DB cogs_dollars
//   CSV "Annual COGS$"  → DB cogs_dollars_adjusted   ← what the dashboard displays
//   CSV "Actual GP$"    → DB gp_dollars
//   CSV "Annual GP$"    → DB gp_dollars_adjusted
//
// Grand Totals row handling (verified 2026-05-23):
//   The ERP report now includes "Grand Totals" rows at the bottom — one per
//   branch plus one for "All Branches". These rows have buy_line === 'Grand
//   Totals' and are the ERP's pre-computed totals (Turns and Adj Margin% are
//   already dollar-weighted on those rows). The dashboard reads them directly
//   for the by-Branch table and the four overview scorecards, so the numbers
//   match Oliver's sheet exactly. The by-Buy-Line and by-Buyer tables still
//   use the per-buy-line "All Branches" rollup rows (excluding Grand Totals).

const GRAND_TOTALS_LABEL = "Grand Totals";

export type GmroiByBuyLine = {
  buy_line: string;
  buyer: string;
  annual_cogs_dollars: number | null;
  avg_on_hand_dollars: number | null;
  turns: number | null;
  adjusted_margin_pct: number | null;
};

export type GmroiByBranch = {
  branch_id: string;
  total_annual_cogs_dollars: number;
  total_on_hand_dollars: number;
  weighted_turns: number | null;
  avg_adjusted_margin_pct: number | null;
};

export type CompanyTotals = {
  total_annual_cogs_dollars: number;
  total_on_hand_dollars: number;
  weighted_turns: number | null;
  avg_adjusted_margin_pct: number | null;
};

export type GmroiByBuyer = {
  buyer: string;
  buy_line_count: number;
  total_annual_cogs_dollars: number;
  total_on_hand_dollars: number;
  weighted_turns: number | null;
  avg_adjusted_margin_pct: number | null;
};

function average(values: Array<number | null | undefined>): number | null {
  const valid = values.filter((v): v is number => typeof v === "number" && !Number.isNaN(v));
  if (valid.length === 0) return null;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

function sum(values: Array<number | null | undefined>): number {
  return values.reduce<number>((a, b) => a + (typeof b === "number" ? b : 0), 0);
}

function weightedTurns(rows: GmroiRow[]): number | null {
  const cogs = sum(rows.map((r) => r.cogs_dollars_adjusted));
  const onHand = sum(rows.map((r) => r.on_hand_dollars));
  if (onHand === 0) return null;
  return cogs / onHand;
}

function isGrandTotal(r: GmroiRow): boolean {
  return r.buy_line === GRAND_TOTALS_LABEL;
}

// Per-buy-line "All Branches" rollup rows (one per buy_line), excluding the
// Grand Totals rollup. Used by by-Buy-Line and by-Buyer tables.
function buyLineRollupRows(rows: GmroiRow[]): GmroiRow[] {
  return rows.filter((r) => r.branch_id === ALL_BRANCHES && !isGrandTotal(r));
}

export function aggregateGmroiByBuyLine(
  rows: GmroiRow[],
  buyerByBuyLine: Map<string, string>
): GmroiByBuyLine[] {
  return buyLineRollupRows(rows).map((row) => ({
    buy_line: row.buy_line,
    buyer: buyerByBuyLine.get(row.buy_line) ?? "UNASSIGNED",
    annual_cogs_dollars: row.cogs_dollars_adjusted,
    avg_on_hand_dollars: row.on_hand_dollars,
    turns: row.turns,
    adjusted_margin_pct: row.adjusted_margin_pct,
  }));
}

// Per-branch Grand Totals rows (one per branch). The ERP pre-computes Turns
// and Adj Margin% with the correct dollar weighting, so we display each row
// directly with no JS aggregation.
export function aggregateGmroiByBranch(rows: GmroiRow[]): GmroiByBranch[] {
  return rows
    .filter((r) => isGrandTotal(r) && r.branch_id !== ALL_BRANCHES)
    .map((row) => ({
      branch_id: row.branch_id,
      total_annual_cogs_dollars: row.cogs_dollars_adjusted ?? 0,
      total_on_hand_dollars: row.on_hand_dollars ?? 0,
      weighted_turns: row.turns,
      avg_adjusted_margin_pct: row.adjusted_margin_pct,
    }));
}

export function aggregateGmroiByBuyer(
  rows: GmroiRow[],
  buyerByBuyLine: Map<string, string>
): GmroiByBuyer[] {
  const groups = new Map<string, { rows: GmroiRow[]; buyLines: Set<string> }>();
  for (const row of buyLineRollupRows(rows)) {
    const buyer = buyerByBuyLine.get(row.buy_line) ?? "UNASSIGNED";
    let group = groups.get(buyer);
    if (!group) {
      group = { rows: [], buyLines: new Set() };
      groups.set(buyer, group);
    }
    group.rows.push(row);
    group.buyLines.add(row.buy_line);
  }
  return Array.from(groups.entries()).map(([buyer, group]) => ({
    buyer,
    buy_line_count: group.buyLines.size,
    total_annual_cogs_dollars: sum(group.rows.map((r) => r.cogs_dollars_adjusted)),
    total_on_hand_dollars: sum(group.rows.map((r) => r.on_hand_dollars)),
    weighted_turns: weightedTurns(group.rows),
    avg_adjusted_margin_pct: average(group.rows.map((r) => r.adjusted_margin_pct)),
  }));
}

// The single "Grand Totals / All Branches" row from the ERP. Used by the
// four overview scorecards on /gmroi.
export function companyTotals(rows: GmroiRow[]): CompanyTotals {
  const row = rows.find((r) => isGrandTotal(r) && r.branch_id === ALL_BRANCHES);
  if (!row) {
    return {
      total_annual_cogs_dollars: 0,
      total_on_hand_dollars: 0,
      weighted_turns: null,
      avg_adjusted_margin_pct: null,
    };
  }
  return {
    total_annual_cogs_dollars: row.cogs_dollars_adjusted ?? 0,
    total_on_hand_dollars: row.on_hand_dollars ?? 0,
    weighted_turns: row.turns,
    avg_adjusted_margin_pct: row.adjusted_margin_pct,
  };
}
