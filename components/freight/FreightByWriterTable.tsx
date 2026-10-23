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
  aggregateFreightByWriter,
  type FreightByWriter,
} from "@/lib/inbound-freight-aggregations";
import { formatDollars, formatInteger } from "@/lib/format";
import { useFreightFilterState } from "@/hooks/useFreightFilterState";
import type { InboundFreightRow } from "@/lib/inbound-freight-types";

const numericClass = "text-right tabular-nums";

const columns: ColumnDef<FreightByWriter>[] = [
  { accessorKey: "writer", header: "Writer" },
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
    header: "Avg Inbound % (per row)",
    cell: ({ getValue }) => {
      const v = getValue<number | null>();
      return <span className={numericClass}>{v == null ? "—" : `${Math.round(v)}%`}</span>;
    },
    meta: { numeric: true },
  },
  {
    accessorKey: "freight_pct_of_order",
    header: "Freight % of Order",
    cell: ({ getValue }) => {
      const v = getValue<number | null>();
      return (
        <span className={numericClass}>
          {v == null ? "—" : `${v.toFixed(2)}%`}
        </span>
      );
    },
    meta: { numeric: true },
  },
];

export function FreightByWriterTable({ rows }: { rows: InboundFreightRow[] }) {
  const { filters, toggleWriter } = useFreightFilterState();
  const data = useMemo(() => aggregateFreightByWriter(rows), [rows]);

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
    <DashboardCard title="By Writer">
      {data.length === 0 ? (
        <EmptyState message="No data." />
      ) : (
        <DataTable
          table={table}
          maxHeightClass="max-h-[480px]"
          onRowClick={(r) => toggleWriter(r.writer)}
          isRowSelected={(r) => filters.writerSelection === r.writer}
        />
      )}
    </DashboardCard>
  );
}
