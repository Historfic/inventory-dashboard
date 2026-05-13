"use client";

import { useState } from "react";
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
import { formatDaysOut, formatInteger } from "@/lib/format";
import type { InventoryRow } from "@/lib/types";

type Row = Pick<
  InventoryRow,
  "buyer" | "buy_line" | "ecl_id" | "desc_1" | "desc_2" | "rank4" | "period" | "op" | "hits" | "days_out"
>;

const numericClass = "text-right tabular-nums";

const columns: ColumnDef<Row>[] = [
  { accessorKey: "buyer", header: "Buyer" },
  { accessorKey: "buy_line", header: "Buy Line" },
  { accessorKey: "ecl_id", header: "ECL ID" },
  { accessorKey: "desc_1", header: "Description" },
  { accessorKey: "desc_2", header: "Description 2" },
  { accessorKey: "rank4", header: "Rank" },
  {
    accessorKey: "period",
    header: "Period",
    cell: ({ getValue }) => (
      <span className={numericClass}>{formatInteger(getValue<number | null>())}</span>
    ),
    meta: { numeric: true },
  },
  {
    accessorKey: "op",
    header: "Op",
    cell: ({ getValue }) => (
      <span className={numericClass}>{formatInteger(getValue<number | null>())}</span>
    ),
    meta: { numeric: true },
  },
  {
    accessorKey: "hits",
    header: "Hits",
    cell: ({ getValue }) => (
      <span className={numericClass}>{formatInteger(getValue<number | null>())}</span>
    ),
    meta: { numeric: true },
  },
  {
    accessorKey: "days_out",
    header: "Days Out",
    cell: ({ getValue }) => (
      <span className={numericClass}>{formatDaysOut(getValue<number | null>())}</span>
    ),
    meta: { numeric: true },
  },
];

export function PurchaseDaysOutTable({ rows }: { rows: InventoryRow[] }) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "days_out", desc: true },
  ]);

  const table = useReactTable({
    data: rows as Row[],
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <Card className="bg-white rounded-lg border border-sky-200 shadow-md">
      <CardHeader>
        <CardTitle>Purchase Days Out</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-500">
            No data matches the current filters.
          </div>
        ) : (
          <div className="max-h-[640px] overflow-y-auto">
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
                      <TableCell key={cell.id} className={(cell.column.columnDef.meta as { numeric?: boolean } | undefined)?.numeric ? "text-right" : ""}>
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
