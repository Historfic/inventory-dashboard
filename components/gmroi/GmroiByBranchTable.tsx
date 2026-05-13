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
import { aggregateGmroiByBranch, type GmroiByBranch } from "@/lib/gmroi-aggregations";
import { formatDollars, formatInteger } from "@/lib/format";
import type { GmroiRow } from "@/lib/gmroi-types";

const numericClass = "text-right tabular-nums";

const columns: ColumnDef<GmroiByBranch>[] = [
  { accessorKey: "branch_id", header: "Branch" },
  {
    accessorKey: "total_gp_dollars",
    header: "GP $",
    cell: ({ getValue }) => <span className={numericClass}>{formatDollars(getValue<number>())}</span>,
    meta: { numeric: true },
  },
  {
    accessorKey: "total_cogs_dollars",
    header: "COGS $",
    cell: ({ getValue }) => <span className={numericClass}>{formatDollars(getValue<number>())}</span>,
    meta: { numeric: true },
  },
  {
    accessorKey: "total_on_hand_dollars",
    header: "$ On Hand",
    cell: ({ getValue }) => <span className={numericClass}>{formatDollars(getValue<number>())}</span>,
    meta: { numeric: true },
  },
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
    accessorKey: "item_count",
    header: "Buy Lines",
    cell: ({ getValue }) => <span className={numericClass}>{formatInteger(getValue<number>())}</span>,
    meta: { numeric: true },
  },
];

export function GmroiByBranchTable({ rows }: { rows: GmroiRow[] }) {
  const data = useMemo(() => aggregateGmroiByBranch(rows), [rows]);

  const [sorting, setSorting] = useState<SortingState>([
    { id: "total_gp_dollars", desc: true },
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
        <CardTitle>GMROI by Branch</CardTitle>
        <p className="text-xs text-muted-foreground">
          Excludes the &quot;All Branches&quot; rollup row.
        </p>
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
