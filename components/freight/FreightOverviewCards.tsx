"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { freightTotals } from "@/lib/inbound-freight-aggregations";
import { formatDollars, formatInteger } from "@/lib/format";
import type { InboundFreightRow } from "@/lib/inbound-freight-types";

export function FreightOverviewCards({ rows }: { rows: InboundFreightRow[] }) {
  const totals = freightTotals(rows);

  const cards = [
    { label: "Total Order $", value: formatDollars(totals.total_gen_total), sub: `${formatInteger(totals.line_count)} line items` },
    { label: "Total Freight $", value: formatDollars(totals.total_freight), sub: `${formatInteger(totals.vendor_count)} vendors` },
    {
      label: "Avg Inbound %",
      value: totals.avg_inbound_pct == null ? "—" : `${Math.round(totals.avg_inbound_pct)}%`,
      sub: `across ${formatInteger(totals.writer_count)} writers`,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
