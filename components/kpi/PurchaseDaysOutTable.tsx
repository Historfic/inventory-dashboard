"use client";

import { useState } from "react";
import {
  ColumnDef,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { DashboardCard } from "@/components/layout/DashboardCard";
import { EmptyState } from "@/components/layout/EmptyState";
import { DataTable } from "@/components/table/DataTable";
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
    <DashboardCard title="Purchase Days Out">
      {rows.length === 0 ? (
        <EmptyState message="No data matches the current filters." />
      ) : (
        <DataTable table={table} maxHeightClass="max-h-[640px]" />
      )}
    </DashboardCard>
  );
}
