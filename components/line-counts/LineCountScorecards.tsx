"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { lineCountTotals } from "@/lib/line-counts-aggregations";
import { LINE_TYPE_LABELS } from "@/lib/line-counts-types";
import { formatInteger } from "@/lib/format";
import type { LineCountRow } from "@/lib/line-counts-types";

export function LineCountScorecards({ rows }: { rows: LineCountRow[] }) {
  const totals = lineCountTotals(rows);

  const cards = (["PO", "SO", "DIR", "TR"] as const).map((type) => ({
    label: LINE_TYPE_LABELS[type],
    value: formatInteger(totals[type].total),
    sub: `${formatInteger(totals[type].writer_count)} writers`,
  }));

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
            <div className="text-xs text-muted-foreground mt-1">{card.sub}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
