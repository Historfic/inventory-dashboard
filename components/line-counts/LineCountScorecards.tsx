"use client";

import { StatTile } from "@/components/layout/StatTile";
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
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((card) => (
        <StatTile key={card.label} label={card.label} value={card.value} sublabel={card.sub} />
      ))}
    </div>
  );
}
