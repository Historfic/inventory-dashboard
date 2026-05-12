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
import type { InventoryRow } from "@/lib/types";

export type GranularRow = Pick<
  InventoryRow,
  "ecl_id" | "desc_1" | "desc_2" | "rank4" | "period" | "days_out" | "stockout_pct"
>;

const numericCellClass = "text-right tabular-nums";

const columns: ColumnDef<GranularRow>[] = [
  {
    accessorKey: "ecl_id",
    header: "ECL ID",
  },
  {
    accessorKey: "desc_1",
    header: "Description",
  },
  {
    accessorKey: "desc_2",
    header: "Description 2",
  },
  {
    accessorKey: "rank4",
    header: "Rank",
  },
  {
    accessorKey: "period",
    header: "Period",
    cell: ({ getValue }) => {
      const v = getValue<number | null>();
      return <span className={numericCellClass}>{v == null ? "" : Math.round(v)}</span>;
    },
    meta: { numeric: true },
  },
  {
    accessorKey: "days_out",
    header: "Days Out",
    cell: ({ getValue }) => {
      const v = getValue<number | null>();
      return <span className={numericCellClass}>{v == null ? "" : Math.round(v)}</span>;
    },
    meta: { numeric: true },
  },
  {
    accessorKey: "stockout_pct",
    header: "Stockout %",
    cell: ({ getValue }) => {
      const v = getValue<number | null>();
      return (
        <span className={numericCellClass}>
          {v == null ? "" : `${Math.round(v * 100)}%`}
        </span>
      );
    },
    meta: { numeric: true },
  },
];

export function GranularItemsTable({ data }: { data: GranularRow[] }) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "stockout_pct", desc: true },
  ]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (data.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-gray-500">
        No data matches the current filters.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((hg) => (
          <TableRow key={hg.id}>
            {hg.headers.map((h) => {
              const isNumeric = (h.column.columnDef.meta as { numeric?: boolean } | undefined)?.numeric;
              const sortDir = h.column.getIsSorted();
              return (
                <TableHead
                  key={h.id}
                  onClick={h.column.getToggleSortingHandler()}
                  className={`cursor-pointer select-none ${isNumeric ? "text-right" : ""}`}
                >
                  {flexRender(h.column.columnDef.header, h.getContext())}
                  {sortDir === "asc" ? " ↑" : sortDir === "desc" ? " ↓" : ""}
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
  );
}
