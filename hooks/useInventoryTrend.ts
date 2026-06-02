"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { fetchAllPages } from "@/lib/fetchAllPages";

export type InventoryTrendPoint = {
  report_date: string;
  total_items: number;
  avg_stockout_pct: number | null;
  critical_fires_count: number;
};

type SummaryRow = {
  report_date: string | null;
  total_items: number | string | null;
  avg_stockout_pct: number | string | null;
  critical_fires_count: number | string | null;
};

type BuyerSummaryRow = {
  report_date: string | null;
  buyer: string | null;
  item_count: number | string | null;
  avg_stockout_pct: number | string | null;
};

type State = {
  data: InventoryTrendPoint[] | null;
  loading: boolean;
  error: string | null;
};

function toNumber(v: number | string | null | undefined): number {
  if (v == null) return 0;
  return typeof v === "number" ? v : Number(v);
}

export function useInventoryTrend(buyer: string | null = null) {
  const [state, setState] = useState<State>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));

    (async () => {
      try {
        if (buyer) {
          // Per-buyer trend: read the (report_date, buyer) view, filter to this buyer.
          const rows = await fetchAllPages<BuyerSummaryRow>((from, to) =>
            supabase
              .from("inventory_buyer_summary")
              .select("*")
              .eq("buyer", buyer)
              .range(from, to)
          );
          if (cancelled) return;
          const points: InventoryTrendPoint[] = rows
            .filter((r) => r.report_date != null)
            .map((r) => ({
              report_date: String(r.report_date),
              total_items: toNumber(r.item_count),
              avg_stockout_pct: r.avg_stockout_pct == null ? null : toNumber(r.avg_stockout_pct),
              critical_fires_count: 0, // not tracked per-buyer; chart no longer renders it
            }))
            .sort((a, b) => a.report_date.localeCompare(b.report_date));
          setState({ data: points, loading: false, error: null });
          return;
        }

        // Company-wide trend (default).
        const rows = await fetchAllPages<SummaryRow>((from, to) =>
          supabase.from("inventory_daily_summary").select("*").range(from, to)
        );
        if (cancelled) return;
        const points: InventoryTrendPoint[] = rows
          .filter((r) => r.report_date != null)
          .map((r) => ({
            report_date: String(r.report_date),
            total_items: toNumber(r.total_items),
            avg_stockout_pct: r.avg_stockout_pct == null ? null : toNumber(r.avg_stockout_pct),
            critical_fires_count: toNumber(r.critical_fires_count),
          }))
          .sort((a, b) => a.report_date.localeCompare(b.report_date));
        setState({ data: points, loading: false, error: null });
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "Unknown error";
        setState({ data: null, loading: false, error: message });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [buyer]);

  return state;
}
