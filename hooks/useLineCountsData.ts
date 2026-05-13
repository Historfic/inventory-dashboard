"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { fetchAllPages } from "@/lib/fetchAllPages";
import type { LineCountRow } from "@/lib/line-counts-types";

type State = {
  data: LineCountRow[] | null;
  loading: boolean;
  error: string | null;
  reportDate: string | null;
};

export function useLineCountsData() {
  const [state, setState] = useState<State>({
    data: null,
    loading: true,
    error: null,
    reportDate: null,
  });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const rows = await fetchAllPages<LineCountRow>((from, to) =>
          supabase.from("latest_line_counts_snapshot").select("*").range(from, to)
        );
        if (cancelled) return;
        const reportDate = rows.length > 0 ? rows[0].report_date : null;
        setState({ data: rows, loading: false, error: null, reportDate });
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "Unknown error";
        setState({ data: null, loading: false, error: message, reportDate: null });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
