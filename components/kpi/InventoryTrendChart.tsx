"use client";

import { useMemo } from "react";
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
import { useInventoryTrend } from "@/hooks/useInventoryTrend";
import { useFilterState } from "@/hooks/useFilterState";
import { axisProps, gridProps, LINE_CURSOR, lineProps, SERIES } from "@/lib/chart-theme";
import { formatMonthLabel } from "@/lib/format";

export function InventoryTrendChart() {
  const { filters } = useFilterState();
  const buyer = filters.buyerSelection;
  const { data, loading, error } = useInventoryTrend(buyer);

  const chartData = useMemo(() => {
    if (!data) return [];
    return data.map((p) => ({
      report_date: p.report_date,
      stockout_pct: p.avg_stockout_pct == null ? null : p.avg_stockout_pct * 100,
    }));
  }, [data]);

  const body = (() => {
    if (loading) {
      return <Skeleton className="h-[280px] w-full" label="Loading trend…" />;
    }
    if (error || chartData.length < 2) {
      return (
        <EmptyState
          message={
            buyer
              ? `No trend yet for ${buyer} — need at least two snapshots.`
              : "Trend will appear after the next snapshot lands."
          }
        />
      );
    }
    return (
      <div style={{ width: "100%", height: 280 }}>
        <ResponsiveContainer>
          <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
            <CartesianGrid {...gridProps} />
            <XAxis {...axisProps} dataKey="report_date" tickFormatter={formatMonthLabel} />
            <YAxis {...axisProps} tickFormatter={(v: number) => `${Math.round(v)}%`} />
            <Tooltip
              cursor={LINE_CURSOR}
              content={({ active, payload, label }) => (
                <ChartTooltip
                  active={active}
                  payload={payload}
                  label={label}
                  formatLabel={formatMonthLabel}
                  formatValue={(v) => `${v.toFixed(1)}%`}
                  seriesName={() => "Avg stockout"}
                />
              )}
            />
            <Line type="monotone" dataKey="stockout_pct" {...lineProps(SERIES[0])} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  })();

  return (
    <DashboardCard
      title={buyer ? `Trend — ${buyer}` : "Trend — Company stockout, all snapshots"}
      description={
        buyer
          ? `Avg stockout % per snapshot for ${buyer}. Click ${buyer} again or "Clear all" to reset to company-wide.`
          : "Company-wide avg stockout % per snapshot. Click any buyer below to drill in."
      }
    >
      {body}
    </DashboardCard>
  );
}
