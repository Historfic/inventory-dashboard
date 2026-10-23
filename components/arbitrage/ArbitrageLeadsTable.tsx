"use client";

import { useMemo, useState } from "react";
import {
  ColumnDef,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { AlertTriangle, CheckCircle2, MinusCircle, XCircle } from "lucide-react";
import { DashboardCard } from "@/components/layout/DashboardCard";
import { EmptyState } from "@/components/layout/EmptyState";
import { DataTable } from "@/components/table/DataTable";
import {
  formatCompact,
  formatCount,
  formatMoney,
  formatPct1,
  formatTimeAgo,
} from "@/lib/arbitrage-format";
import type { ArbitrageLead } from "@/lib/arbitrage-types";

type ColumnMeta = { numeric?: boolean; wrap?: boolean };

const PRICE_SOURCE: Record<string, string> = { buy_box: "Buy Box", new: "Lowest new", amazon: "Amazon" };

// Sort order for the Status column: winners first, unusable data last.
function statusRank(lead: ArbitrageLead): number {
  if (lead.is_stale) return 3;
  if (lead.buy_box_price == null) return 2;
  return lead.is_profitable ? 0 : 1;
}

function StatusBadge({ lead }: { lead: ArbitrageLead }) {
  const base = "inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-foreground";
  if (lead.is_stale) {
    return (
      <span
        className={base}
        title="Keepa couldn't refresh this listing recently; the Amazon price may be out of date."
      >
        <AlertTriangle className="size-3.5 text-status-warning" aria-hidden /> Stale Amazon data
      </span>
    );
  }
  if (lead.buy_box_price == null) {
    return (
      <span className={base}>
        <MinusCircle className="size-3.5 text-muted-foreground" aria-hidden /> No Amazon price
      </span>
    );
  }
  return lead.is_profitable ? (
    <span className={base}>
      <CheckCircle2 className="size-3.5 text-status-good" aria-hidden /> Profitable
    </span>
  ) : (
    <span className={base}>
      <XCircle className="size-3.5 text-status-critical" aria-hidden /> Below target
    </span>
  );
}

// Profit and ROI: green/red by sign, plain grey when the Keepa data is stale.
function Signed({ value, muted, children }: { value: number | null; muted: boolean; children: React.ReactNode }) {
  const tone =
    value == null || muted ? "text-muted-foreground" : value >= 0 ? "font-semibold text-emerald-700" : "text-red-700";
  return <span className={`tabular-nums ${tone}`}>{children}</span>;
}

function Sub({ children, warn = false }: { children: React.ReactNode; warn?: boolean }) {
  return (
    <span className={`block text-xs ${warn ? "font-semibold text-amber-700" : "text-muted-foreground"}`}>
      {children}
    </span>
  );
}

function ProductCell({ lead }: { lead: ArbitrageLead }) {
  const link = "text-primary hover:underline";
  return (
    <div className="flex min-w-[300px] max-w-[420px] gap-3 whitespace-normal">
      {lead.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element -- supplier CDN image, not worth next/image config
        <img
          src={lead.image_url}
          alt=""
          width={44}
          height={44}
          loading="lazy"
          className="h-11 w-11 flex-none rounded border border-border bg-white object-contain"
        />
      ) : (
        <span className="h-11 w-11 flex-none rounded border border-border bg-muted" aria-hidden />
      )}
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="line-clamp-2 font-medium text-foreground" title={lead.supplier_title ?? undefined}>
          {lead.supplier_title ?? lead.amazon_title ?? lead.asin}
        </span>
        <span className="text-xs text-muted-foreground">
          {lead.supplier_mpn ? `MPN ${lead.supplier_mpn} · ` : ""}UPC {lead.upc} · ASIN {lead.asin}
        </span>
        <span className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
          {lead.supplier_url && (
            <a className={link} href={lead.supplier_url} target="_blank" rel="noreferrer">
              PlumbersStock ↗
            </a>
          )}
          <a className={link} href={`https://www.amazon.com/dp/${lead.asin}`} target="_blank" rel="noreferrer">
            Amazon ↗
          </a>
          <a className={link} href={`https://keepa.com/#!product/1-${lead.asin}`} target="_blank" rel="noreferrer">
            Keepa ↗
          </a>
          {lead.in_stock === false && (
            <span className="rounded bg-amber-50 px-1.5 text-amber-800">Supplier out of stock</span>
          )}
        </span>
      </div>
    </div>
  );
}

