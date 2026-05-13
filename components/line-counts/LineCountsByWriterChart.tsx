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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { aggregateLineCountsByWriter } from "@/lib/line-counts-aggregations";
import type { LineCountRow } from "@/lib/line-counts-types";

const COLORS = {
  PO: "#0f172a",
  SO: "#1d4ed8",
  DIR: "#0891b2",
  TR: "#7c3aed",
};

export function LineCountsByWriterChart({ rows }: { rows: LineCountRow[] }) {
  const data = useMemo(() => aggregateLineCountsByWriter(rows), [rows]);

  return (
    <Card className="bg-white rounded-lg border border-sky-200 shadow-md">
      <CardHeader>
        <CardTitle>Lines by Writer</CardTitle>
        <p className="text-xs text-muted-foreground">
          Stacked by line type. Sorted descending by total.
        </p>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-500">No data.</div>
        ) : (
          <div style={{ width: "100%", height: 360 }}>
            <ResponsiveContainer>
              <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 40 }}>
                <CartesianGrid stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="writer" angle={-30} textAnchor="end" height={60} tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip cursor={{ fill: "rgba(0,0,0,0.04)" }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="PO" stackId="lines" fill={COLORS.PO} />
                <Bar dataKey="SO" stackId="lines" fill={COLORS.SO} />
                <Bar dataKey="DIR" stackId="lines" fill={COLORS.DIR} />
                <Bar dataKey="TR" stackId="lines" fill={COLORS.TR} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
