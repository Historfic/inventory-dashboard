// Server-only helpers for app/api/arbitrage/*. They read server-only env vars
// (ARBITRAGE_N8N_*, ARBITRAGE_KEEPA_API_KEY) — never import this file from a
// client component.
import { getArbitrageSupabase } from "@/lib/supabase-arbitrage";
import type { ArbitrageStatus } from "@/lib/arbitrage-types";

export async function getLatestRun(): Promise<ArbitrageStatus["latestRun"]> {
  try {
    const { data, error } = await getArbitrageSupabase()
      .from("sourcing_runs")
      .select("id, finished_at, status, asins_matched, profitable, error")
      .order("finished_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return error ? null : data;
  } catch {
    return null;
  }
}

// n8n public REST API: is the Arbitrage Sourcing Pipeline running right now?
// (A separate workflow from the Branch Report Pipeline — read-only here.)
export async function getN8nStatus(): Promise<ArbitrageStatus["n8n"]> {
  const base = process.env.ARBITRAGE_N8N_API_URL;
  const key = process.env.ARBITRAGE_N8N_API_KEY;
  const workflowId = process.env.ARBITRAGE_N8N_WORKFLOW_ID;
  if (!base || !key || !workflowId) return null;
  const headers = { "X-N8N-API-KEY": key, Accept: "application/json" };
  try {
    const running = await fetch(
      `${base}/executions?workflowId=${workflowId}&status=running&limit=1`,
      { headers, cache: "no-store" }
    );
    const runningData = running.ok ? await running.json() : null;
    if (runningData?.data?.length) {
      return { status: "running", startedAt: runningData.data[0].startedAt ?? null };
    }
    const latest = await fetch(`${base}/executions?workflowId=${workflowId}&limit=1`, {
      headers,
      cache: "no-store",
    });
    const exec = latest.ok ? (await latest.json())?.data?.[0] : null;
    return exec ? { status: exec.status, startedAt: exec.startedAt ?? null } : null;
  } catch {
    return null;
  }
}

// Keepa's token-status endpoint is free (consumes no tokens).
export async function getKeepaTokens(): Promise<ArbitrageStatus["keepa"]> {
  const key = process.env.ARBITRAGE_KEEPA_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(`https://api.keepa.com/token?key=${encodeURIComponent(key)}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    return { tokensLeft: data.tokensLeft, refillRate: data.refillRate, refillInMs: data.refillIn };
  } catch {
    return null;
  }
}
