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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LINE_TYPES, type LineCountRow } from "@/lib/line-counts-types";

const COLORS: Record<(typeof LINE_TYPES)[number], string> = {
  PO: "#1d4ed8",
  SO: "#0ea5e9",
  DIR: "#10b981",
  TR: "#f59e0b",
};

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
    const byDate = new Map<string, TrendPoint>();
    for (const r of rows) {
      const key = String(r.report_date);
      let point = byDate.get(key);
      if (!point) {
        point = { report_date: key, PO: 0, SO: 0, DIR: 0, TR: 0, total: 0 };
        byDate.set(key, point);
      }
      point[r.line_type] += r.line_count;
      point.total += r.line_count;
    }
    return Array.from(byDate.values()).sort((a, b) =>
      a.report_date.localeCompare(b.report_date)
    );
  }, [rows]);

  return (
    <Card className="bg-white rounded-lg border border-sky-200 shadow-md">
      <CardHeader>
        <CardTitle>Trend — Lines by Type, all uploads</CardTitle>
        <p className="text-xs text-muted-foreground">
          Stacked totals per upload, company-wide (not filtered by the picker above).
        </p>
      </CardHeader>
      <CardContent>
        {data.length < 2 ? (
          <div className="py-12 text-center text-sm text-gray-500">
            Trend will appear after the next upload lands.
          </div>
        ) : (
          <div style={{ width: "100%", height: 320 }}>
            <ResponsiveContainer>
              <AreaChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                <CartesianGrid stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="report_date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip cursor={{ fill: "rgba(0,0,0,0.04)" }} />
                <Legend />
                {LINE_TYPES.map((type) => (
                  <Area
                    key={type}
                    type="monotone"
                    dataKey={type}
                    stackId="1"
                    stroke={COLORS[type]}
                    fill={COLORS[type]}
                    fillOpacity={0.6}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
