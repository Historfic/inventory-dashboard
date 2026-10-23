"use client";

import { useGmroiData } from "@/hooks/useGmroiData";
import { useBuyerByBuyLine } from "@/hooks/useBuyerByBuyLine";
import {
  GmroiFilterProvider,
  useGmroiFilterState,
} from "@/hooks/useGmroiFilterState";
import { pageView } from "@/lib/page-state";
import { PageContent, PageShell } from "@/components/layout/PageShell";
import { LoadingState } from "@/components/layout/LoadingState";
import { ErrorState } from "@/components/layout/ErrorState";
import { EmptyCard } from "@/components/layout/EmptyState";
import { FilterBar } from "@/components/filters/FilterBar";
import { ClearFiltersButton, FilterChip } from "@/components/filters/FilterChip";
import { GmroiOverviewCards } from "@/components/gmroi/GmroiOverviewCards";
import { GmroiByBranchTable } from "@/components/gmroi/GmroiByBranchTable";
import { GmroiByBuyLineTable } from "@/components/gmroi/GmroiByBuyLineTable";
import { GmroiByBuyerTable } from "@/components/gmroi/GmroiByBuyerTable";
import { GmroiTrendChart } from "@/components/gmroi/GmroiTrendChart";

export default function GmroiPage() {
  return (
    <GmroiFilterProvider>
      <GmroiContents />
    </GmroiFilterProvider>
  );
}

function GmroiContents() {
  const { data, loading, error, reportDate } = useGmroiData();
  const { map: buyerByBuyLine } = useBuyerByBuyLine();
  const { filters, toggleBuyer, clearAll } = useGmroiFilterState();
  const hasFilter = filters.buyerSelection !== null;
  const view = pageView({ loading, error, data });

  return (
    <PageShell
      title="GMROI Dashboard"
      subtitle={
        <>
          {reportDate ? `Snapshot: ${reportDate}` : "Loading…"}
          {data && ` · ${data.length.toLocaleString()} rows`}
        </>
      }
    >
      {hasFilter && (
        <FilterBar className="mb-4 gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Active filters:
          </span>
          <FilterChip
            label={`Buyer: ${filters.buyerSelection}`}
            onRemove={() => toggleBuyer(filters.buyerSelection!)}
          />
          <ClearFiltersButton onClick={clearAll} className="ml-auto" />
        </FilterBar>
      )}

      {view === "error" ? (
        <ErrorState message={error ?? ""} />
      ) : view === "loading" ? (
        <LoadingState tiles={4} />
      ) : view === "empty" || !data ? (
        <EmptyCard message="No GMROI data available." />
      ) : (
        <PageContent refreshing={view === "refreshing"}>
          <GmroiOverviewCards rows={data} />
          <GmroiTrendChart />
          <GmroiByBuyerTable rows={data} buyerByBuyLine={buyerByBuyLine} />
          <GmroiByBuyLineTable rows={data} buyerByBuyLine={buyerByBuyLine} />
          <GmroiByBranchTable rows={data} />
        </PageContent>
      )}
    </PageShell>
  );
}
