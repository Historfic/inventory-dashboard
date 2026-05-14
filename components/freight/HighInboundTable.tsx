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
import { formatDollars } from "@/lib/format";
import type { InboundFreightRow } from "@/lib/inbound-freight-types";

const numericClass = "text-right tabular-nums";
const THRESHOLD = 20;

const columns: ColumnDef<InboundFreightRow>[] = [
  { accessorKey: "writer", header: "Writer" },
  { accessorKey: "order_number", header: "Order #" },
  { accessorKey: "vendor_name", header: "Vendor" },
  {
    accessorKey: "gen_total_dollars",
    header: "Order $",
    cell: ({ getValue }) => <span className={numericClass}>{formatDollars(getValue<number | null>())}</span>,
    meta: { numeric: true },
  },
  {
    accessorKey: "freight_dollars",
    header: "Freight $",
    cell: ({ getValue }) => <span className={numericClass}>{formatDollars(getValue<number | null>())}</span>,
    meta: { numeric: true },
  },
  {
    accessorKey: "inbound_pct",
    header: "Inbound %",
    cell: ({ getValue }) => {
      const v = getValue<number | null>();
      return <span className={numericClass}>{v == null ? "—" : `${Math.round(v)}%`}</span>;
    },
    meta: { numeric: true },
  },
];

export function HighInboundTable({ rows }: { rows: InboundFreightRow[] }) {
  const data = useMemo(
    () => rows.filter((r) => (r.inbound_pct ?? 0) >= THRESHOLD),
    [rows]
  );

  const [sorting, setSorting] = useState<SortingState>([
    { id: "inbound_pct", desc: true },
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
        <CardTitle>High Inbound % Orders (≥ {THRESHOLD}%)</CardTitle>
        <p className="text-xs text-muted-foreground">
          Line items where freight is at least {THRESHOLD}% of the order — worth reviewing for cost.
        </p>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-500">
            No orders cross the {THRESHOLD}% threshold.
          </div>
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
