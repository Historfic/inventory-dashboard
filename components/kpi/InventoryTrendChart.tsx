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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useInventoryTrend } from "@/hooks/useInventoryTrend";
import { useFilterState } from "@/hooks/useFilterState";

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
      return <div className="py-12 text-center text-sm text-gray-500">Loading trend…</div>;
    }
    if (error || chartData.length < 2) {
      return (
        <div className="py-12 text-center text-sm text-gray-500">
          {buyer
            ? `No trend yet for ${buyer} — need at least two snapshots.`
            : "Trend will appear after the next snapshot lands."}
        </div>
      );
    }
    return (
      <div style={{ width: "100%", height: 280 }}>
        <ResponsiveContainer>
          <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
            <CartesianGrid stroke="#e5e7eb" vertical={false} />
            <XAxis dataKey="report_date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(v: number) => `${Math.round(v)}%`} />
            <Tooltip
              cursor={{ stroke: "#cbd5e1" }}
              formatter={(value) => {
                const n = typeof value === "number" ? value : Number(value);
                return [`${n.toFixed(1)}%`, "Avg stockout"];
              }}
            />
            <Line
              type="monotone"
              dataKey="stockout_pct"
              stroke="#1d4ed8"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  })();

  return (
    <Card className="bg-white rounded-lg border border-sky-200 shadow-md">
      <CardHeader>
        <CardTitle>
          {buyer ? `Trend — ${buyer}` : "Trend — Company stockout, all snapshots"}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {buyer
            ? `Avg stockout % per snapshot for ${buyer}. Click ${buyer} again or "Clear all" to reset to company-wide.`
            : "Company-wide avg stockout % per snapshot. Click any buyer below to drill in."}
        </p>
      </CardHeader>
      <CardContent>{body}</CardContent>
    </Card>
  );
}
