"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { companyTotals } from "@/lib/gmroi-aggregations";
import { formatDollars, formatInteger } from "@/lib/format";
import type { GmroiRow } from "@/lib/gmroi-types";

export function GmroiOverviewCards({ rows }: { rows: GmroiRow[] }) {
  const totals = companyTotals(rows);

  const cards = [
    { label: "Total GP $", value: formatDollars(totals.total_gp_dollars) },
    { label: "Total COGS $", value: formatDollars(totals.total_cogs_dollars) },
    { label: "$ On Hand", value: formatDollars(totals.total_on_hand_dollars) },
    {
      label: "Avg GMROI",
      value: totals.avg_gmroi == null ? "—" : formatInteger(totals.avg_gmroi),
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label} className="bg-white shadow-sm rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {card.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tabular-nums">{card.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