function buildColumns(now: number): ColumnDef<ArbitrageLead>[] {
  const num = (value: number | null) => value ?? undefined;
  return [
    {
      id: "product",
      header: "Product",
      enableSorting: false,
      cell: ({ row }) => <ProductCell lead={row.original} />,
      meta: { wrap: true } satisfies ColumnMeta,
    },
    {
      id: "cost",
      header: "Cost",
      accessorFn: (l) => num(l.cost_price),
      sortUndefined: "last",
      cell: ({ row }) => <span className="tabular-nums">{formatMoney(row.original.cost_price)}</span>,
      meta: { numeric: true } satisfies ColumnMeta,
    },
    {
      id: "amazon",
      header: "Amazon price",
      accessorFn: (l) => num(l.buy_box_price),
      sortUndefined: "last",
      cell: ({ row }) => {
        const l = row.original;
        return (
          <>
            <span className="tabular-nums">{formatMoney(l.buy_box_price)}</span>
            <Sub>
              {l.price_source ? PRICE_SOURCE[l.price_source] : "—"}
              {l.buy_box_is_amazon ? " · Amazon" : l.buy_box_is_fba ? " · FBA" : ""}
            </Sub>
            <Sub warn={l.is_stale}>Keepa {formatTimeAgo(l.keepa_last_update, now)}</Sub>
          </>
        );
      },
      meta: { numeric: true } satisfies ColumnMeta,
    },
    {
      id: "fees",
      header: "Fees",
      accessorFn: (l) => num(l.total_fees),
      sortUndefined: "last",
      cell: ({ row }) => {
        const l = row.original;
        return (
          <>
            <span className="tabular-nums">{formatMoney(l.total_fees)}</span>
            <Sub>
              {l.referral_fee_pct != null ? `${l.referral_fee_pct}% + ` : ""}
              {formatMoney(l.fba_fee)} FBA{l.fba_fee_estimated ? " (est.)" : ""}
            </Sub>
          </>
        );
      },
      meta: { numeric: true } satisfies ColumnMeta,
    },
    {
      id: "net_profit",
      header: "Net profit",
      accessorFn: (l) => num(l.net_profit),
      sortUndefined: "last",
      cell: ({ row }) => (
        <Signed value={row.original.net_profit} muted={row.original.is_stale}>
          {formatMoney(row.original.net_profit)}
        </Signed>
      ),
      meta: { numeric: true } satisfies ColumnMeta,
    },
    {
      id: "roi",
      header: "ROI",
      accessorFn: (l) => num(l.roi_pct),
      sortUndefined: "last",
      cell: ({ row }) => (
        <Signed value={row.original.roi_pct} muted={row.original.is_stale}>
          {formatPct1(row.original.roi_pct)}
        </Signed>
      ),
      meta: { numeric: true } satisfies ColumnMeta,
    },
    {
      id: "margin",
      header: "Margin",
      accessorFn: (l) => num(l.net_margin_pct),
      sortUndefined: "last",
      cell: ({ row }) => <span className="tabular-nums">{formatPct1(row.original.net_margin_pct)}</span>,
      meta: { numeric: true } satisfies ColumnMeta,
    },
    {
      id: "bsr",
      header: "Sales rank",
      accessorFn: (l) => num(l.bsr_current),
      sortUndefined: "last",
      cell: ({ row }) => {
        const l = row.original;
        return (
          <>
            <span className="tabular-nums">{l.bsr_current != null ? `#${formatCount(l.bsr_current)}` : "—"}</span>
            <Sub>
              30d {formatCompact(l.bsr_avg_30)} · 90d {formatCompact(l.bsr_avg_90)}
            </Sub>
          </>
        );
      },
      meta: { numeric: true } satisfies ColumnMeta,
    },
    {
      id: "offers",
      header: "Offers",
      accessorFn: (l) => num(l.new_offer_count),
      sortUndefined: "last",
      cell: ({ row }) => <span className="tabular-nums">{formatCount(row.original.new_offer_count)}</span>,
      meta: { numeric: true } satisfies ColumnMeta,
    },
    {
      id: "status",
      header: "Status",
      accessorFn: statusRank,
      cell: ({ row }) => <StatusBadge lead={row.original} />,
    },
  ];
}

export function ArbitrageLeadsTable({ leads, now }: { leads: ArbitrageLead[]; now: number }) {
  const [profitableOnly, setProfitableOnly] = useState(false);
  // Empty sort = keep the query order (fresh first, best ROI first).
  const [sorting, setSorting] = useState<SortingState>([]);
  const columns = useMemo(() => buildColumns(now), [now]);
  const profitableCount = useMemo(() => leads.filter((l) => l.is_profitable).length, [leads]);
  const data = useMemo(
    () => (profitableOnly ? leads.filter((l) => l.is_profitable) : leads),
    [leads, profitableOnly]
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // Phones: 40px tall (py-3) for a comfortable tap; from sm up the compact 24px pill.
  const pill = (active: boolean) =>
    `rounded-full px-3 py-3 text-xs font-medium transition-colors sm:py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
      active ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-muted text-foreground hover:bg-muted/80"
    }`;

  return (
    <DashboardCard
      title="Leads"
      action={
        <div className="flex gap-2" role="group" aria-label="Filter leads">
          <button type="button" aria-pressed={!profitableOnly} onClick={() => setProfitableOnly(false)} className={pill(!profitableOnly)}>
            All ({leads.length})
          </button>
          <button type="button" aria-pressed={profitableOnly} onClick={() => setProfitableOnly(true)} className={pill(profitableOnly)}>
            Profitable ({profitableCount})
          </button>
        </div>
      }
    >
      {data.length === 0 ? (
        <EmptyState message="No leads match this view yet. Run sourcing on a category to find some." />
      ) : (
        <DataTable table={table} maxHeightClass="max-h-[640px]" />
      )}
    </DashboardCard>
  );
}
