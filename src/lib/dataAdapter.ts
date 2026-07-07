// lib/dataAdapter.ts
// แปลงข้อมูลจาก dashboardData.json format → DailyRow[] / MonthlyRow[]
// ข้อมูลต้นทาง: { dailyRevenue[], aggregated{}, targets[] }

import { excelSerialToISO } from "@/lib/buddhistDate";
import {
  RawDashboardData,
  DailyRow,
  MonthlyRow,
} from "@/types/revenue";
import dayjs from "dayjs";

/**
 * แปลง rawData.dailyRevenue → DailyRow[]
 * กรองเฉพาะเดือน/ปีที่ต้องการ (ถ้าระบุ)
 */
export function adaptDailyRows(raw: RawDashboardData): DailyRow[] {
  const rows: DailyRow[] = [];

  for (const r of raw.dailyRevenue) {
    // skip แถวที่ amount ไม่ใช่ตัวเลขหรือ <= 0
    if (typeof r.amount !== "number" || isNaN(r.amount)) continue;
    if (typeof r.date !== "number" || isNaN(r.date)) continue;

    const isoDate = excelSerialToISO(r.date);

    rows.push({
      date: isoDate,
      province: r.province ?? "",
      office: r.location ?? "",
      businessGroup: r.businessGroup ?? "",
      revenue: r.amount,
    });
  }

  return rows;
}

/**
 * แปลง rawData → MonthlyRow[] สำหรับเดือน/ปีที่ระบุ
 * สร้างจาก aggregated.locations + targets
 *
 * targets มีแค่ locationId (ตัวเลข) → ต้อง join กับ location name
 * โดย location name ขึ้นต้นด้วย locationId (เช่น "60000 xxx" หรือ "00020 xxx")
 */
export function adaptMonthlyRows(
  raw: RawDashboardData,
  year: number,
  month: number
): MonthlyRow[] {
  const firstDay = dayjs(`${year}-${String(month).padStart(2, "0")}-01`);
  const lastDay = firstDay.endOf("month");

  // สร้าง map: locationId (string) → location name
  const locationIdToName = new Map<string, string>();
  Object.keys(raw.aggregated.locations).forEach((locName) => {
    // location name format: "XXXXX ชื่อ..." — ดึงตัวเลขนำหน้า
    const match = locName.match(/^(\d+)/);
    if (match) {
      locationIdToName.set(match[1], locName);
    }
  });

  const rows: MonthlyRow[] = [];

  for (const target of raw.targets) {
    if (
      typeof target.targetAmount !== "number" ||
      isNaN(target.targetAmount) ||
      target.targetAmount <= 0
    )
      continue;

    const locIdStr = String(target.locationId).padStart(5, "0");
    const locName = locationIdToName.get(locIdStr) || locationIdToName.get(String(target.locationId));

    if (!locName) continue;

    const locData = raw.aggregated.locations[locName];
    if (!locData) continue;

    rows.push({
      date: firstDay.format("YYYY-MM-DD"),
      province: locData.province ?? "",
      office: locName,
      businessGroup: target.businessGroup,
      revenue: locData.businessGroups[target.businessGroup] ?? 0,
      target: target.targetAmount / 12,
    });
  }

  return rows;
}

/**
 * คำนวณเป้าหมายรายเดือนรวมทุกกลุ่มธุรกิจ จาก MonthlyRow[]
 * สำหรับ filter ที่เลือกอยู่
 */
export function calcTotalMonthlyTarget(monthlyRows: MonthlyRow[]): number {
  return monthlyRows.reduce((s, r) => s + r.target, 0);
}

/**
 * unique list
 */
export function getUniqueValues<T>(arr: T[], keyFn: (item: T) => string): string[] {
  return Array.from(new Set(arr.map(keyFn))).filter(Boolean).sort();
}
