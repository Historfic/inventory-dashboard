"use client";

import { useEffect, useMemo, useState } from "react";
import { useLineCountsData } from "@/hooks/useLineCountsData";
import { latestByMonthTypeSystem } from "@/lib/line-counts-aggregations";
import { pageView } from "@/lib/page-state";
import { cn } from "@/lib/utils";
import { PageContent, PageShell } from "@/components/layout/PageShell";
import { LoadingState } from "@/components/layout/LoadingState";
import { ErrorState } from "@/components/layout/ErrorState";
import { EmptyCard } from "@/components/layout/EmptyState";
import { FilterBar } from "@/components/filters/FilterBar";
import { LineCountScorecards } from "@/components/line-counts/LineCountScorecards";
import { LineCountsByWriterChart } from "@/components/line-counts/LineCountsByWriterChart";
import { LineCountsPivotTable } from "@/components/line-counts/LineCountsPivotTable";
import { LineCountsTrendChart } from "@/components/line-counts/LineCountsTrendChart";

const MONTH_ORDER = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];
// All 12 calendar months in display (title) case — shown in the selector even
// when a month has no data, so the year reads as a complete set.
const ALL_MONTHS = MONTH_ORDER.map((m) => m[0].toUpperCase() + m.slice(1));
const monthRank = (m: string | null) =>
  m ? MONTH_ORDER.indexOf(m.toLowerCase()) : -1;

export default function LineCountsPage() {
  const { data, loading, error, refreshedAt } = useLineCountsData();
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  // Collapse to the latest export per (month, system, line_type) so a corrected
  // re-export supersedes the stale one it fixes (no more coexisting bad data).
  const latestRows = useMemo(
    () => (data ? latestByMonthTypeSystem(data) : []),
    [data]
  );

  // Months that actually have data, in calendar order.
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    for (const r of latestRows) if (r.month) set.add(r.month);
    return Array.from(set).sort((a, b) => monthRank(a) - monthRank(b));
  }, [latestRows]);

  // Default to the latest month that has data.
  useEffect(() => {
    if (selectedMonth === null && availableMonths.length) {
      setSelectedMonth(availableMonths[availableMonths.length - 1]);
    }
  }, [availableMonths, selectedMonth]);

  const filteredRows = useMemo(
    () => latestRows.filter((r) => !selectedMonth || r.month === selectedMonth),
    [latestRows, selectedMonth]
  );

  const refreshedLabel = refreshedAt
    ? `Data refreshed ${new Date(refreshedAt).toLocaleString()}`
    : "";

  const view = pageView({ loading, error, data });

  return (
    <PageShell
      title="Line Counts"
      subtitle={
        <>
          {loading ? "Loading…" : refreshedLabel}
          {!loading && data && ` · ${filteredRows.length.toLocaleString()} rows in view`}
        </>
      }
    >
      {view === "error" ? (
        <ErrorState message={error ?? ""} />
      ) : view === "loading" ? (
        <LoadingState tiles={4} />
      ) : view === "empty" || !data ? (
        <EmptyCard message="No line count data available." />
      ) : (
        <PageContent refreshing={view === "refreshing"}>
          <FilterBar className="gap-2">
            <span className="text-sm font-medium text-foreground">Month:</span>
            {ALL_MONTHS.map((m) => {
              const hasData = availableMonths.includes(m);
              const selected = selectedMonth === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setSelectedMonth(m)}
                  aria-pressed={selected}
                  title={hasData ? undefined : "No data for this month yet"}
                  className={cn(
                    "rounded-lg px-3 py-2.5 text-sm font-medium transition-colors sm:py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    selected
                      ? "bg-primary text-primary-foreground"
                      : hasData
                      ? "bg-muted text-foreground hover:bg-brand-subtle"
                      : "text-muted-foreground/70 hover:bg-muted"
                  )}
                >
                  {m}
                </button>
              );
            })}
          </FilterBar>
          <LineCountScorecards rows={filteredRows} />
          <LineCountsTrendChart rows={latestRows} />
          <LineCountsByWriterChart rows={filteredRows} />
          <LineCountsPivotTable rows={filteredRows} />
        </PageContent>
      )}
    </PageShell>
  );
}
