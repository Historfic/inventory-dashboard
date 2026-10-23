"use client";

import { flexRender, type Table as TanstackTable } from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SortIcon } from "@/components/table/SortIcon";
import { cn } from "@/lib/utils";

type Props<T> = {
  table: TanstackTable<T>;
  /** Literal Tailwind class for the scroll area, e.g. "max-h-[480px]" (literal so Tailwind sees it). */
  maxHeightClass: string;
  /** Cross-filter click. Omit for read-only tables. */
  onRowClick?: (row: T) => void;
  /** Highlights the row(s) matching the current cross-filter. */
  isRowSelected?: (row: T) => boolean;
};

const ARIA_SORT = { asc: "ascending", desc: "descending" } as const;

function isNumeric(meta: unknown): boolean {
  return (meta as { numeric?: boolean } | undefined)?.numeric === true;
}

/** Sticky-header, sortable body shared by every dashboard table. Columns and sorting stay with the caller. */
export function DataTable<T>({ table, maxHeightClass, onRowClick, isRowSelected }: Props<T>) {
  return (
    <Table containerClassName={maxHeightClass}>
      <TableHeader>
        {table.getHeaderGroups().map((hg) => (
          <TableRow key={hg.id}>
            {hg.headers.map((h) => {
              const numeric = isNumeric(h.column.columnDef.meta);
              const dir = h.column.getIsSorted();
              return (
                <TableHead
                  key={h.id}
                  aria-sort={dir ? ARIA_SORT[dir] : "none"}
                  className={cn(numeric && "text-right")}
                >
                  <button
                    type="button"
                    onClick={h.column.getToggleSortingHandler()}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-sm uppercase tracking-wide transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      numeric && "flex-row-reverse",
                      dir && "text-foreground"
                    )}
                  >
                    {flexRender(h.column.columnDef.header, h.getContext())}
                    <SortIcon direction={dir} />
                  </button>
                </TableHead>
              );
            })}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.map((row) => (
          <TableRow
            key={row.id}
            data-state={isRowSelected?.(row.original) ? "selected" : undefined}
            onClick={onRowClick ? () => onRowClick(row.original) : undefined}
            className={cn(onRowClick && "cursor-pointer")}
          >
            {row.getVisibleCells().map((cell) => (
              <TableCell
                key={cell.id}
                className={cn(isNumeric(cell.column.columnDef.meta) && "text-right tabular-nums")}
              >
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
