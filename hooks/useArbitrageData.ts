"use client";

import { useCallback, useEffect, useState } from "react";
import { getArbitrageSupabase } from "@/lib/supabase-arbitrage";
import { fetchAllPages } from "@/lib/fetchAllPages";
import type { ArbitrageLead, SourcingRun } from "@/lib/arbitrage-types";

type State = {
  leads: ArbitrageLead[] | null;
  runs: SourcingRun[] | null;
  loading: boolean;
  error: string | null;
  fetchedAt: number | null; // reference time for "x min ago" labels
};

// Leads (fresh first, best ROI first) + the 10 most recent runs.
// `reload()` refetches without clearing what's on screen.
export function useArbitrageData() {
  const [state, setState] = useState<State>({
    leads: null,
    runs: null,
    loading: true,
    error: null,
    fetchedAt: null,
  });
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const supabase = getArbitrageSupabase();
        const [leads, runsRes] = await Promise.all([
          // id tiebreak keeps paging stable (CLAUDE.md §4.2)
          fetchAllPages<ArbitrageLead>((from, to) =>
            supabase
              .from("arbitrage_leads")
              .select("*")
              .order("is_stale", { ascending: true })
              .order("roi_pct", { ascending: false, nullsFirst: false })
              .order("id", { ascending: true })
              .range(from, to)
          ),
          supabase
            .from("sourcing_runs")
            .select("*")
            .order("finished_at", { ascending: false })
            .limit(10),
        ]);
        if (runsRes.error) throw new Error(runsRes.error.message);
        if (cancelled) return;
        setState({
          leads,
          runs: (runsRes.data ?? []) as SourcingRun[],
          loading: false,
          error: null,
          fetchedAt: Date.now(),
        });
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "Unknown error";
        setState((s) => ({ ...s, loading: false, error: message }));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [version]);

  return { ...state, reload };
}
