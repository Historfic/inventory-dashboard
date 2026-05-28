"use client";

import { useMemo } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useInventoryTrend } from "@/hooks/useInventoryTrend";

export function InventoryTrendChart() {
  const { data, loading, error } = useInventoryTrend();

  const chartData = useMemo(() => {
    if (!data) return [];
    return data.map((p) => ({
      report_date: p.report_date,
      stockout_pct: p.avg_stockout_pct == null ? null : p.avg_stockout_pct * 100,
      critical_fires: p.critical_fires_count,
    }));
  }, [data]);

  const body = (() => {
    if (loading) {
      return <div className="py-12 text-center text-sm text-gray-500">Loading trend…</div>;
    }
    // Treat any fetch failure (e.g. view not yet created) the same as "no data yet".
    if (error || chartData.length < 2) {
      return (
        <div className="py-12 text-center text-sm text-gray-500">
          Trend will appear after the next snapshot lands.
        </div>
      );
    }
    return (
      <div style={{ width: "100%", height: 300 }}>
        <ResponsiveContainer>
          <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
            <CartesianGrid stroke="#e5e7eb" vertical={false} />
            <XAxis dataKey="report_date" tick={{ fontSize: 12 }} />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 12 }}
              tickFormatter={(v: number) => `${Math.round(v)}%`}
              label={{ value: "Avg stockout %", angle: -90, position: "insideLeft", style: { fontSize: 11, fill: "#1d4ed8" } }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 12 }}
              label={{ value: "Critical fires", angle: 90, position: "insideRight", style: { fontSize: 11, fill: "#dc2626" } }}
            />
            <Tooltip
              cursor={{ stroke: "#cbd5e1" }}
              formatter={(value, name) => {
                const n = typeof value === "number" ? value : Number(value);
                if (name === "stockout_pct") return [`${n.toFixed(1)}%`, "Avg stockout"];
                if (name === "critical_fires") return [Math.round(n).toLocaleString(), "Critical fires"];
                return [n, String(name)];
              }}
            />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="stockout_pct"
              name="Avg stockout %"
              stroke="#1d4ed8"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="critical_fires"
              name="Critical fires"
              stroke="#dc2626"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  })();

  return (
    <Card className="bg-white rounded-lg border border-sky-200 shadow-md">
      <CardHeader>
        <CardTitle>Trend — Company stockout & critical fires, all snapshots</CardTitle>
        <p className="text-xs text-muted-foreground">
          Daily, company-wide. Not filtered by branch / buyer / date range / UNASSIGNED toggle above.
        </p>
      </CardHeader>
      <CardContent>{body}</CardContent>
    </Card>
  );
}
