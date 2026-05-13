import type { InventoryRow } from "./types";

export type FilterState = {
  branches: string[];
  dateStart: string;
  dateEnd: string;
  buyerSelection: string | null;
  buyLineSelection: string | null;
  hideUnassigned: boolean;
};

export const UNASSIGNED = "UNASSIGNED";

export function defaultFilterState(): FilterState {
  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 7);
  return {
    branches: [],
    dateStart: toISODate(sevenDaysAgo),
    dateEnd: toISODate(today),
    buyerSelection: null,
    buyLineSelection: null,
    hideUnassigned: false,
  };
}

export function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function applyClientFilters(
  rows: InventoryRow[],
  filters: FilterState
): InventoryRow[] {
  return rows.filter((row) => {
    if (filters.hideUnassigned && row.buyer === UNASSIGNED) return false;
    if (filters.buyerSelection && row.buyer !== filters.buyerSelection) return false;
    if (filters.buyLineSelection && row.buy_line !== filters.buyLineSelection) return false;
    return true;
  });
}

export function uniqueBranches(rows: InventoryRow[]): string[] {
  const set = new Set<string>();
  for (const row of rows) {
    if (row.branch_id != null) set.add(String(row.branch_id));
  }
  return Array.from(set).sort((a, b) => {
    const an = Number(a);
    const bn = Number(b);
    if (Number.isFinite(an) && Number.isFinite(bn)) return an - bn;
    return a.localeCompare(b);
  });
}

export function hasActiveFilters(filters: FilterState): boolean {
  return (
    filters.branches.length > 0 ||
    filters.buyerSelection !== null ||
    filters.buyLineSelection !== null ||
    filters.hideUnassigned
  );
}
