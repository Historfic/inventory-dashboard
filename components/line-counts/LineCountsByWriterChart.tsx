"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DashboardCard } from "@/components/layout/DashboardCard";
import { EmptyState } from "@/components/layout/EmptyState";
import { ChartTooltip, renderLegendLabel } from "@/components/charts/ChartTooltip";
import { aggregateLineCountsByWriter } from "@/lib/line-counts-aggregations";
import {
  axisProps,
  BAR_CURSOR,
  gridProps,
  legendProps,
  LINE_TYPE_COLORS,
  stackedBarProps,
} from "@/lib/chart-theme";
import { formatCompact, formatInteger } from "@/lib/format";
import { LINE_TYPES, type LineCountRow } from "@/lib/line-counts-types";

export function LineCountsByWriterChart({ rows }: { rows: LineCountRow[] }) {
  const data = useMemo(() => aggregateLineCountsByWriter(rows), [rows]);

  return (
    <DashboardCard
      title="Lines by Writer"
      description="Stacked by line type. Sorted descending by total."
    >
      {data.length === 0 ? (
        <EmptyState message="No data." />
      ) : (
        <div style={{ width: "100%", height: 360 }}>
          <ResponsiveContainer>
            <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 40 }}>
              <CartesianGrid {...gridProps} />
              <XAxis {...axisProps} dataKey="writer" angle={-30} textAnchor="end" height={60} />
              <YAxis {...axisProps} tickFormatter={formatCompact} />
              <Tooltip
                cursor={BAR_CURSOR}
                content={({ active, payload, label }) => (
                  <ChartTooltip
                    active={active}
                    payload={payload}
                    label={label}
                    formatValue={(v) => formatInteger(v)}
                  />
                )}
              />
              <Legend {...legendProps} formatter={renderLegendLabel} />
              {LINE_TYPES.map((type) => (
                <Bar
                  key={type}
                  {...stackedBarProps}
                  dataKey={type}
                  stackId="lines"
                  fill={LINE_TYPE_COLORS[type]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </DashboardCard>
  );
}
