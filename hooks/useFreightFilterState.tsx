"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

type FreightFilterState = {
  writerSelection: string | null;
  vendorSelection: string | null;
};

type FreightFilterContextValue = {
  filters: FreightFilterState;
  toggleWriter: (writer: string) => void;
  toggleVendor: (vendor: string) => void;
  clearAll: () => void;
};

const FreightFilterContext = createContext<FreightFilterContextValue | null>(null);

const initialState: FreightFilterState = {
  writerSelection: null,
  vendorSelection: null,
};

export function FreightFilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<FreightFilterState>(initialState);

  const toggleWriter = useCallback((writer: string) => {
    setFilters((prev) => {
      const next = prev.writerSelection === writer ? null : writer;
      return {
        writerSelection: next,
        vendorSelection: next === null ? null : prev.vendorSelection,
      };
    });
  }, []);

  const toggleVendor = useCallback((vendor: string) => {
    setFilters((prev) => ({
      ...prev,
      vendorSelection: prev.vendorSelection === vendor ? null : vendor,
    }));
  }, []);

  const clearAll = useCallback(() => {
    setFilters(initialState);
  }, []);

  const value = useMemo<FreightFilterContextValue>(
    () => ({ filters, toggleWriter, toggleVendor, clearAll }),
    [filters, toggleWriter, toggleVendor, clearAll]
  );

  return (
    <FreightFilterContext.Provider value={value}>{children}</FreightFilterContext.Provider>
  );
}

export function useFreightFilterState(): FreightFilterContextValue {
  const ctx = useContext(FreightFilterContext);
  if (!ctx) {
    throw new Error("useFreightFilterState must be used inside <FreightFilterProvider>");
  }
  return ctx;
}
