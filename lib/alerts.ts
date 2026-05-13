import type { InventoryRow } from "./types";
import { aggregateByBuyer } from "./aggregations";

export type AlertSeverity = "warning" | "critical";

export type AlertRule = {
  id: string;
  severity: AlertSeverity;
  label: string;
  predicate: (row: InventoryRow) => boolean;
};

export type Alert = {
  rule: AlertRule;
  rows: InventoryRow[];
};

export type Bottleneck = {
  id: string;
  label: string;
  dimension: "buyer" | "buy_line";
  key: string;
  count: number;
  metric: number;
};

const STOCKOUT_SEVERE = 0.8;
const DAYS_OUT_AGING = 30;
const TOP_BUY_LINES_BOTTLENECK = 5;
const TOP_BUYERS_BOTTLENECK = 3;

export const ALERT_RULES: AlertRule[] = [
  {
    id: "critical-stockout-no-po",
    severity: "critical",
    label: "Fully out of stock with no PO placed",
    predicate: (r) => (r.stockout_pct ?? 0) >= 1.0 && (r.on_po ?? 0) === 0,
  },
  {
    id: "severe-stockout",
    severity: "warning",
    label: `Stockout ≥ ${Math.round(STOCKOUT_SEVERE * 100)}%`,
    predicate: (r) => (r.stockout_pct ?? 0) >= STOCKOUT_SEVERE && (r.stockout_pct ?? 0) < 1.0,
  },
  {
    id: "aging-stockout",
    severity: "warning",
    label: `Days out ≥ ${DAYS_OUT_AGING} (partial)`,
    predicate: (r) => (r.days_out ?? 0) >= DAYS_OUT_AGING && (r.stockout_pct ?? 0) < 1.0,
  },
];

export function evaluateAlerts(rows: InventoryRow[]): Alert[] {
  return ALERT_RULES.map((rule) => ({
    rule,
    rows: rows.filter(rule.predicate),
  })).filter((alert) => alert.rows.length > 0);
}

export function evaluateBottlenecks(rows: InventoryRow[]): Bottleneck[] {
  const criticalRule = ALERT_RULES.find((r) => r.id === "critical-stockout-no-po")!;
  const criticalRows = rows.filter(criticalRule.predicate);

  const byBuyLine = new Map<string, number>();
  for (const row of criticalRows) {
    if (!row.buy_line) continue;
    byBuyLine.set(row.buy_line, (byBuyLine.get(row.buy_line) ?? 0) + 1);
  }
  const buyLineBottlenecks: Bottleneck[] = Array.from(byBuyLine.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP_BUY_LINES_BOTTLENECK)
    .map(([key, count]) => ({
      id: `buy-line-${key}`,
      label: key,
      dimension: "buy_line" as const,
      key,
      count,
      metric: count,
    }));

  const buyerAggregates = aggregateByBuyer(rows)
    .sort((a, b) => b.avg_stockout_pct - a.avg_stockout_pct)
    .slice(0, TOP_BUYERS_BOTTLENECK);
  const buyerBottlenecks: Bottleneck[] = buyerAggregates.map((b) => ({
    id: `buyer-${b.buyer}`,
    label: b.buyer,
    dimension: "buyer" as const,
    key: b.buyer,
    count: b.item_count,
    metric: b.avg_stockout_pct,
  }));

  return [...buyLineBottlenecks, ...buyerBottlenecks];
}
