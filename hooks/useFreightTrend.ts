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

        // Per CLAUDE.md §15: weighted ratio = SUM(freight) / SUM(order) * 100.
        // Bucket per report_date.
        type Acc = { order: number; freight: number };
        const byDate = new Map<string, Acc>();
        for (const r of rows) {
          const key = String(r.report_date);
          let acc = byDate.get(key);
          if (!acc) {
            acc = { order: 0, freight: 0 };
            byDate.set(key, acc);
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
