"use client";

import { useMemo, useState } from "react";
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
import { aggregateGmroiByBranch, type GmroiByBranch } from "@/lib/gmroi-aggregations";
import { formatDecimal, formatDollars } from "@/lib/format";
import type { GmroiRow } from "@/lib/gmroi-types";

const numericClass = "text-right tabular-nums";

const columns: ColumnDef<GmroiByBranch>[] = [
  {
    accessorKey: "branch_id",
    header: "Branch",
    sortingFn: (a, b) => {
      const av = Number(a.getValue("branch_id"));
      const bv = Number(b.getValue("branch_id"));
      if (Number.isNaN(av) && Number.isNaN(bv)) return 0;
      if (Number.isNaN(av)) return 1;
      if (Number.isNaN(bv)) return -1;
      return av - bv;
    },
  },
  {
    accessorKey: "total_annual_cogs_dollars",
    header: "Annual COGS$",
    cell: ({ getValue }) => <span className={numericClass}>{formatDollars(getValue<number>())}</span>,
    meta: { numeric: true },
  },
  {
    accessorKey: "total_on_hand_dollars",
    header: "Avg $OnHand",
    cell: ({ getValue }) => <span className={numericClass}>{formatDollars(getValue<number>())}</span>,
    meta: { numeric: true },
  },
  {
    accessorKey: "weighted_turns",
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
    accessorKey: "avg_adjusted_margin_pct",
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

export function GmroiByBranchTable({ rows }: { rows: GmroiRow[] }) {
  const data = useMemo(() => aggregateGmroiByBranch(rows), [rows]);

  const [sorting, setSorting] = useState<SortingState>([
    { id: "branch_id", desc: false },
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
    <DashboardCard
      title="GMROI by Branch"
      description={'Excludes the "All Branches" rollup row.'}
    >
      {data.length === 0 ? (
        <EmptyState message="No data." />
      ) : (
        <DataTable table={table} maxHeightClass="max-h-[480px]" />
      )}
    </DashboardCard>
  );
}
