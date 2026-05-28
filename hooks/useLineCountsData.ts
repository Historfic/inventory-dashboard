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
};

export function useLineCountsData() {
  const [state, setState] = useState<State>({
    data: null,
    loading: true,
    error: null,
    availableDates: [],
    latestDate: null,
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
        setState({
          data: rows,
          loading: false,
          error: null,
          availableDates,
          latestDate,
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
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
