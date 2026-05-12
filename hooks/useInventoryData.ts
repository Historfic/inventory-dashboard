"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { InventoryRow } from "@/lib/types";

type State = {
  data: InventoryRow[] | null;
  loading: boolean;
  error: string | null;
};

export function useInventoryData() {
  const [state, setState] = useState<State>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data, error } = await supabase
        .from("latest_inventory_snapshot")
        .select("*")
        .range(0, 9999);

      if (cancelled) return;

      if (error) {
        setState({ data: null, loading: false, error: error.message });
      } else {
        setState({ data: (data ?? []) as InventoryRow[], loading: false, error: null });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
