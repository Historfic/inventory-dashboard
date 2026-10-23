"use client";

import { useEffect, useMemo, useState } from "react";
import { useInboundFreightData } from "@/hooks/useInboundFreightData";
import {
  FreightFilterProvider,
  useFreightFilterState,
} from "@/hooks/useFreightFilterState";
import { pageView } from "@/lib/page-state";
import { PageContent, PageShell } from "@/components/layout/PageShell";
import { LoadingState } from "@/components/layout/LoadingState";
import { ErrorState } from "@/components/layout/ErrorState";
import { EmptyCard } from "@/components/layout/EmptyState";
import { FilterBar } from "@/components/filters/FilterBar";
import { ClearFiltersButton, FilterChip } from "@/components/filters/FilterChip";
import { FreightOverviewCards } from "@/components/freight/FreightOverviewCards";
import { FreightPctByWriterChart } from "@/components/freight/FreightPctByWriterChart";
import { FreightByVendorTable } from "@/components/freight/FreightByVendorTable";
import { FreightByWriterTable } from "@/components/freight/FreightByWriterTable";
import { HighInboundTable } from "@/components/freight/HighInboundTable";
import { FreightTrendChart } from "@/components/freight/FreightTrendChart";
import { UploadPicker } from "@/components/line-counts/UploadPicker";
import type { InboundFreightRow } from "@/lib/inbound-freight-types";

export default function FreightPage() {
  return (
    <FreightFilterProvider>
      <FreightContents />
    </FreightFilterProvider>
  );
}

function FreightContents() {
  const { data, loading, error, availableDates, latestDate } = useInboundFreightData();
  const { filters, toggleWriter, toggleVendor, clearAll } = useFreightFilterState();

  const [selectedDates, setSelectedDates] = useState<string[]>([]);

  // Default to latest upload once data lands; do not stomp a user choice after that.
  useEffect(() => {
    if (selectedDates.length === 0 && latestDate) {
      setSelectedDates([latestDate]);
    }
  }, [latestDate, selectedDates.length]);

  // Layered filtering: dates first, then writer, then vendor.
  const dateFilteredRows = useMemo<InboundFreightRow[]>(() => {
    if (!data) return [];
    if (selectedDates.length === 0) return [];
    const set = new Set(selectedDates);
    return data.filter((r) => set.has(String(r.report_date)));
  }, [data, selectedDates]);

  const writerFilteredRows = useMemo<InboundFreightRow[]>(() => {
    if (!filters.writerSelection) return dateFilteredRows;
    return dateFilteredRows.filter((r) => r.writer === filters.writerSelection);
  }, [dateFilteredRows, filters.writerSelection]);

  const vendorFilteredRows = useMemo<InboundFreightRow[]>(() => {
    if (!filters.vendorSelection) return writerFilteredRows;
    return writerFilteredRows.filter((r) => r.vendor_name === filters.vendorSelection);
  }, [writerFilteredRows, filters.vendorSelection]);

  const headerLabel = useMemo(() => {
    if (loading) return "Loading…";
    if (!availableDates.length) return "No uploads available";
    if (selectedDates.length === 1) return `Upload: ${selectedDates[0]}`;
    if (selectedDates.length > 1) {
      const sorted = [...selectedDates].sort();
      return `${selectedDates.length} uploads · ${sorted[0]} → ${sorted[sorted.length - 1]}`;
    }
    return "Pick an upload above";
  }, [loading, availableDates.length, selectedDates]);

  const hasFilter = filters.writerSelection !== null || filters.vendorSelection !== null;
  const view = pageView({ loading, error, data });

  return (
    <PageShell
      title="Inbound Freight"
      subtitle={
        <>
          {headerLabel}
          {data && ` · ${dateFilteredRows.length.toLocaleString()} line items`}
          {hasFilter && data && ` · ${vendorFilteredRows.length.toLocaleString()} shown`}
        </>
      }
    >
      {hasFilter && (
        <FilterBar className="mb-4 gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Active filters:
          </span>
          {filters.writerSelection && (
            <FilterChip
              label={`Writer: ${filters.writerSelection}`}
              onRemove={() => toggleWriter(filters.writerSelection!)}
            />
          )}
          {filters.vendorSelection && (
            <FilterChip
              label={`Vendor: ${filters.vendorSelection}`}
              onRemove={() => toggleVendor(filters.vendorSelection!)}
            />
          )}
          <ClearFiltersButton onClick={clearAll} className="ml-auto" />
        </FilterBar>
      )}

      {view === "error" ? (
        <ErrorState message={error ?? ""} />
      ) : view === "loading" ? (
        <LoadingState tiles={3} />
      ) : view === "empty" || !data ? (
        <EmptyCard message="No inbound freight data available." />
      ) : (
        <PageContent refreshing={view === "refreshing"}>
          <UploadPicker
            availableDates={availableDates}
            selectedDates={selectedDates}
            onChange={setSelectedDates}
          />
          <FreightOverviewCards rows={vendorFilteredRows} />
          <FreightTrendChart />
          <FreightPctByWriterChart rows={dateFilteredRows} />
          <FreightByWriterTable rows={dateFilteredRows} />
          <FreightByVendorTable rows={writerFilteredRows} />
          <HighInboundTable rows={vendorFilteredRows} />
        </PageContent>
      )}
    </PageShell>
  );
}
