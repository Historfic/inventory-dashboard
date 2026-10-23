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
import { Skeleton } from "@/components/layout/Skeleton";
import { DataTable } from "@/components/table/DataTable";
import { aggregateGmroiByBuyer, type GmroiByBuyer } from "@/lib/gmroi-aggregations";
import { formatDecimal, formatDollars, formatInteger } from "@/lib/format";
import { useGmroiFilterState } from "@/hooks/useGmroiFilterState";
import type { GmroiRow } from "@/lib/gmroi-types";

const numericClass = "text-right tabular-nums";

const columns: ColumnDef<GmroiByBuyer>[] = [
  { accessorKey: "buyer", header: "Buyer" },
  {
    accessorKey: "buy_line_count",
    header: "Buy Lines",
    cell: ({ getValue }) => <span className={numericClass}>{formatInteger(getValue<number>())}</span>,
    meta: { numeric: true },
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

type Props = {
  rows: GmroiRow[];
  buyerByBuyLine: Map<string, string> | null;
};

export function GmroiByBuyerTable({ rows, buyerByBuyLine }: Props) {
  const { filters, toggleBuyer } = useGmroiFilterState();
  const data = useMemo(
    () => (buyerByBuyLine ? aggregateGmroiByBuyer(rows, buyerByBuyLine) : []),
    [rows, buyerByBuyLine]
  );

  const [sorting, setSorting] = useState<SortingState>([
    { id: "total_annual_cogs_dollars", desc: true },
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
      title="GMROI by Buyer"
      description="Buyer from the monthly buyer-assignment report (most-common buyer per buy_line)."
    >
      {!buyerByBuyLine ? (
        <Skeleton className="h-[240px]" label="Loading buyer mapping…" />
      ) : data.length === 0 ? (
        <EmptyState message="No data." />
      ) : (
        <DataTable
          table={table}
          maxHeightClass="max-h-[480px]"
          onRowClick={(r) => toggleBuyer(r.buyer)}
          isRowSelected={(r) => filters.buyerSelection === r.buyer}
        />
      )}
    </DashboardCard>
  );
}
