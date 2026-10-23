import { NextResponse } from "next/server";
import { getKeepaTokens, getLatestRun, getN8nStatus } from "@/lib/arbitrage-server";
import type { ArbitrageStatus } from "@/lib/arbitrage-types";

export const runtime = "nodejs";

// Polled by the Run Sourcing panel: latest logged run, live n8n execution
// state, and the Keepa token balance. Secrets stay server-side.
export async function GET() {
  const [latestRun, n8n, keepa] = await Promise.all([
    getLatestRun(),
    getN8nStatus(),
    getKeepaTokens(),
  ]);
  const body: ArbitrageStatus = { latestRun, n8n, keepa };
  return NextResponse.json(body, { headers: { "Cache-Control": "no-store" } });
}
