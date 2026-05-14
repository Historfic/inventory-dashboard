import { ALL_BRANCHES, type GmroiRow } from "./gmroi-types";

export type GmroiByBuyLine = {
  buy_line: string;
  total_annual_cogs_dollars: number;
  avg_on_hand_dollars: number | null;
  avg_turns: number | null;
  avg_adjusted_margin_pct: number | null;
  avg_gmroi: number | null;
  avg_markup_pct: number | null;
  item_count: number;
};

export type GmroiByBranch = {
  branch_id: string;
  total_gp_dollars: number;
  total_cogs_dollars: number;
  total_on_hand_dollars: number;
  avg_gmroi: number | null;
  item_count: number;
};

export type CompanyTotals = {
  total_gp_dollars: number;
  total_cogs_dollars: number;
  total_on_hand_dollars: number;
  avg_gmroi: number | null;
  avg_turns: number | null;
  avg_adjusted_margin_pct: number | null;
};

export type GmroiByBuyer = {
  buyer: string;
  avg_turns: number | null;
  avg_adjusted_margin_pct: number | null;
  total_annual_cogs_dollars: number;
  buy_line_count: number;
};

function average(values: Array<number | null | undefined>): number | null {
  const valid = values.filter((v): v is number => typeof v === "number" && !Number.isNaN(v));
  if (valid.length === 0) return null;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

function sum(values: Array<number | null | undefined>): number {
  return values.reduce<number>((a, b) => a + (typeof b === "number" ? b : 0), 0);
}

export function aggregateGmroiByBuyLine(rows: GmroiRow[]): GmroiByBuyLine[] {
  const realBranchOnly = rows.filter((r) => r.branch_id !== ALL_BRANCHES);
  const groups = new Map<string, GmroiRow[]>();
  for (const row of realBranchOnly) {
    const key = row.buy_line;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }
  return Array.from(groups.entries()).map(([buy_line, group]) => ({
    buy_line,
    total_annual_cogs_dollars: sum(group.map((r) => r.cogs_dollars)),
    avg_on_hand_dollars: average(group.map((r) => r.on_hand_dollars)),
    avg_turns: average(group.map((r) => r.turns)),
    avg_adjusted_margin_pct: average(group.map((r) => r.adjusted_margin_pct)),
    avg_gmroi: average(group.map((r) => r.gmroi)),
    avg_markup_pct: average(group.map((r) => r.markup_pct)),
    item_count: group.length,
  }));
}

export function aggregateGmroiByBranch(rows: GmroiRow[]): GmroiByBranch[] {
  const realBranchOnly = rows.filter((r) => r.branch_id !== ALL_BRANCHES);
  const groups = new Map<string, GmroiRow[]>();
  for (const row of realBranchOnly) {
    const key = row.branch_id;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }
  return Array.from(groups.entries()).map(([branch_id, group]) => ({
    branch_id,
    total_gp_dollars: sum(group.map((r) => r.gp_dollars)),
    total_cogs_dollars: sum(group.map((r) => r.cogs_dollars)),
    total_on_hand_dollars: sum(group.map((r) => r.on_hand_dollars)),
    avg_gmroi: average(group.map((r) => r.gmroi)),
    item_count: group.length,
  }));
}

export function aggregateGmroiByBuyer(
  rows: GmroiRow[],
  buyerByBuyLine: Map<string, string>
): GmroiByBuyer[] {
  const realBranchOnly = rows.filter((r) => r.branch_id !== ALL_BRANCHES);
  const groups = new Map<string, { rows: GmroiRow[]; buyLines: Set<string> }>();
  for (const row of realBranchOnly) {
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
    avg_turns: average(group.rows.map((r) => r.turns)),
    avg_adjusted_margin_pct: average(group.rows.map((r) => r.adjusted_margin_pct)),
    total_annual_cogs_dollars: sum(group.rows.map((r) => r.cogs_dollars)),
    buy_line_count: group.buyLines.size,
  }));
}

export function companyTotals(rows: GmroiRow[]): CompanyTotals {
  const realBranchOnly = rows.filter((r) => r.branch_id !== ALL_BRANCHES);
  return {
    total_gp_dollars: sum(realBranchOnly.map((r) => r.gp_dollars)),
    total_cogs_dollars: sum(realBranchOnly.map((r) => r.cogs_dollars)),
    total_on_hand_dollars: sum(realBranchOnly.map((r) => r.on_hand_dollars)),
    avg_gmroi: average(realBranchOnly.map((r) => r.gmroi)),
    avg_turns: average(realBranchOnly.map((r) => r.turns)),
    avg_adjusted_margin_pct: average(realBranchOnly.map((r) => r.adjusted_margin_pct)),
  };
}
