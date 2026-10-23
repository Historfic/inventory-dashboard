"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DashboardCard } from "@/components/layout/DashboardCard";
import { EmptyState } from "@/components/layout/EmptyState";
import { ChartTooltip } from "@/components/charts/ChartTooltip";
import { aggregateFreightByWriter } from "@/lib/inbound-freight-aggregations";
import {
  axisProps,
  BAR_CURSOR,
  barProps,
  DIMMED_BAR,
  gridProps,
  SERIES,
} from "@/lib/chart-theme";
import { useFreightFilterState } from "@/hooks/useFreightFilterState";
import type { InboundFreightRow } from "@/lib/inbound-freight-types";

export function FreightPctByWriterChart({ rows }: { rows: InboundFreightRow[] }) {
  const { filters, toggleWriter } = useFreightFilterState();
  const selected = filters.writerSelection;
  const data = useMemo(() => {
    return aggregateFreightByWriter(rows)
      .map((b) => ({
        writer: b.writer,
        freight_pct: b.freight_pct_of_order ?? 0,
      }))
      .filter((d) => d.freight_pct > 0)
      .sort((a, b) => b.freight_pct - a.freight_pct);
  }, [rows]);

  return (
    <DashboardCard
      title="Freight % of Order — by Writer"
      description="Weighted: total freight $ / total order $. Sorted descending."
    >
      {data.length === 0 ? (
        <EmptyState message="No writers with non-zero freight ratio." />
      ) : (
        <div style={{ width: "100%", height: 320 }}>
          <ResponsiveContainer>
            <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 40 }}>
              <CartesianGrid {...gridProps} />
              <XAxis {...axisProps} dataKey="writer" angle={-30} textAnchor="end" height={60} />
              <YAxis {...axisProps} tickFormatter={(v: number) => `${v.toFixed(1)}%`} />
              <Tooltip
                cursor={BAR_CURSOR}
                content={({ active, payload, label }) => (
                  <ChartTooltip
                    active={active}
                    payload={payload}
                    label={label}
                    formatValue={(v) => `${v.toFixed(2)}%`}
                    seriesName={() => "Freight % of Order"}
                  />
                )}
              />
              <Bar {...barProps} dataKey="freight_pct" fill={SERIES[0]} cursor="pointer">
                {data.map((entry) => (
                  <Cell
                    key={entry.writer}
                    fill={selected === null || selected === entry.writer ? SERIES[0] : DIMMED_BAR}
                    onClick={() => toggleWriter(entry.writer)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </DashboardCard>
  );
}
