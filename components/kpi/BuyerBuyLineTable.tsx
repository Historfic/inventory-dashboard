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
    <DashboardCard title="Buyer × Buy Line">
      {data.length === 0 ? (
        <EmptyState message="No data matches the current filters." />
      ) : (
        <DataTable
          table={table}
          maxHeightClass="max-h-[480px]"
          onRowClick={handleRowClick}
          isRowSelected={(r) =>
            filters.buyerSelection === r.buyer && filters.buyLineSelection === r.buy_line
          }
        />
      )}
    </DashboardCard>
  );
}
