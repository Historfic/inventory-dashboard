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
import { formatDecimal, formatDollars } from "@/lib/format";
import type { GmroiRow } from "@/lib/gmroi-types";

const numericClass = "text-right tabular-nums";

const columns: ColumnDef<GmroiByBuyLine>[] = [
  { accessorKey: "buy_line", header: "Buy Line" },
  { accessorKey: "buyer", header: "Buyer" },
  {
    accessorKey: "annual_cogs_dollars",
    header: "Annual COGS$",
    cell: ({ getValue }) => (
      <span className={numericClass}>
        {(() => {
          const v = getValue<number | null>();
          return v == null ? "—" : formatDollars(v);
        })()}
      </span>
    ),
    meta: { numeric: true },
  },
  {
    accessorKey: "avg_on_hand_dollars",
    header: "Avg $OnHand",
    cell: ({ getValue }) => (
      <span className={numericClass}>
        {(() => {
          const v = getValue<number | null>();
          return v == null ? "—" : formatDollars(v);
        })()}
      </span>
    ),
    meta: { numeric: true },
  },
  {
    accessorKey: "turns",
    header: "Turns",
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
    accessorKey: "adjusted_margin_pct",
    header: "Adjusted Margin%",
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

type Props = {
  rows: GmroiRow[];
  buyerByBuyLine: Map<string, string> | null;
};

export function GmroiByBuyLineTable({ rows, buyerByBuyLine }: Props) {
  const data = useMemo(
    () => (buyerByBuyLine ? aggregateGmroiByBuyLine(rows, buyerByBuyLine) : []),
    [rows, buyerByBuyLine]
  );

  const [sorting, setSorting] = useState<SortingState>([
    { id: "annual_cogs_dollars", desc: true },
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
        <CardTitle>GMROI by Buy Line</CardTitle>
      </CardHeader>
      <CardContent>
        {!buyerByBuyLine ? (
          <div className="py-8 text-center text-sm text-gray-500">Loading buyer mapping…</div>
        ) : data.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-500">No data.</div>
        ) : (
          <Table containerClassName="max-h-[560px]">
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
