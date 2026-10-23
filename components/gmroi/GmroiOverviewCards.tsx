"use client";

import { StatTile } from "@/components/layout/StatTile";
import { companyTotals } from "@/lib/gmroi-aggregations";
import { formatDecimal, formatDollars } from "@/lib/format";
import type { GmroiRow } from "@/lib/gmroi-types";

export function GmroiOverviewCards({ rows }: { rows: GmroiRow[] }) {
  const totals = companyTotals(rows);

  const cards = [
    { label: "Annual COGS$", value: formatDollars(totals.total_annual_cogs_dollars) },
    { label: "Avg $OnHand", value: formatDollars(totals.total_on_hand_dollars) },
    {
      label: "Turns",
      value: totals.weighted_turns == null ? "—" : formatDecimal(totals.weighted_turns, 2),
    },
    {
      label: "Adjusted Margin%",
      value:
        totals.avg_adjusted_margin_pct == null
          ? "—"
          : `${formatDecimal(totals.avg_adjusted_margin_pct, 2)}%`,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <StatTile key={card.label} label={card.label} value={card.value} />
      ))}
    </div>
  );
}
