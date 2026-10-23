"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney, formatPct1, formatTimeAgo } from "@/lib/arbitrage-format";
import type { ArbitrageLead, SourcingRun } from "@/lib/arbitrage-types";

type Props = { leads: ArbitrageLead[]; runs: SourcingRun[]; now: number };

export function ArbitrageOverviewCards({ leads, runs, now }: Props) {
  const profitable = leads.filter((l) => l.is_profitable).length;
  // Leads arrive fresh-first, best ROI first; stale Keepa data never counts.
  const best = leads.find((l) => l.roi_pct != null && !l.is_stale) ?? null;
  const lastRun = runs[0] ?? null;

  const cards = [
    { label: "Leads tracked", value: leads.length.toLocaleString(), sub: "UPC → ASIN matches" },
    { label: "Profitable leads", value: profitable.toLocaleString(), sub: "ROI ≥ 30%, profit ≥ $3, fresh Keepa data" },
    { label: "Best ROI", value: formatPct1(best?.roi_pct), sub: best ? `${formatMoney(best.net_profit)} per unit` : "—" },
    {
      label: "Last run",
      value: formatTimeAgo(lastRun?.finished_at, now),
      sub: lastRun ? `${lastRun.asins_matched ?? 0} matched · ${lastRun.profitable ?? 0} profitable` : "No runs yet",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label} className="bg-white rounded-lg border border-sky-200 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {card.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tabular-nums">{card.value}</div>
            <p className="mt-1 truncate text-xs text-muted-foreground" title={card.sub}>
              {card.sub}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
