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
import {
  aggregateLineCountsByWriter,
  type LineCountByWriter,
} from "@/lib/line-counts-aggregations";
import { formatInteger } from "@/lib/format";
import type { LineCountRow } from "@/lib/line-counts-types";

const numericClass = "text-right tabular-nums";

const intCell = (value: unknown) => (
  <span className={numericClass}>{formatInteger(value as number)}</span>
);

const columns: ColumnDef<LineCountByWriter>[] = [
  { accessorKey: "writer", header: "Writer" },
  { accessorKey: "PO", header: "PO", cell: ({ getValue }) => intCell(getValue()), meta: { numeric: true } },
  { accessorKey: "SO", header: "SO", cell: ({ getValue }) => intCell(getValue()), meta: { numeric: true } },
  { accessorKey: "DIR", header: "DIR", cell: ({ getValue }) => intCell(getValue()), meta: { numeric: true } },
  { accessorKey: "TR", header: "TR", cell: ({ getValue }) => intCell(getValue()), meta: { numeric: true } },
  { accessorKey: "total", header: "Total", cell: ({ getValue }) => intCell(getValue()), meta: { numeric: true } },
];

export function LineCountsPivotTable({ rows }: { rows: LineCountRow[] }) {
  const data = useMemo(() => aggregateLineCountsByWriter(rows), [rows]);

  const [sorting, setSorting] = useState<SortingState>([
    { id: "total", desc: true },
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
    <Card className="bg-white rounded-lg border border-sky-200 shadow-md">
      <CardHeader>
        <CardTitle>Lines by Writer (pivot)</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-500">No data.</div>
        ) : (
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
        )}
      </CardContent>
    </Card>
  );
}
