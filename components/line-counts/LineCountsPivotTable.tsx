"use client";

import { useMemo, useState } from "react";
import {
  ColumnDef,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { TriangleAlert } from "lucide-react";
import { DashboardCard } from "@/components/layout/DashboardCard";
import { EmptyState } from "@/components/layout/EmptyState";
import { DataTable } from "@/components/table/DataTable";
import {
  aggregateLineCountsByWriter,
  type LineCountByWriter,
} from "@/lib/line-counts-aggregations";
import { formatInteger } from "@/lib/format";
import { ANOMALY_THRESHOLD, type LineCountRow } from "@/lib/line-counts-types";

const numericClass = "text-right tabular-nums";

const intCell = (value: unknown) => (
  <span className={numericClass}>{formatInteger(value as number)}</span>
);

// Flags any single value above ANOMALY_THRESHOLD with a warning marker + tooltip,
// so an unverified outlier (e.g. JEFFC May TR = 538,537) never ships silently.
const flagCell = (value: unknown) => {
  const n = value as number;
  const flagged = typeof n === "number" && n > ANOMALY_THRESHOLD;
  return (
    <span
      className={`${numericClass} inline-flex items-center justify-end gap-1 ${flagged ? "font-semibold text-foreground" : ""}`}
      title={flagged ? "Unusually high value — please verify with Todd before reporting" : undefined}
    >
      {flagged && (
        <TriangleAlert className="size-3.5 fill-status-warning text-foreground" role="img" aria-label="Needs verification" />
      )}
      {formatInteger(n)}
    </span>
  );
};

const columns: ColumnDef<LineCountByWriter>[] = [
  { accessorKey: "writer", header: "Writer" },
  { accessorKey: "PO", header: "PO", cell: ({ getValue }) => flagCell(getValue()), meta: { numeric: true } },
  { accessorKey: "SO", header: "SO", cell: ({ getValue }) => flagCell(getValue()), meta: { numeric: true } },
  { accessorKey: "DIR", header: "DIR", cell: ({ getValue }) => flagCell(getValue()), meta: { numeric: true } },
  { accessorKey: "TR", header: "TR", cell: ({ getValue }) => flagCell(getValue()), meta: { numeric: true } },
  { accessorKey: "total", header: "Total", cell: ({ getValue }) => intCell(getValue()), meta: { numeric: true } },
];

export function LineCountsPivotTable({ rows }: { rows: LineCountRow[] }) {
  const data = useMemo(() => aggregateLineCountsByWriter(rows), [rows]);

  const [sorting, setSorting] = useState<SortingState>([
    { id: "total", desc: true },
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
    <DashboardCard title="Lines by Writer">
      {data.length === 0 ? (
        <EmptyState message="No data." />
      ) : (
        <DataTable table={table} maxHeightClass="max-h-[480px]" />
      )}
    </DashboardCard>
  );
}
