"use client";

import { useCallback, useEffect, useState } from "react";
import type { ArbitrageStatus } from "@/lib/arbitrage-types";

// Polls GET /api/arbitrage/status (latest run, n8n execution state, Keepa
// balance). `refresh()` fetches immediately and returns the result.
export function useArbitrageStatus(pollMs = 30_000) {
  const [status, setStatus] = useState<ArbitrageStatus | null>(null);

  const refresh = useCallback(async (): Promise<ArbitrageStatus | null> => {
    try {
      const res = await fetch("/api/arbitrage/status", { cache: "no-store" });
      if (!res.ok) return null;
      const next = (await res.json()) as ArbitrageStatus;
      setStatus(next);
      return next;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    const first = setTimeout(refresh, 0);
    const timer = setInterval(refresh, pollMs);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [refresh, pollMs]);

  return { status, refresh };
}
