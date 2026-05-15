import { ALL_BRANCHES, type GmroiRow } from "./gmroi-types";

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
  avg_turns: number | null;
  avg_adjusted_margin_pct: number | null;
};

export type CompanyTotals = {
  total_annual_cogs_dollars: number;
  total_on_hand_dollars: number;
  avg_turns: number | null;
  avg_adjusted_margin_pct: number | null;
};

export type GmroiByBuyer = {
  buyer: string;
  buy_line_count: number;
  total_annual_cogs_dollars: number;
  total_on_hand_dollars: number;
  avg_turns: number | null;
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

function rollupOnly(rows: GmroiRow[]): GmroiRow[] {
  return rows.filter((r) => r.branch_id === ALL_BRANCHES);
}

function perBranchOnly(rows: GmroiRow[]): GmroiRow[] {
  return rows.filter((r) => r.branch_id !== ALL_BRANCHES);
}

export function aggregateGmroiByBuyLine(
  rows: GmroiRow[],
  buyerByBuyLine: Map<string, string>
): GmroiByBuyLine[] {
  return rollupOnly(rows).map((row) => ({
    buy_line: row.buy_line,
    buyer: buyerByBuyLine.get(row.buy_line) ?? "UNASSIGNED",
    annual_cogs_dollars: row.cogs_dollars,
    avg_on_hand_dollars: row.on_hand_dollars,
    turns: row.turns,
    adjusted_margin_pct: row.adjusted_margin_pct,
  }));
}

export function aggregateGmroiByBranch(rows: GmroiRow[]): GmroiByBranch[] {
  const groups = new Map<string, GmroiRow[]>();
  for (const row of perBranchOnly(rows)) {
    const key = row.branch_id;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }
  return Array.from(groups.entries()).map(([branch_id, group]) => ({
    branch_id,
    total_annual_cogs_dollars: sum(group.map((r) => r.cogs_dollars)),
    total_on_hand_dollars: sum(group.map((r) => r.on_hand_dollars)),
    avg_turns: average(group.map((r) => r.turns)),
    avg_adjusted_margin_pct: average(group.map((r) => r.adjusted_margin_pct)),
  }));
}

export function aggregateGmroiByBuyer(
  rows: GmroiRow[],
  buyerByBuyLine: Map<string, string>
): GmroiByBuyer[] {
  const groups = new Map<string, { rows: GmroiRow[]; buyLines: Set<string> }>();
  for (const row of rollupOnly(rows)) {
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
    total_annual_cogs_dollars: sum(group.rows.map((r) => r.cogs_dollars)),
    total_on_hand_dollars: sum(group.rows.map((r) => r.on_hand_dollars)),
    avg_turns: average(group.rows.map((r) => r.turns)),
    avg_adjusted_margin_pct: average(group.rows.map((r) => r.adjusted_margin_pct)),
  }));
}

export function companyTotals(rows: GmroiRow[]): CompanyTotals {
  const rollup = rollupOnly(rows);
  return {
    total_annual_cogs_dollars: sum(rollup.map((r) => r.cogs_dollars)),
    total_on_hand_dollars: sum(rollup.map((r) => r.on_hand_dollars)),
    avg_turns: average(rollup.map((r) => r.turns)),
    avg_adjusted_margin_pct: average(rollup.map((r) => r.adjusted_margin_pct)),
  };
}
