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
import { ANOMALY_THRESHOLD, type LineCountRow } from "@/lib/line-counts-types";

const numericClass = "text-right tabular-nums";

const intCell = (value: unknown) => (
  <span className={numericClass}>{formatInteger(value as number)}</span>
);

// Flags any single value above ANOMALY_THRESHOLD with a warning marker + tooltip,
// so an unverified outlier (e.g. JEFFC May TR = 538,537) never ships silently.
const flagCell = (value: unknown) => {
  const n = value as number;
  const flagged = typeof n === "number" && n > ANOMALY_THRESHOLD;
  return (
    <span
      className={`${numericClass} ${flagged ? "font-semibold text-amber-700" : ""}`}
      title={flagged ? "Unusually high value — please verify with Todd before reporting" : undefined}
    >
      {flagged ? "⚠ " : ""}
      {formatInteger(n)}
    </span>
  );
};

const columns: ColumnDef<LineCountByWriter>[] = [
  { accessorKey: "writer", header: "Writer" },
  { accessorKey: "PO", header: "PO", cell: ({ getValue }) => flagCell(getValue()), meta: { numeric: true } },
  { accessorKey: "SO", header: "SO", cell: ({ getValue }) => flagCell(getValue()), meta: { numeric: true } },
  { accessorKey: "DIR", header: "DIR", cell: ({ getValue }) => flagCell(getValue()), meta: { numeric: true } },
  { accessorKey: "TR", header: "TR", cell: ({ getValue }) => flagCell(getValue()), meta: { numeric: true } },
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
        <CardTitle>Lines by Writer</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-500">No data.</div>
        ) : (
          <Table containerClassName="max-h-[480px]">
            <TableHeader className="sticky top-0 z-10 bg-white shadow-[0_1px_0_0_rgb(229_231_235)]">
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
                    <TableCell key={cell.id} className={(cell.column.columnDef.meta as { numeric?: boolean } | undefined)?.numeric ? "text-right" : ""}>
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
