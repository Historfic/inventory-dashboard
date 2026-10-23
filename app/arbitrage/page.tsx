"use client";

import { useArbitrageData } from "@/hooks/useArbitrageData";
import { RunSourcingPanel } from "@/components/arbitrage/RunSourcingPanel";
import { ArbitrageOverviewCards } from "@/components/arbitrage/ArbitrageOverviewCards";
import { ArbitrageLeadsTable } from "@/components/arbitrage/ArbitrageLeadsTable";
import { SourcingRunsTable } from "@/components/arbitrage/SourcingRunsTable";
import { formatTimeAgo } from "@/lib/arbitrage-format";

// Arbitrage leads: PlumbersStock supplier prices vs. Amazon market data from
// Keepa, scored by the n8n Arbitrage Sourcing Pipeline. See CLAUDE.md §19.
export default function ArbitragePage() {
  const { leads, runs, loading, error, fetchedAt, reload } = useArbitrageData();
  const now = fetchedAt ?? 0;
  const lastRun = runs?.[0] ?? null;

  return (
    <main className="min-h-screen bg-sky-100 p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Arbitrage Leads</h1>
        <p className="text-sm text-gray-500">
          PlumbersStock supplier prices vs. Amazon market data (Keepa), refreshed by n8n
          {leads && ` · ${leads.length.toLocaleString()} leads`}
          {lastRun && ` · last run ${formatTimeAgo(lastRun.finished_at, now)}`}
        </p>
      </header>

      <div className="flex flex-col gap-4">
        <RunSourcingPanel lastRunId={lastRun?.id ?? null} onRunFinished={reload} />

        {error ? (
          <div className="rounded-lg border border-red-200 bg-white p-6 text-sm text-red-700 shadow-md">
            Error loading data: {error}
          </div>
        ) : loading || !leads || !runs ? (
          <div className="rounded-lg bg-white p-12 text-center text-sm text-gray-500 border border-sky-200 shadow-md">
            Loading…
          </div>
        ) : (
          <>
            <ArbitrageOverviewCards leads={leads} runs={runs} now={now} />
            <ArbitrageLeadsTable leads={leads} now={now} />
            <SourcingRunsTable runs={runs} now={now} />
            <p className="max-w-4xl text-xs text-gray-500">
              Net profit = Amazon price − referral fee − FBA pick &amp; pack fee (from Keepa; a flat estimate when Keepa
              has none) − prep − supplier cost. Inbound shipping, sales tax and storage fees are not included yet.
              Amazon price is the Buy Box when one exists, otherwise the lowest new offer. Leads whose Keepa data is
              older than 7 days are marked stale and never count as profitable.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
