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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { aggregateByBuyer } from "@/lib/aggregations";
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
    <Card className="bg-white rounded-lg border border-sky-200 shadow-md">
      <CardHeader>
        <CardTitle>Days Out by Buyer (avg stockout %)</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-500">
            No data matches the current filters.
          </div>
        ) : (
          <div style={{ width: "100%", height: 320 }}>
            <ResponsiveContainer>
              <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 48 }}>
                <CartesianGrid stroke="#e5e7eb" vertical={false} />
                <XAxis
                  dataKey="buyer"
                  angle={-40}
                  textAnchor="end"
                  height={60}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  tickFormatter={(v) => `${v}%`}
                  tick={{ fontSize: 12 }}
                  domain={[0, 100]}
                />
                <Tooltip
                  formatter={(value) => [`${value}%`, "Avg stockout"]}
                  cursor={{ fill: "rgba(0,0,0,0.04)" }}
                />
                <Bar
                  dataKey="avg_pct"
                  fill="#0f172a"
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
          <p className="text-xs text-muted-foreground mt-2">
            Selected: <strong>{filters.buyerSelection}</strong> (click bar again to clear)
          </p>
        )}
      </CardContent>
    </Card>
  );
}
