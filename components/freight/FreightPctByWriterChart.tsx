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
import { aggregateFreightByWriter } from "@/lib/inbound-freight-aggregations";
import type { InboundFreightRow } from "@/lib/inbound-freight-types";

export function FreightPctByWriterChart({ rows }: { rows: InboundFreightRow[] }) {
  const data = useMemo(() => {
    return aggregateFreightByWriter(rows)
      .map((b) => ({
        writer: b.writer,
        freight_pct: b.freight_pct_of_order ?? 0,
      }))
      .filter((d) => d.freight_pct > 0)
      .sort((a, b) => b.freight_pct - a.freight_pct);
  }, [rows]);

  return (
    <Card className="bg-white rounded-lg border border-sky-200 shadow-md">
      <CardHeader>
        <CardTitle>Freight % of Order — by Writer</CardTitle>
        <p className="text-xs text-muted-foreground">
          Weighted: total freight $ / total order $. Sorted descending.
        </p>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-500">
            No writers with non-zero freight ratio.
          </div>
        ) : (
          <div style={{ width: "100%", height: 320 }}>
            <ResponsiveContainer>
              <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 40 }}>
                <CartesianGrid stroke="#e5e7eb" vertical={false} />
                <XAxis
                  dataKey="writer"
                  angle={-30}
                  textAnchor="end"
                  height={60}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v: number) => `${v.toFixed(1)}%`}
                />
                <Tooltip
                  formatter={(value) => {
                    const n = typeof value === "number" ? value : Number(value);
                    return [`${n.toFixed(2)}%`, "Freight % of Order"];
                  }}
                  cursor={{ fill: "rgba(0,0,0,0.04)" }}
                />
                <Bar dataKey="freight_pct" fill="#1d4ed8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
