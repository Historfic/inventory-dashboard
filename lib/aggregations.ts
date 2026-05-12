import type { InventoryRow } from "./types";

export type BuyerAggregate = {
  buyer: string;
  avg_days_out: number;
  avg_stockout_pct: number;
  item_count: number;
};

export type BuyLineAggregate = {
  buy_line: string;
  avg_days_out: number;
  avg_stockout_pct: number;
  item_count: number;
};

type Bucket = {
  sum_days_out: number;
  sum_stockout_pct: number;
  item_count: number;
};

function groupAndSum<K extends string>(
  rows: InventoryRow[],
  keyFn: (r: InventoryRow) => K | null | undefined
): Map<K, Bucket> {
  const groups = new Map<K, Bucket>();
  for (const row of rows) {
    const key = keyFn(row);
    if (key == null) continue;
    let bucket = groups.get(key);
    if (!bucket) {
      bucket = { sum_days_out: 0, sum_stockout_pct: 0, item_count: 0 };
      groups.set(key, bucket);
    }
    bucket.sum_days_out += row.days_out ?? 0;
    bucket.sum_stockout_pct += row.stockout_pct ?? 0;
    bucket.item_count += 1;
  }
  return groups;
}

export function aggregateByBuyer(rows: InventoryRow[]): BuyerAggregate[] {
  const groups = groupAndSum(rows, (r) => r.buyer);
  return Array.from(groups.entries()).map(([buyer, b]) => ({
    buyer,
    avg_days_out: b.sum_days_out / b.item_count,
    avg_stockout_pct: b.sum_stockout_pct / b.item_count,
    item_count: b.item_count,
  }));
}

export function aggregateByBuyLine(rows: InventoryRow[]): BuyLineAggregate[] {
  const groups = groupAndSum(rows, (r) => r.buy_line);
  return Array.from(groups.entries()).map(([buy_line, b]) => ({
    buy_line,
    avg_days_out: b.sum_days_out / b.item_count,
    avg_stockout_pct: b.sum_stockout_pct / b.item_count,
    item_count: b.item_count,
  }));
}
