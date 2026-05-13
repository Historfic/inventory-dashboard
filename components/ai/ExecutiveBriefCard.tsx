"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useExecutiveBrief } from "@/hooks/useExecutiveBrief";
import { aggregateByBuyer } from "@/lib/aggregations";
import { evaluateAlerts } from "@/lib/alerts";
import type { InventoryRow } from "@/lib/types";
import type { BriefRequest } from "@/app/api/brief/route";

type Props = {
  rows: InventoryRow[];
  reportDate: string | null;
};

export function ExecutiveBriefCard({ rows, reportDate }: Props) {
  const payload = useMemo<BriefRequest | null>(() => {
    if (!reportDate || rows.length === 0) return null;

    const revenueAtRisk = rows.reduce((acc, r) => acc + (r.hits ?? 0), 0);
    const criticalFires = rows.length;

    const topBuyersByStockout = aggregateByBuyer(rows)
      .filter((b) => b.buyer !== "UNASSIGNED")
      .sort((a, b) => b.avg_stockout_pct - a.avg_stockout_pct)
      .slice(0, 5)
      .map((b) => ({
        buyer: b.buyer,
        avg_stockout_pct: b.avg_stockout_pct,
        item_count: b.item_count,
      }));

    const noPoCounts = new Map<string, number>();
    for (const row of rows) {
      if ((row.stockout_pct ?? 0) >= 1.0 && (row.on_po ?? 0) === 0 && row.buy_line) {
        noPoCounts.set(row.buy_line, (noPoCounts.get(row.buy_line) ?? 0) + 1);
      }
    }
    const topBuyLinesNoPo = Array.from(noPoCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([buy_line, count]) => ({ buy_line, count }));

    const alerts = evaluateAlerts(rows);
    const alertCounts = {
      critical: alerts.filter((a) => a.rule.severity === "critical").reduce((a, x) => a + x.rows.length, 0),
      warning: alerts.filter((a) => a.rule.severity === "warning").reduce((a, x) => a + x.rows.length, 0),
    };

    return {
      reportDate,
      itemsShown: rows.length,
      revenueAtRisk,
      criticalFires,
      topBuyersByStockout,
      topBuyLinesNoPo,
      alertCounts,
    };
  }, [rows, reportDate]);

  const { text, loading, error, cached } = useExecutiveBrief(payload);

  return (
    <Card className="bg-white rounded-lg border border-sky-200 shadow-md">
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle>Executive Brief</CardTitle>
        <span className="text-xs text-gray-500">
          {loading
            ? "Drafting…"
            : cached
              ? "cached · Claude Haiku 4.5"
              : text
                ? "fresh · Claude Haiku 4.5"
                : ""}
        </span>
      </CardHeader>
      <CardContent>
        {!payload ? (
          <p className="text-sm text-gray-500">Brief appears once the snapshot loads.</p>
        ) : loading ? (
          <div className="space-y-2">
            <div className="h-3 w-full animate-pulse rounded bg-sky-100" />
            <div className="h-3 w-11/12 animate-pulse rounded bg-sky-100" />
            <div className="h-3 w-10/12 animate-pulse rounded bg-sky-100" />
            <div className="mt-3 h-3 w-11/12 animate-pulse rounded bg-sky-100" />
            <div className="h-3 w-9/12 animate-pulse rounded bg-sky-100" />
          </div>
        ) : error ? (
          <p className="text-sm text-red-700">Brief unavailable: {error}</p>
        ) : (
          <div className="space-y-3 whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
            {text}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
