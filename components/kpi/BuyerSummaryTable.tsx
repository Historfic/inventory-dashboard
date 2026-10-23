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
    <DashboardCard title="Buyer Summary">
      {data.length === 0 ? (
        <EmptyState message="No data matches the current filters." />
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
