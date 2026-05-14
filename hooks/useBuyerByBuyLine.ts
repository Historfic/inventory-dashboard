"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { fetchAllPages } from "@/lib/fetchAllPages";

type Row = { buy_line: string | null; buyer: string | null };

type State = {
  map: Map<string, string> | null;
  loading: boolean;
  error: string | null;
};

const UNASSIGNED = "UNASSIGNED";

export function useBuyerByBuyLine() {
  const [state, setState] = useState<State>({ map: null, loading: true, error: null });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const rows = await fetchAllPages<Row>((from, to) =>
          supabase
            .from("latest_inventory_snapshot")
            .select("buy_line, buyer")
            .range(from, to)
        );
        if (cancelled) return;

        const counts = new Map<string, Map<string, number>>();
        for (const r of rows) {
          if (!r.buy_line) continue;
          const buyer = r.buyer ?? UNASSIGNED;
          let inner = counts.get(r.buy_line);
          if (!inner) {
            inner = new Map();
            counts.set(r.buy_line, inner);
          }
          inner.set(buyer, (inner.get(buyer) ?? 0) + 1);
        }

        const map = new Map<string, string>();
        for (const [buy_line, inner] of counts) {
          let bestBuyer = UNASSIGNED;
          let bestCount = -1;
          for (const [buyer, count] of inner) {
            const isBetter =
              count > bestCount ||
              (count === bestCount && bestBuyer === UNASSIGNED && buyer !== UNASSIGNED);
            if (isBetter) {
              bestBuyer = buyer;
              bestCount = count;
            }
          }
          map.set(buy_line, bestBuyer);
        }

        setState({ map, loading: false, error: null });
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "Unknown error";
        setState({ map: null, loading: false, error: message });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
