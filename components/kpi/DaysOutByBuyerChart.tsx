"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DashboardCard } from "@/components/layout/DashboardCard";
import { EmptyState } from "@/components/layout/EmptyState";
import { ChartTooltip } from "@/components/charts/ChartTooltip";
import { aggregateByBuyer } from "@/lib/aggregations";
import { axisProps, BAR_CURSOR, barProps, gridProps, SERIES } from "@/lib/chart-theme";
import { useFilterState } from "@/hooks/useFilterState";
import type { InventoryRow } from "@/lib/types";

export function DaysOutByBuyerChart({ rows }: { rows: InventoryRow[] }) {
  const { filters, toggleBuyer } = useFilterState();

  const data = useMemo(() => {
    return aggregateByBuyer(rows)
      .map((b) => ({
        buyer: b.buyer,
        avg_pct: Math.round(b.avg_stockout_pct * 100),
      }))
      .sort((a, b) => b.avg_pct - a.avg_pct);
  }, [rows]);

  return (
    <DashboardCard title="Days Out by Buyer (avg stockout %)">
      {data.length === 0 ? (
        <EmptyState message="No data matches the current filters." />
      ) : (
        <div style={{ width: "100%", height: 320 }}>
          <ResponsiveContainer>
            <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 48 }}>
              <CartesianGrid {...gridProps} />
              <XAxis {...axisProps} dataKey="buyer" angle={-40} textAnchor="end" height={60} />
              <YAxis {...axisProps} tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
              <Tooltip
                cursor={BAR_CURSOR}
                content={({ active, payload, label }) => (
                  <ChartTooltip
                    active={active}
                    payload={payload}
                    label={label}
                    formatValue={(v) => `${v}%`}
                    seriesName={() => "Avg stockout"}
                  />
                )}
              />
              <Bar
                {...barProps}
                dataKey="avg_pct"
                fill={SERIES[0]}
                cursor="pointer"
                onClick={(payload: unknown) => {
                  const buyer = (payload as { buyer?: unknown } | null)?.buyer;
                  if (typeof buyer === "string") toggleBuyer(buyer);
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      {filters.buyerSelection && (
        <p className="mt-2 text-xs text-muted-foreground">
          Selected: <strong className="text-foreground">{filters.buyerSelection}</strong> (click bar
          again to clear)
        </p>
      )}
    </DashboardCard>
  );
}
