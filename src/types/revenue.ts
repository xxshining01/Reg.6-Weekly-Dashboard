// types/revenue.ts

export interface DailyRow {
  date: string;           // ISO string e.g. "2026-07-03"
  province: string;
  office: string;
  businessGroup: string;
  revenue: number;
}

export interface MonthlyRow {
  date: string;           // ต้นเดือน e.g. "2026-07-01"
  province: string;
  office: string;
  businessGroup: string;
  revenue: number;        // รายได้สะสม
  target: number;         // เป้าหมายรายเดือน
}

export interface DashboardFilters {
  province: string | "ALL";
  office: string | "ALL";
  businessGroup: string | "ALL";
  dateFrom: string;       // ISO date, default = ต้นเดือนปัจจุบัน
  dateTo: string;         // ISO date, default = today
}

export interface RawDashboardData {
  dailyRevenue: RawDailyRow[];
  aggregated: {
    provinces: Record<string, AggregatedProvince>;
    locations: Record<string, AggregatedLocation>;
    totalRevenue: number;
  };
  targets: RawTarget[];
}

export interface RawDailyRow {
  date: number;           // Excel serial date
  amount: number;
  province: string;
  location: string;       // ที่ทำการ
  businessGroup: string;
  region: string;
}

export interface AggregatedProvince {
  name: string;
  revenue: number;
  businessGroups: Record<string, number>;
}

export interface AggregatedLocation {
  name: string;
  province: string;
  revenue: number;
  businessGroups: Record<string, number>;
}

export interface RawTarget {
  locationId: number;
  targetAmount: number;
  businessGroup: string;
}
