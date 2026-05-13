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
import { aggregateByBuyer, type BuyerAggregate } from "@/lib/aggregations";
import { useFilterState } from "@/hooks/useFilterState";
import { formatStockoutPct } from "@/lib/format";
import type { InventoryRow } from "@/lib/types";

const columns: ColumnDef<BuyerAggregate>[] = [
  { accessorKey: "buyer", header: "Buyer" },
  {
    accessorKey: "avg_stockout_pct",
    header: "Avg Stockout %",
    cell: ({ getValue }) => (
      <span className="text-right tabular-nums">
        {formatStockoutPct(getValue<number>())}
      </span>
    ),
    meta: { numeric: true },
  },
];

export function BuyerSummaryTable({ rows }: { rows: InventoryRow[] }) {
  const { filters, toggleBuyer } = useFilterState();
  const data = useMemo(() => aggregateByBuyer(rows), [rows]);

  const [sorting, setSorting] = useState<SortingState>([
    { id: "avg_stockout_pct", desc: true },
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
        <CardTitle>Buyer Summary</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-500">
            No data matches the current filters.
          </div>
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
              {table.getRowModel().rows.map((row) => {
                const selected = filters.buyerSelection === row.original.buyer;
                return (
                  <TableRow
                    key={row.id}
                    onClick={() => toggleBuyer(row.original.buyer)}
                    className={`cursor-pointer ${selected ? "bg-muted" : ""}`}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className={(cell.column.columnDef.meta as { numeric?: boolean } | undefined)?.numeric ? "text-right" : ""}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
