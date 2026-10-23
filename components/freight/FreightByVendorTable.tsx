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
  aggregateFreightByVendor,
  type FreightByVendor,
} from "@/lib/inbound-freight-aggregations";
import { formatDollars, formatInteger } from "@/lib/format";
import { useFreightFilterState } from "@/hooks/useFreightFilterState";
import type { InboundFreightRow } from "@/lib/inbound-freight-types";

const numericClass = "text-right tabular-nums";

const columns: ColumnDef<FreightByVendor>[] = [
  { accessorKey: "vendor_name", header: "Vendor" },
  {
    accessorKey: "line_count",
    header: "Line Items",
    cell: ({ getValue }) => <span className={numericClass}>{formatInteger(getValue<number>())}</span>,
    meta: { numeric: true },
  },
  {
    accessorKey: "total_gen_total",
    header: "Order $",
    cell: ({ getValue }) => <span className={numericClass}>{formatDollars(getValue<number>())}</span>,
    meta: { numeric: true },
  },
  {
    accessorKey: "total_freight",
    header: "Freight $",
    cell: ({ getValue }) => <span className={numericClass}>{formatDollars(getValue<number>())}</span>,
    meta: { numeric: true },
  },
  {
    accessorKey: "avg_inbound_pct",
    header: "Avg Inbound %",
    cell: ({ getValue }) => {
      const v = getValue<number | null>();
      return <span className={numericClass}>{v == null ? "—" : `${Math.round(v)}%`}</span>;
    },
    meta: { numeric: true },
  },
];

export function FreightByVendorTable({ rows }: { rows: InboundFreightRow[] }) {
  const { filters, toggleVendor } = useFreightFilterState();
  const data = useMemo(() => aggregateFreightByVendor(rows), [rows]);

  const [sorting, setSorting] = useState<SortingState>([
    { id: "total_freight", desc: true },
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
      title="By Vendor"
      description="Sort by any column. Default: highest freight $ first."
    >
      {data.length === 0 ? (
        <EmptyState message="No data." />
      ) : (
        <DataTable
          table={table}
          maxHeightClass="max-h-[560px]"
          onRowClick={(r) => toggleVendor(r.vendor_name)}
          isRowSelected={(r) => filters.vendorSelection === r.vendor_name}
        />
      )}
    </DashboardCard>
  );
}
