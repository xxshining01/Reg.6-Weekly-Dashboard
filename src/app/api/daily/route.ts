// app/api/daily/route.ts
// ดึง DailyRow[] จาก dashboardData.json

import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { adaptDailyRows } from "@/lib/dataAdapter";
import { RawDashboardData } from "@/types/revenue";

export const dynamic = "force-static";
export const revalidate = 300; // cache 5 นาที

let cachedData: ReturnType<typeof adaptDailyRows> | null = null;

export async function GET() {
  try {
    if (!cachedData) {
      const dataPath = path.join(process.cwd(), "src", "data", "dashboardData.json");
      const fileContents = fs.readFileSync(dataPath, "utf8");
      const raw: RawDashboardData = JSON.parse(fileContents);
      cachedData = adaptDailyRows(raw);
    }
    return NextResponse.json({ data: cachedData });
  } catch (err) {
    console.error("Error reading daily data:", err);
    return NextResponse.json(
      { error: "ไม่สามารถดึงข้อมูลรายวันได้" },
      { status: 500 }
    );
  }
}
