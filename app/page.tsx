"use client";

import { useMemo } from "react";
import { FilterProvider, useFilterState } from "@/hooks/useFilterState";
import { useInventoryData } from "@/hooks/useInventoryData";
import { applyClientFilters, uniqueBranches } from "@/lib/filters";
import { pageView } from "@/lib/page-state";
import { PageContent, PageShell } from "@/components/layout/PageShell";
import { LoadingState } from "@/components/layout/LoadingState";
import { ErrorState } from "@/components/layout/ErrorState";
import { FilterBar } from "@/components/filters/FilterBar";
import { BranchFilter } from "@/components/filters/BranchFilter";
import { DateRangeFilter } from "@/components/filters/DateRangeFilter";
import { UnassignedToggle } from "@/components/filters/UnassignedToggle";
import { ActiveFiltersBar } from "@/components/filters/ActiveFiltersBar";
import { DaysOutByBuyerChart } from "@/components/kpi/DaysOutByBuyerChart";
import { BuyerSummaryTable } from "@/components/kpi/BuyerSummaryTable";
import { BuyerBuyLineTable } from "@/components/kpi/BuyerBuyLineTable";
import { PurchaseDaysOutTable } from "@/components/kpi/PurchaseDaysOutTable";
import { InventoryTrendChart } from "@/components/kpi/InventoryTrendChart";

export default function DashboardPage() {
  return (
    <FilterProvider>
      <DashboardContents />
    </FilterProvider>
  );
}

function DashboardContents() {
  const {
    filters,
    setBranches,
    setDateRange,
    setHideUnassigned,
  } = useFilterState();

  const { data, loading, error, reportDate } = useInventoryData({
    dateStart: filters.dateStart,
    dateEnd: filters.dateEnd,
    branches: filters.branches,
  });

  const filteredRows = useMemo(
    () => (data ? applyClientFilters(data, filters) : []),
    [data, filters]
  );

  const availableBranches = useMemo(
    () => (data ? uniqueBranches(data) : []),
    [data]
  );

  // "empty" renders the sections as before: each table shows its own empty message.
  const view = pageView({ loading, error, data });

  return (
    <PageShell
      title="Inventory Dashboard"
      subtitle={
        <>
          {reportDate ? `Snapshot: ${reportDate}` : "Loading snapshot…"}
          {filters.branches.length > 0 && ` · ${filters.branches.length} branch(es)`}
          {data && ` · ${filteredRows.length.toLocaleString()} items shown`}
        </>
      }
      actions={
        <UnassignedToggle
          hideUnassigned={filters.hideUnassigned}
          onChange={setHideUnassigned}
        />
      }
    >
      <FilterBar className="mb-4">
        <BranchFilter
          available={availableBranches}
          selected={filters.branches}
          onChange={setBranches}
        />
        <DateRangeFilter
          dateStart={filters.dateStart}
          dateEnd={filters.dateEnd}
          onChange={setDateRange}
        />
      </FilterBar>

      <section className="mb-4">
        <ActiveFiltersBar />
      </section>

      {view === "error" ? (
        <ErrorState message={error ?? ""} />
      ) : view === "loading" ? (
        <LoadingState />
      ) : (
        <PageContent refreshing={view === "refreshing"}>
          <InventoryTrendChart />
          <DaysOutByBuyerChart rows={filteredRows} />
          <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <BuyerSummaryTable rows={filteredRows} />
            <BuyerBuyLineTable rows={filteredRows} />
          </section>
          <PurchaseDaysOutTable rows={filteredRows} />
        </PageContent>
      )}
    </PageShell>
  );
}
