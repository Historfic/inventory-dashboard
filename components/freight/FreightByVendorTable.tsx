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
  aggregateFreightByVendor,
  type FreightByVendor,
} from "@/lib/inbound-freight-aggregations";
import { formatDollars, formatInteger } from "@/lib/format";
import type { InboundFreightRow } from "@/lib/inbound-freight-types";

const numericClass = "text-right tabular-nums";

const columns: ColumnDef<FreightByVendor>[] = [
  { accessorKey: "vendor_name", header: "Vendor" },
  {
    accessorKey: "line_count",
    header: "Lines",
    cell: ({ getValue }) => <span className={numericClass}>{formatInteger(getValue<number>())}</span>,
    meta: { numeric: true },
  },
  {
    accessorKey: "total_gen_total",
    header: "Order $",
    cell: ({ getValue }) => <span className={numericClass}>{formatDollars(getValue<number>())}</span>,
    meta: { numeric: true },
  },
  {
    accessorKey: "total_freight",
    header: "Freight $",
    cell: ({ getValue }) => <span className={numericClass}>{formatDollars(getValue<number>())}</span>,
    meta: { numeric: true },
  },
  {
    accessorKey: "avg_inbound_pct",
    header: "Avg Inbound %",
    cell: ({ getValue }) => {
      const v = getValue<number | null>();
      return <span className={numericClass}>{v == null ? "—" : `${Math.round(v)}%`}</span>;
    },
    meta: { numeric: true },
  },
];

export function FreightByVendorTable({ rows }: { rows: InboundFreightRow[] }) {
  const data = useMemo(() => aggregateFreightByVendor(rows), [rows]);

  const [sorting, setSorting] = useState<SortingState>([
    { id: "total_freight", desc: true },
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
        <CardTitle>By Vendor</CardTitle>
        <p className="text-xs text-muted-foreground">
          Sort by any column. Default: highest freight $ first.
        </p>
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
