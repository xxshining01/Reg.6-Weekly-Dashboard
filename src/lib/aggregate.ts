// lib/aggregate.ts
// Aggregation & Filter Logic

import { DailyRow, MonthlyRow, DashboardFilters } from "@/types/revenue";

export function applyFilters<
  T extends {
    province: string;
    office: string;
    businessGroup: string;
    date: string;
  }
>(rows: T[], filters: DashboardFilters): T[] {
  return rows.filter((r) => {
    if (filters.province !== "ALL" && r.province !== filters.province)
      return false;
    if (filters.office !== "ALL" && r.office !== filters.office) return false;
    if (
      filters.businessGroup !== "ALL" &&
      r.businessGroup !== filters.businessGroup
    )
      return false;
    if (r.date < filters.dateFrom || r.date > filters.dateTo) return false;
    return true;
  });
}

export function sumRevenue(rows: { revenue: number }[]): number {
  return rows.reduce((s, r) => s + r.revenue, 0);
}

export function groupByKey<T>(rows: T[], keyFn: (row: T) => string) {
  const map = new Map<string, T[]>();
  rows.forEach((r) => {
    const key = keyFn(r);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(r);
  });
  return map;
}

/** คำนวณรายได้รวมแยกตามจังหวัด */
export function calcProvinceRevenues(
  rows: DailyRow[]
): { province: string; revenue: number }[] {
  const map = groupByKey(rows, (r) => r.province);
  const result: { province: string; revenue: number }[] = [];
  map.forEach((provinceRows, province) => {
    result.push({ province, revenue: sumRevenue(provinceRows) });
  });
  return result.sort((a, b) => b.revenue - a.revenue);
}

/** คำนวณรายได้รวมแยกตามกลุ่มธุรกิจ */
export function calcBusinessGroupRevenues(
  rows: DailyRow[]
): { name: string; value: number }[] {
  const map = groupByKey(rows, (r) => r.businessGroup);
  const result: { name: string; value: number }[] = [];
  map.forEach((bgRows, name) => {
    result.push({ name, value: sumRevenue(bgRows) });
  });
  return result.sort((a, b) => b.value - a.value);
}

/** รายได้รายวัน (ไม่สะสม) แยกตามวัน */
export function calcDailyRevenues(
  rows: DailyRow[]
): { date: string; actual: number }[] {
  const map = groupByKey(rows, (r) => r.date);
  const result: { date: string; actual: number }[] = [];
  map.forEach((dayRows, date) => {
    result.push({ date, actual: sumRevenue(dayRows) });
  });
  return result.sort((a, b) => a.date.localeCompare(b.date));
}

/** สะสมรายได้รายวันให้เป็น cumulative */
export function toCumulativeDaily(
  dailyRevenues: { date: string; actual: number }[]
): { date: string; actual: number; cumulative: number }[] {
  let cumulative = 0;
  return dailyRevenues.map((d) => {
    cumulative += d.actual;
    return { ...d, cumulative };
  });
}

/** คำนวณรายได้รวมแยกตามที่ทำการ */
export function calcOfficeRevenues(
  rows: DailyRow[]
): { office: string; province: string; revenue: number }[] {
  const map = groupByKey(rows, (r) => r.office);
  const result: { office: string; province: string; revenue: number }[] = [];
  map.forEach((officeRows, office) => {
    result.push({
      office,
      province: officeRows[0]?.province ?? "",
      revenue: sumRevenue(officeRows),
    });
  });
  return result.sort((a, b) => b.revenue - a.revenue);
}
