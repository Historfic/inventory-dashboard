"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { fetchAllPages } from "@/lib/fetchAllPages";
import type { InventoryRow } from "@/lib/types";

type State = {
  data: InventoryRow[] | null;
  loading: boolean;
  error: string | null;
  reportDate: string | null;
};

type Args = {
  dateStart: string;
  dateEnd: string;
  branches: string[];
};

export function useInventoryData({ dateStart, dateEnd, branches }: Args) {
  const branchKey = branches.join("|");

  const [state, setState] = useState<State>({
    data: null,
    loading: true,
    error: null,
    reportDate: null,
  });

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));

    (async () => {
      try {
        const branchList = branchKey === "" ? null : branchKey.split("|");
        const rows = await fetchAllPages<InventoryRow>((from, to) =>
          supabase
            .rpc("latest_inventory_in_range", {
              start_date: dateStart,
              end_date: dateEnd,
              branch_filter: branchList,
            })
            .range(from, to)
        );
        if (cancelled) return;
        const reportDate = rows.length > 0 ? String(rows[0].report_date) : null;
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
  }, [dateStart, dateEnd, branchKey]);

  return state;
}
