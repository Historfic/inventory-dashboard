"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { fetchAllPages } from "@/lib/fetchAllPages";
import { ALL_BRANCHES, type GmroiRow } from "@/lib/gmroi-types";
import { collapseToLatestPerMonth } from "@/lib/trend";

export type GmroiTrendPoint = {
  report_date: string;
  gmroi: number;
};

type State = {
  data: GmroiTrendPoint[] | null;
  loading: boolean;
  error: string | null;
};

const GRAND_TOTALS = "Grand Totals";

export function useGmroiTrend() {
  const [state, setState] = useState<State>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const rows = await fetchAllPages<GmroiRow>((from, to) =>
          supabase.from("gmroi_all").select("*").range(from, to)
        );
        if (cancelled) return;
        // Per CLAUDE.md §14, the company-wide GMROI per upload lives in the
        // single "Grand Totals / All Branches" row of each snapshot.
        const points: GmroiTrendPoint[] = collapseToLatestPerMonth(
          rows
            .filter(
              (r) =>
                r.buy_line === GRAND_TOTALS &&
                r.branch_id === ALL_BRANCHES &&
                r.gmroi != null
            )
            .map((r) => ({
              report_date: String(r.report_date),
              gmroi: r.gmroi as number,
            }))
        );
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
