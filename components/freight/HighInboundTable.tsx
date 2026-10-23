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
import { formatDollars } from "@/lib/format";
import { useFreightFilterState } from "@/hooks/useFreightFilterState";
import type { InboundFreightRow } from "@/lib/inbound-freight-types";

const numericClass = "text-right tabular-nums";
const THRESHOLD = 20;

const columns: ColumnDef<InboundFreightRow>[] = [
  { accessorKey: "writer", header: "Writer" },
  { accessorKey: "order_number", header: "Order #" },
  { accessorKey: "vendor_name", header: "Vendor" },
  {
    accessorKey: "gen_total_dollars",
    header: "Order $",
    cell: ({ getValue }) => <span className={numericClass}>{formatDollars(getValue<number | null>())}</span>,
    meta: { numeric: true },
  },
  {
    accessorKey: "freight_dollars",
    header: "Freight $",
    cell: ({ getValue }) => <span className={numericClass}>{formatDollars(getValue<number | null>())}</span>,
    meta: { numeric: true },
  },
  {
    accessorKey: "inbound_pct",
    header: "Inbound %",
    cell: ({ getValue }) => {
      const v = getValue<number | null>();
      return <span className={numericClass}>{v == null ? "—" : `${Math.round(v)}%`}</span>;
    },
    meta: { numeric: true },
  },
];

export function HighInboundTable({ rows }: { rows: InboundFreightRow[] }) {
  const { filters } = useFreightFilterState();
  const vendorFocused = filters.vendorSelection !== null;

  const data = useMemo(() => {
    if (vendorFocused) {
      return rows.filter((r) => (r.freight_dollars ?? 0) > 0);
    }
    return rows.filter((r) => (r.inbound_pct ?? 0) >= THRESHOLD);
  }, [rows, vendorFocused]);

  const [sorting, setSorting] = useState<SortingState>([
    { id: "inbound_pct", desc: true },
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
        vendorFocused
          ? `POs with freight — ${filters.vendorSelection}`
          : `High Inbound % Orders (≥ ${THRESHOLD}%)`
      }
      description={
        vendorFocused
          ? "All line items from the selected vendor that incurred freight cost."
          : `Line items where freight is at least ${THRESHOLD}% of the order — worth reviewing for cost.`
      }
    >
      {data.length === 0 ? (
        <EmptyState
          message={
            vendorFocused
              ? "No freight-bearing POs for this vendor in the current view."
              : `No orders cross the ${THRESHOLD}% threshold.`
          }
        />
      ) : (
        <DataTable table={table} maxHeightClass="max-h-[480px]" />
      )}
    </DashboardCard>
  );
}
