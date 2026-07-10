"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { fetchAllPages } from "@/lib/fetchAllPages";
import type { InboundFreightRow } from "@/lib/inbound-freight-types";

export type FreightTrendPoint = {
  report_date: string;
  freight_pct: number;
  total_order: number;
  total_freight: number;
};

type State = {
  data: FreightTrendPoint[] | null;
  loading: boolean;
  error: string | null;
};

export function useFreightTrend() {
  const [state, setState] = useState<State>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const rows = await fetchAllPages<InboundFreightRow>((from, to) =>
          supabase.from("inbound_freight_all").select("*").range(from, to)
        );
        if (cancelled) return;

        // Bucket by calendar month first, keeping only the latest report_date
        // within each month — guards against pre-normalization daily dates
        // (or a re-upload) coexisting with the current month-based dates and
        // splintering one month into multiple trend points.
        const latestDatePerMonth = new Map<string, string>();
        for (const r of rows) {
          const d = String(r.report_date);
          const monthKey = d.slice(0, 7);
          const current = latestDatePerMonth.get(monthKey);
          if (!current || d > current) latestDatePerMonth.set(monthKey, d);
        }

        // Per CLAUDE.md §15: weighted ratio = SUM(freight) / SUM(order) * 100.
        type Acc = { order: number; freight: number };
        const byDate = new Map<string, Acc>();
        for (const r of rows) {
          const d = String(r.report_date);
          const monthKey = d.slice(0, 7);
          if (latestDatePerMonth.get(monthKey) !== d) continue; // stale same-month date
          let acc = byDate.get(d);
          if (!acc) {
            acc = { order: 0, freight: 0 };
            byDate.set(d, acc);
          }
          acc.order += r.gen_total_dollars ?? 0;
          acc.freight += r.freight_dollars ?? 0;
        }

        const points: FreightTrendPoint[] = Array.from(byDate.entries())
          .map(([report_date, acc]) => ({
            report_date,
            freight_pct: acc.order === 0 ? 0 : (acc.freight / acc.order) * 100,
            total_order: acc.order,
            total_freight: acc.freight,
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
  }, []);

  return state;
}
