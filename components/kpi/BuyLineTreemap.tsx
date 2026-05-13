"use client";

import { useMemo } from "react";
import { ResponsiveContainer, Treemap, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFilterState } from "@/hooks/useFilterState";
import type { InventoryRow } from "@/lib/types";

type Cell = {
  name: string;
  size: number;
};

function colorScale(value: number, max: number): string {
  if (max <= 0) return "#cbd5e1";
  const t = Math.min(1, value / max);
  const hue = 220;
  const sat = 70;
  const lightness = 80 - Math.floor(t * 50);
  return `hsl(${hue}, ${sat}%, ${lightness}%)`;
}

export function BuyLineTreemap({ rows }: { rows: InventoryRow[] }) {
  const { filters, toggleBuyLine } = useFilterState();

  const data = useMemo<Cell[]>(() => {
    const counts = new Map<string, number>();
    for (const row of rows) {
      if (row.on_po !== 0) continue;
      const key = row.buy_line ?? "";
      if (!key) continue;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([name, size]) => ({ name, size }))
      .filter((c) => c.size > 0)
      .sort((a, b) => b.size - a.size);
  }, [rows]);

  const max = data.length > 0 ? data[0].size : 0;

  return (
    <Card className="bg-white shadow-sm rounded-lg">
      <CardHeader>
        <CardTitle>Buy Lines with No PO Outstanding</CardTitle>
        <p className="text-xs text-muted-foreground">
          Cells sized by count of items where on_po = 0. Click a cell to filter.
        </p>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-500">
            No buy lines have items with on_po = 0.
          </div>
        ) : (
          <div style={{ width: "100%", height: 360 }}>
            <ResponsiveContainer>
              <Treemap
                data={data}
                dataKey="size"
                stroke="#fff"
                fill="#cbd5e1"
                content={<CustomCell max={max} selected={filters.buyLineSelection} />}
                onClick={(node: unknown) => {
                  const name = (node as { name?: unknown } | null)?.name;
                  if (typeof name === "string") toggleBuyLine(name);
                }}
              >
                <Tooltip
                  formatter={(value, _name, item) => {
                    const cellName = (item as { payload?: { name?: string } } | undefined)?.payload?.name ?? "";
                    return [`${value} items`, cellName];
                  }}
                />
              </Treemap>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

type CustomCellProps = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  name?: string;
  size?: number;
  max: number;
  selected: string | null;
};

function CustomCell(props: CustomCellProps) {
  const { x = 0, y = 0, width = 0, height = 0, name = "", size = 0, max, selected } = props;
  const fill = colorScale(size, max);
  const isSelected = selected === name;
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill,
          stroke: isSelected ? "#0f172a" : "#fff",
          strokeWidth: isSelected ? 2 : 1,
          cursor: "pointer",
        }}
      />
      {width > 60 && height > 24 && (
        <>
          <text
            x={x + width / 2}
            y={y + height / 2 - 6}
            textAnchor="middle"
            fill="#0f172a"
            fontSize={11}
            fontWeight={500}
          >
            {name}
          </text>
          <text
            x={x + width / 2}
            y={y + height / 2 + 10}
            textAnchor="middle"
            fill="#475569"
            fontSize={10}
          >
            {size}
          </text>
        </>
      )}
    </g>
  );
}
