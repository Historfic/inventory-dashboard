"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { fetchAllPages } from "@/lib/fetchAllPages";
import type { LineCountRow } from "@/lib/line-counts-types";

type State = {
  data: LineCountRow[] | null;
  loading: boolean;
  error: string | null;
  availableDates: string[];
  latestDate: string | null;
  refreshedAt: string | null;
};

export function useLineCountsData() {
  const [state, setState] = useState<State>({
    data: null,
    loading: true,
    error: null,
    availableDates: [],
    latestDate: null,
    refreshedAt: null,
  });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const rows = await fetchAllPages<LineCountRow>((from, to) =>
          supabase.from("line_counts_all").select("*").range(from, to)
        );
        if (cancelled) return;
        const dateSet = new Set<string>();
        for (const r of rows) {
          if (r.report_date) dateSet.add(String(r.report_date));
        }
        const availableDates = Array.from(dateSet).sort().reverse();
        const latestDate = availableDates[0] ?? null;
        // Actual ingestion time (when the pipeline last wrote data), distinct
        // from the export date parsed from filenames.
        let refreshedAt: string | null = null;
        for (const r of rows) {
          if (r.created_at && (!refreshedAt || r.created_at > refreshedAt)) {
            refreshedAt = r.created_at;
          }
        }
        setState({
          data: rows,
          loading: false,
          error: null,
          availableDates,
          latestDate,
          refreshedAt,
        });
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "Unknown error";
        setState({
          data: null,
          loading: false,
          error: message,
          availableDates: [],
          latestDate: null,
          refreshedAt: null,
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
