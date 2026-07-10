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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFreightTrend } from "@/hooks/useFreightTrend";
import { formatMonthLabel } from "@/lib/format";

export function FreightTrendChart() {
  const { data, loading, error } = useFreightTrend();

  const body = (() => {
    if (loading) {
      return <div className="py-12 text-center text-sm text-gray-500">Loading trend…</div>;
    }
    // Treat any fetch failure (e.g. view not yet created) the same as "no data yet".
    if (error || !data || data.length < 2) {
      return (
        <div className="py-12 text-center text-sm text-gray-500">
          Trend will appear after the next upload lands.
        </div>
      );
    }
    return (
      <div style={{ width: "100%", height: 280 }}>
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
            <CartesianGrid stroke="#e5e7eb" vertical={false} />
            <XAxis dataKey="report_date" tick={{ fontSize: 12 }} tickFormatter={formatMonthLabel} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(v: number) => `${v.toFixed(1)}%`} />
            <Tooltip
              labelFormatter={formatMonthLabel}
              formatter={(value) => {
                const n = typeof value === "number" ? value : Number(value);
                return [`${n.toFixed(2)}%`, "Freight % of Order"];
              }}
              cursor={{ stroke: "#cbd5e1" }}
            />
            <Line
              type="monotone"
              dataKey="freight_pct"
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
        <CardTitle>Trend — Freight % of Order, all uploads</CardTitle>
        <p className="text-xs text-muted-foreground">
          Weighted: SUM(freight $) / SUM(order $) per snapshot, company-wide. Not filtered by writer/vendor selection.
        </p>
      </CardHeader>
      <CardContent>{body}</CardContent>
    </Card>
  );
}
