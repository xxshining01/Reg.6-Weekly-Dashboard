// contexts/FilterContext.tsx
"use client";
import { createContext, useContext, useState, ReactNode } from "react";
import dayjs from "dayjs";
import { DashboardFilters } from "@/types/revenue";

function getDefaultFilters(): DashboardFilters {
  return {
    province: "ALL",
    office: "ALL",
    businessGroup: "ALL",
    dateFrom: dayjs().startOf("month").format("YYYY-MM-DD"),
    dateTo: dayjs().format("YYYY-MM-DD"),
  };
}

const defaultFilters = getDefaultFilters();

const FilterContext = createContext<{
  filters: DashboardFilters;
  setFilters: (f: Partial<DashboardFilters>) => void;
  resetFilters: () => void;
}>({
  filters: defaultFilters,
  setFilters: () => {},
  resetFilters: () => {},
});

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFiltersState] = useState<DashboardFilters>(defaultFilters);

  const setFilters = (partial: Partial<DashboardFilters>) =>
    setFiltersState((prev) => ({ ...prev, ...partial }));

  const resetFilters = () => setFiltersState(getDefaultFilters());

  return (
    <FilterContext.Provider value={{ filters, setFilters, resetFilters }}>
      {children}
    </FilterContext.Provider>
  );
}

export const useFilters = () => useContext(FilterContext);
