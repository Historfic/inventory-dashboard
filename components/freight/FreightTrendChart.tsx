"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DashboardCard } from "@/components/layout/DashboardCard";
import { EmptyState } from "@/components/layout/EmptyState";
import { Skeleton } from "@/components/layout/Skeleton";
import { ChartTooltip } from "@/components/charts/ChartTooltip";
import { useFreightTrend } from "@/hooks/useFreightTrend";
import { axisProps, gridProps, LINE_CURSOR, lineProps, SERIES } from "@/lib/chart-theme";
import { formatMonthLabel } from "@/lib/format";

export function FreightTrendChart() {
  const { data, loading, error } = useFreightTrend();

  const body = (() => {
    if (loading) {
      return <Skeleton className="h-[280px] w-full" label="Loading trend…" />;
    }
    // Treat any fetch failure (e.g. view not yet created) the same as "no data yet".
    if (error || !data || data.length < 2) {
      return <EmptyState message="Trend will appear after the next upload lands." />;
    }
    return (
      <div style={{ width: "100%", height: 280 }}>
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
            <CartesianGrid {...gridProps} />
            <XAxis {...axisProps} dataKey="report_date" tickFormatter={formatMonthLabel} />
            <YAxis {...axisProps} tickFormatter={(v: number) => `${v.toFixed(1)}%`} />
            <Tooltip
              cursor={LINE_CURSOR}
              content={({ active, payload, label }) => (
                <ChartTooltip
                  active={active}
                  payload={payload}
                  label={label}
                  formatLabel={formatMonthLabel}
                  formatValue={(v) => `${v.toFixed(2)}%`}
                  seriesName={() => "Freight % of Order"}
                />
              )}
            />
            <Line type="monotone" dataKey="freight_pct" {...lineProps(SERIES[0])} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  })();

  return (
    <DashboardCard
      title="Trend — Freight % of Order, all uploads"
      description="Weighted: SUM(freight $) / SUM(order $) per snapshot, company-wide. Not filtered by writer/vendor selection."
    >
      {body}
    </DashboardCard>
  );
}
