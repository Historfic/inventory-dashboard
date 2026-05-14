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
  aggregateByBuyerBuyLine,
  type BuyerBuyLineAggregate,
} from "@/lib/aggregations";
import { useFilterState } from "@/hooks/useFilterState";
import { formatDaysOut, formatStockoutPct } from "@/lib/format";
import type { InventoryRow } from "@/lib/types";

const columns: ColumnDef<BuyerBuyLineAggregate>[] = [
  { accessorKey: "buyer", header: "Buyer" },
  { accessorKey: "buy_line", header: "Buy Line" },
  {
    accessorKey: "avg_days_out",
    header: "Avg Days Out",
    cell: ({ getValue }) => (
      <span className="text-right tabular-nums">
        {formatDaysOut(getValue<number>())}
      </span>
    ),
    meta: { numeric: true },
  },
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

export function BuyerBuyLineTable({ rows }: { rows: InventoryRow[] }) {
  const { filters, toggleBuyer, toggleBuyLine } = useFilterState();
  const data = useMemo(() => aggregateByBuyerBuyLine(rows), [rows]);

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

  function handleRowClick(row: BuyerBuyLineAggregate) {
    if (filters.buyerSelection !== row.buyer) {
      toggleBuyer(row.buyer);
      toggleBuyLine(row.buy_line);
    } else if (filters.buyLineSelection !== row.buy_line) {
      toggleBuyLine(row.buy_line);
    } else {
      toggleBuyLine(row.buy_line);
    }
  }

  return (
    <Card className="bg-white rounded-lg border border-sky-200 shadow-md">
      <CardHeader>
        <CardTitle>Buyer × Buy Line</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-500">
            No data matches the current filters.
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
                {table.getRowModel().rows.map((row) => {
                  const sameBuyer = filters.buyerSelection === row.original.buyer;
                  const sameBuyLine = filters.buyLineSelection === row.original.buy_line;
                  const selected = sameBuyer && sameBuyLine;
                  return (
                    <TableRow
                      key={row.id}
                      onClick={() => handleRowClick(row.original)}
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
