"use client";

import { useMemo, useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { aggregateGmroiByBuyLine, type GmroiByBuyLine } from "@/lib/gmroi-aggregations";
import { formatDecimal, formatInteger } from "@/lib/format";
import type { GmroiRow } from "@/lib/gmroi-types";

const numericClass = "text-right tabular-nums";

const columns: ColumnDef<GmroiByBuyLine>[] = [
  { accessorKey: "buy_line", header: "Buy Line" },
  {
    accessorKey: "avg_gmroi",
    header: "Avg GMROI",
    cell: ({ getValue }) => (
      <span className={numericClass}>
        {(() => {
          const v = getValue<number | null>();
          return v == null ? "—" : formatInteger(v);
        })()}
      </span>
    ),
    meta: { numeric: true },
  },
  {
    accessorKey: "avg_turns",
    header: "Avg Turns",
    cell: ({ getValue }) => (
      <span className={numericClass}>
        {(() => {
          const v = getValue<number | null>();
          return v == null ? "—" : formatDecimal(v, 2);
        })()}
      </span>
    ),
    meta: { numeric: true },
  },
  {
    accessorKey: "avg_markup_pct",
    header: "Avg Markup %",
    cell: ({ getValue }) => (
      <span className={numericClass}>
        {(() => {
          const v = getValue<number | null>();
          return v == null ? "—" : `${formatInteger(v)}%`;
        })()}
      </span>
    ),
    meta: { numeric: true },
  },
  {
    accessorKey: "avg_adjusted_margin_pct",
    header: "Avg Adj Margin %",
    cell: ({ getValue }) => (
      <span className={numericClass}>
        {(() => {
          const v = getValue<number | null>();
          return v == null ? "—" : `${formatDecimal(v, 2)}%`;
        })()}
      </span>
    ),
    meta: { numeric: true },
  },
];

export function GmroiByBuyLineTable({ rows }: { rows: GmroiRow[] }) {
  const data = useMemo(() => aggregateGmroiByBuyLine(rows), [rows]);

  const [sorting, setSorting] = useState<SortingState>([
    { id: "avg_gmroi", desc: true },
  ]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <Card className="bg-white shadow-sm rounded-lg">
      <CardHeader>
        <CardTitle>GMROI by Buy Line</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-500">No data.</div>
        ) : (
          <div className="max-h-[560px] overflow-y-auto">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((hg) => (
                  <TableRow key={hg.id}>
                    {hg.headers.map((h) => {
                      const isNumeric = (h.column.columnDef.meta as { numeric?: boolean } | undefined)?.numeric;
                      const dir = h.column.getIsSorted();
                      return (
                        <TableHead
                          key={h.id}
                          onClick={h.column.getToggleSortingHandler()}
                          className={`cursor-pointer select-none ${isNumeric ? "text-right" : ""}`}
                        >
                          {flexRender(h.column.columnDef.header, h.getContext())}
                          {dir === "asc" ? " ↑" : dir === "desc" ? " ↓" : ""}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
