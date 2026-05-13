"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
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
      const { data, error } = await supabase
        .from("latest_line_counts_snapshot")
        .select("*")
        .range(0, 9999);

      if (cancelled) return;

      if (error) {
        setState({ data: null, loading: false, error: error.message, reportDate: null });
        return;
      }

      const rows = (data ?? []) as LineCountRow[];
      const reportDate = rows.length > 0 ? rows[0].report_date : null;
      setState({ data: rows, loading: false, error: null, reportDate });
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
