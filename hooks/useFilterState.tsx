"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { defaultFilterState, type FilterState } from "@/lib/filters";

type FilterContextValue = {
  filters: FilterState;
  setBranches: (branches: string[]) => void;
  setDateRange: (start: string, end: string) => void;
  toggleBuyer: (buyer: string) => void;
  toggleBuyLine: (buyLine: string) => void;
  setHideUnassigned: (hide: boolean) => void;
  clearAll: () => void;
};

const FilterContext = createContext<FilterContextValue | null>(null);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<FilterState>(() => defaultFilterState());

  const setBranches = useCallback((branches: string[]) => {
    setFilters((prev) => ({ ...prev, branches }));
  }, []);

  const setDateRange = useCallback((dateStart: string, dateEnd: string) => {
    setFilters((prev) => ({ ...prev, dateStart, dateEnd }));
  }, []);

  const toggleBuyer = useCallback((buyer: string) => {
    setFilters((prev) => ({
      ...prev,
      buyerSelection: prev.buyerSelection === buyer ? null : buyer,
      buyLineSelection: prev.buyerSelection === buyer ? prev.buyLineSelection : null,
    }));
  }, []);

  const toggleBuyLine = useCallback((buyLine: string) => {
    setFilters((prev) => ({
      ...prev,
      buyLineSelection: prev.buyLineSelection === buyLine ? null : buyLine,
    }));
  }, []);

  const setHideUnassigned = useCallback((hide: boolean) => {
    setFilters((prev) => ({ ...prev, hideUnassigned: hide }));
  }, []);

  const clearAll = useCallback(() => {
    setFilters(defaultFilterState());
  }, []);

  const value = useMemo<FilterContextValue>(
    () => ({
      filters,
      setBranches,
      setDateRange,
      toggleBuyer,
      toggleBuyLine,
      setHideUnassigned,
      clearAll,
    }),
    [filters, setBranches, setDateRange, toggleBuyer, toggleBuyLine, setHideUnassigned, clearAll]
  );

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
}

export function useFilterState(): FilterContextValue {
  const ctx = useContext(FilterContext);
  if (!ctx) {
    throw new Error("useFilterState must be used inside <FilterProvider>");
  }
  return ctx;
}
