// app/api/monthly/route.ts
// ดึง MonthlyRow[] จาก dashboardData.json สำหรับเดือนปัจจุบัน

import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";
import path from "path";
import fs from "fs";
import { adaptMonthlyRows } from "@/lib/dataAdapter";
import { RawDashboardData } from "@/types/revenue";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const now = new Date();
    const year = Number(searchParams.get("year") ?? now.getFullYear());
    const month = Number(searchParams.get("month") ?? now.getMonth() + 1);

    const dataPath = path.join(process.cwd(), "src", "data", "dashboardData.json");
    const fileContents = fs.readFileSync(dataPath, "utf8");
    const raw: RawDashboardData = JSON.parse(fileContents);

    const data = adaptMonthlyRows(raw, year, month);
    return NextResponse.json({ data });
  } catch (err) {
    console.error("Error reading monthly data:", err);
    return NextResponse.json(
      { error: "ไม่สามารถดึงข้อมูลรายเดือนได้" },
      { status: 500 }
    );
  }
}
