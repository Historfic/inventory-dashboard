"use client";

import { StatTile } from "@/components/layout/StatTile";
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

  // Phones: Total Order $ full width on top, the other two side by side. From sm up: three across.
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {cards.map((card, i) => (
        <StatTile
          key={card.label}
          label={card.label}
          value={card.value}
          sublabel={card.sub}
          className={i === 0 ? "col-span-2 sm:col-span-1" : undefined}
        />
      ))}
    </div>
  );
}
