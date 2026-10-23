"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
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
import { LINE_TYPES, type LineCountRow } from "@/lib/line-counts-types";
import {
  axisProps,
  gridProps,
  legendProps,
  LINE_CURSOR,
  LINE_TYPE_COLORS,
  stackedAreaProps,
} from "@/lib/chart-theme";
import { formatCompact, formatInteger, formatMonthLabel } from "@/lib/format";
import { monthNameToNumber } from "@/lib/trend";

type TrendPoint = {
  report_date: string;
  PO: number;
  SO: number;
  DIR: number;
  TR: number;
  total: number;
};

export function LineCountsTrendChart({ rows }: { rows: LineCountRow[] }) {
  const data = useMemo<TrendPoint[]>(() => {
    // report_date here is the real CSV export day, not a month-normalized
    // date (see CLAUDE.md §16) — different writers/types for the same
    // calendar month can legitimately have different export dates. Group by
    // the row's own `month` field (+ year parsed from report_date, for
    // cross-year uniqueness) instead of the exact date, or one month splits
    // into several trend points.
    const byMonth = new Map<string, TrendPoint>();
    for (const r of rows) {
      if (!r.month) continue;
      const year = String(r.report_date).slice(0, 4);
      const key = `${year}-${monthNameToNumber(r.month)}`;
      let point = byMonth.get(key);
      if (!point) {
        point = { report_date: key, PO: 0, SO: 0, DIR: 0, TR: 0, total: 0 };
        byMonth.set(key, point);
      }
      point[r.line_type] += r.line_count;
      point.total += r.line_count;
    }
    return Array.from(byMonth.values()).sort((a, b) =>
      a.report_date.localeCompare(b.report_date)
    );
  }, [rows]);

  return (
    <DashboardCard
      title="Trend — Lines by Type, all uploads"
      description="Stacked totals per upload, company-wide (not filtered by the picker above)."
    >
      {data.length < 2 ? (
        <EmptyState message="Trend will appear after the next upload lands." />
      ) : (
        <div style={{ width: "100%", height: 320 }}>
          <ResponsiveContainer>
            <AreaChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
              <CartesianGrid {...gridProps} />
              <XAxis {...axisProps} dataKey="report_date" tickFormatter={formatMonthLabel} />
              <YAxis {...axisProps} tickFormatter={formatCompact} />
              <Tooltip
                cursor={LINE_CURSOR}
                content={({ active, payload, label }) => (
                  <ChartTooltip
                    active={active}
                    payload={payload}
                    label={label}
                    formatLabel={formatMonthLabel}
                    formatValue={(v) => formatInteger(v)}
                  />
                )}
              />
              <Legend {...legendProps} formatter={renderLegendLabel} />
              {LINE_TYPES.map((type) => (
                <Area
                  key={type}
                  type="monotone"
                  dataKey={type}
                  stackId="1"
                  {...stackedAreaProps(LINE_TYPE_COLORS[type])}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </DashboardCard>
  );
}
