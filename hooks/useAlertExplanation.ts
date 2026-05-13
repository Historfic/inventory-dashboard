"use client";

import { useEffect, useState } from "react";
import type { ExplainRequest } from "@/app/api/explain/route";

type State = {
  text: string | null;
  loading: boolean;
  error: string | null;
  cached: boolean;
};

export function useAlertExplanation(payload: ExplainRequest | null, enabled: boolean) {
  const key = payload && enabled ? JSON.stringify(payload) : null;
  const [state, setState] = useState<State>({
    text: null,
    loading: false,
    error: null,
    cached: false,
  });

  useEffect(() => {
    if (!key) {
      setState({ text: null, loading: false, error: null, cached: false });
      return;
    }

    let cancelled = false;
    const controller = new AbortController();
    setState((s) => ({ ...s, loading: true, error: null }));

    (async () => {
      try {
        const res = await fetch("/api/explain", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: key,
          signal: controller.signal,
        });
        const body = (await res.json()) as { text?: string; cached?: boolean; error?: string };
        if (cancelled) return;
        if (!res.ok) {
          setState({ text: null, loading: false, error: body.error ?? `HTTP ${res.status}`, cached: false });
          return;
        }
        setState({ text: body.text ?? "", loading: false, error: null, cached: Boolean(body.cached) });
      } catch (err) {
        if (cancelled || (err instanceof Error && err.name === "AbortError")) return;
        const msg = err instanceof Error ? err.message : "Network error";
        setState({ text: null, loading: false, error: msg, cached: false });
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  return state;
}
