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
import { aggregateGmroiByBuyLine, type GmroiByBuyLine } from "@/lib/gmroi-aggregations";
import { formatDecimal, formatDollars } from "@/lib/format";
import { useGmroiFilterState } from "@/hooks/useGmroiFilterState";
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
  const { filters } = useGmroiFilterState();
  const data = useMemo(() => {
    if (!buyerByBuyLine) return [];
    const all = aggregateGmroiByBuyLine(rows, buyerByBuyLine);
    return filters.buyerSelection
      ? all.filter((r) => r.buyer === filters.buyerSelection)
      : all;
  }, [rows, buyerByBuyLine, filters.buyerSelection]);

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
    <DashboardCard
      title={
        <>
          GMROI by Buy Line
          {filters.buyerSelection && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              — filtered to {filters.buyerSelection}
            </span>
          )}
        </>
      }
    >
      {!buyerByBuyLine ? (
        <Skeleton className="h-[240px]" label="Loading buyer mapping…" />
      ) : data.length === 0 ? (
        <EmptyState message="No data." />
      ) : (
        <DataTable table={table} maxHeightClass="max-h-[560px]" />
      )}
    </DashboardCard>
  );
}
