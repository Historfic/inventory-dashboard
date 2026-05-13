"use client";

import { useMemo, useState } from "react";
import type { Alert } from "@/lib/alerts";
import { useAlertExplanation } from "@/hooks/useAlertExplanation";
import type { ExplainRequest } from "@/app/api/explain/route";

type Props = {
  alert: Alert;
  reportDate: string | null;
};

export function AlertCard({ alert, reportDate }: Props) {
  const [expanded, setExpanded] = useState(false);

  const isCritical = alert.rule.severity === "critical";
  const badgeClass = isCritical
    ? "bg-red-100 text-red-800 border-red-200"
    : "bg-amber-100 text-amber-800 border-amber-200";
  const bodyClass = isCritical
    ? "border-l-4 border-red-400 bg-red-50"
    : "border-l-4 border-amber-400 bg-amber-50";

  const payload = useMemo<ExplainRequest | null>(() => {
    if (!reportDate || alert.rows.length === 0) return null;

    const buyerCounts = new Map<string, number>();
    const buyLineCounts = new Map<string, number>();
    for (const r of alert.rows) {
      if (r.buyer) buyerCounts.set(r.buyer, (buyerCounts.get(r.buyer) ?? 0) + 1);
      if (r.buy_line) buyLineCounts.set(r.buy_line, (buyLineCounts.get(r.buy_line) ?? 0) + 1);
    }
    const topBuyers = Array.from(buyerCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([buyer, count]) => ({ buyer, count }));
    const topBuyLines = Array.from(buyLineCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([buy_line, count]) => ({ buy_line, count }));

    const sample = alert.rows
      .slice()
      .sort((a, b) => (b.days_out ?? 0) - (a.days_out ?? 0))
      .slice(0, 5)
      .map((r) => ({
        ecl_id: r.ecl_id,
        desc_1: r.desc_1,
        days_out: r.days_out,
        stockout_pct: r.stockout_pct,
      }));

    return {
      reportDate,
      alertId: alert.rule.id,
      alertLabel: alert.rule.label,
      severity: alert.rule.severity,
      itemCount: alert.rows.length,
      topBuyers,
      topBuyLines,
      sample,
    };
  }, [alert, reportDate]);

  const { text, loading, error } = useAlertExplanation(payload, expanded);

  return (
    <div className={`rounded-md ${bodyClass} px-4 py-3`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold uppercase border rounded px-2 py-0.5 ${badgeClass}`}>
            {alert.rule.severity}
          </span>
          <span className="text-sm font-medium text-gray-900">{alert.rule.label}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm tabular-nums text-gray-700">
            {alert.rows.length.toLocaleString()} items
          </span>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-xs font-medium text-sky-700 hover:text-sky-900"
            disabled={!payload}
          >
            {expanded ? "Hide" : "Why this matters →"}
          </button>
        </div>
      </div>
      {expanded && (
        <div className="mt-3 border-t border-black/5 pt-3 text-sm text-gray-800">
          {loading ? (
            <div className="space-y-2">
              <div className="h-3 w-11/12 animate-pulse rounded bg-black/5" />
              <div className="h-3 w-10/12 animate-pulse rounded bg-black/5" />
              <div className="mt-2 h-3 w-9/12 animate-pulse rounded bg-black/5" />
            </div>
          ) : error ? (
            <p className="text-red-700">Explanation unavailable: {error}</p>
          ) : (
            <div className="whitespace-pre-wrap leading-relaxed">{text}</div>
          )}
        </div>
      )}
    </div>
  );
}
