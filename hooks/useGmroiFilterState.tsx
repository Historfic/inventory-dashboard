"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

type GmroiFilterState = {
  buyerSelection: string | null;
};

type GmroiFilterContextValue = {
  filters: GmroiFilterState;
  toggleBuyer: (buyer: string) => void;
  clearAll: () => void;
};

const GmroiFilterContext = createContext<GmroiFilterContextValue | null>(null);

const initialState: GmroiFilterState = { buyerSelection: null };

export function GmroiFilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<GmroiFilterState>(initialState);

  const toggleBuyer = useCallback((buyer: string) => {
    setFilters((prev) => ({
      buyerSelection: prev.buyerSelection === buyer ? null : buyer,
    }));
  }, []);

  const clearAll = useCallback(() => {
    setFilters(initialState);
  }, []);

  const value = useMemo<GmroiFilterContextValue>(
    () => ({ filters, toggleBuyer, clearAll }),
    [filters, toggleBuyer, clearAll]
  );

  return <GmroiFilterContext.Provider value={value}>{children}</GmroiFilterContext.Provider>;
}

export function useGmroiFilterState(): GmroiFilterContextValue {
  const ctx = useContext(GmroiFilterContext);
  if (!ctx) {
    throw new Error("useGmroiFilterState must be used inside <GmroiFilterProvider>");
  }
  return ctx;
}
