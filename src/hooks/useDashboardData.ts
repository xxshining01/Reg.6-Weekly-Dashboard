"use client";
import useSWR from "swr";
import dayjs from "dayjs";
import { DailyRow, MonthlyRow } from "@/types/revenue";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface DashboardDataResponse {
  dailyRows: DailyRow[];
  monthlyRows: MonthlyRow[];
  rawTargets: { province: string; office: string; businessGroup: string; target: number }[];
  error?: string;
}

export function useDashboardData(year?: number, month?: number) {
  // We fetch all data at once now. Year and month will be handled by the page component filtering.
  const { data, error, isLoading, mutate } = useSWR<DashboardDataResponse>("/api/dashboard-data", fetcher, {
    refreshInterval: 5 * 60 * 1000,
    revalidateOnFocus: false,
  });

  return {
    dailyRows: data?.dailyRows ?? [],
    monthlyRows: data?.monthlyRows ?? [],
    rawTargets: data?.rawTargets ?? [],
    isLoading,
    isError: !!error || !!data?.error,
    mutate,
  };
}
