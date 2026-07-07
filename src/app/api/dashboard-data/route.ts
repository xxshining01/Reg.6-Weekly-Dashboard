export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { fetchGoogleSheetCSV, parseThaiDateString } from "@/lib/googleSheets";
import { mapBusinessGroup, parseNumber } from "@/lib/businessGroupMapper";
import { DailyRow, MonthlyRow } from "@/types/revenue";

const CACHE_FILE = path.join(process.cwd(), '.dashboard-cache.json');
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function GET() {
  try {
    // 0. Check Cache
    if (fs.existsSync(CACHE_FILE)) {
      const stat = fs.statSync(CACHE_FILE);
      if (Date.now() - stat.mtimeMs < CACHE_TTL) {
        const cachedData = fs.readFileSync(CACHE_FILE, 'utf-8');
        return NextResponse.json(JSON.parse(cachedData));
      }
    }

    // 1. Fetch all three sheets in parallel
    // Sheet 1: "ตัวเลขประธาน" = Monthly Revenue (รหัส, หน่วยงาน, ผลงาน, เดือน, ปี(พ.ศ.), จังหวัด, ที่ทำการ, หมวดหมู่, เป้าหมาย)
    // Sheet 2: "d_TargetEVM" = Targets by Business Group (AssumeDate, จังหวัด, ..., ที่ทำการ (Recode), ..., หมวดหมู่, Bussiness Group, ..., เป้าหมาย)
    // Sheet 3: "TOTAL(รายวัน)" = Daily Revenue
    const [monthlyRevCSV, targetCSV, dailyRevCSV] = await Promise.all([
      fetchGoogleSheetCSV("1Z5ee6QGYGauPYkmSdRtUvfkSKl8_0sAdJ6RHVWntbsk", "ตัวเลขประธาน"),
      fetchGoogleSheetCSV("1Z5ee6QGYGauPYkmSdRtUvfkSKl8_0sAdJ6RHVWntbsk", "d_TargetEVM"),
      fetchGoogleSheetCSV("1N0YGzow88jLN2XfEYwMcDYe6wt2-74Zi_Yft-z8AqBc", "TOTAL(รายวัน)")
    ]);

    console.log(`[API] Fetched: ตัวเลขประธาน=${monthlyRevCSV.length} rows, d_TargetEVM=${targetCSV.length} rows, Daily=${dailyRevCSV.length} rows`);

    // ──────────────────────────────────────────────────────
    // 2. Process Daily Revenue (Sheet 3: TOTAL(รายวัน))
    // ──────────────────────────────────────────────────────
    const dailyRows: DailyRow[] = [];
    for (const row of dailyRevCSV) {
      const dateRaw = row["AssumeDate"] || row["DATE"] || row["วันที่"];
      const date = parseThaiDateString(dateRaw);
      if (!date) continue;

      const amount = parseNumber(row["ผลงาน"] || row["Amount"] || row["AMOUNT"] || row["ยอดเงิน"] || row["รายได้"] || row["จำนวนเงิน"] || 0);
      if (amount <= 0) continue;

      const province = row["จังหวัด"] || "";
      const office = row["ที่ทำการ"] || "";
      const rawBg = row["Bussiness Group"] || row["Business Group"] || row["กลุ่มธุรกิจ"] || row["หมวดหมู่"] || "";
      const mappedBg = mapBusinessGroup(rawBg);

      dailyRows.push({
        date,
        revenue: amount,
        province,
        office,
        businessGroup: mappedBg,
      });
    }

    // ──────────────────────────────────────────────────────
    // 3. Process Targets (Sheet 2: d_TargetEVM)
    //    Filter: หมวดหมู่ === "รายได้" ONLY
    //    Columns: AssumeDate, จังหวัด, ที่ทำการ (Recode), หมวดหมู่, Bussiness Group, เป้าหมาย, Month, ปี พ.ศ.
    // ──────────────────────────────────────────────────────
    const targetsList: any[] = [];
    let targetSkipped = 0;
    for (const row of targetCSV) {
      // STRICT filter: only "รายได้"
      if (row["หมวดหมู่"] !== "รายได้") {
        targetSkipped++;
        continue;
      }

      const amount = parseNumber(row["เป้าหมาย"]);
      if (amount <= 0) continue;
      
      const province = row["จังหวัด"] || "";
      const office = row["ที่ทำการ (Recode)"] || row["ที่ทำการ"] || "";
      const mappedBg = mapBusinessGroup(row["Bussiness Group"] || row["Business Group"] || "");

      // Extract month and year for date-based filtering on frontend
      const monthNum = parseInt(row["Month"] || "0", 10);
      const yearBE = parseInt(row["ปี พ.ศ."] || "0", 10);
      const yearCE = yearBE > 2500 ? yearBE - 543 : yearBE;

      targetsList.push({
        province,
        office,
        businessGroup: mappedBg,
        target: amount,
        month: monthNum,
        year: yearCE, // Store as ค.ศ. for easier comparison in frontend
      });
    }
    console.log(`[API] Targets: ${targetsList.length} revenue rows kept, ${targetSkipped} non-revenue rows skipped`);

    // ──────────────────────────────────────────────────────
    // 4. Process Monthly Revenue (Sheet 1: ตัวเลขประธาน)
    //    Headers: รหัส, หน่วยงาน, ผลงาน(C), เดือน(D), ปี(E=พ.ศ.), จังหวัด(F), ที่ทำการ(G), หมวดหมู่(H), เป้าหมาย(I)
    //    Filter: หมวดหมู่ === "รายได้"
    // ──────────────────────────────────────────────────────
    const monthlyRows: MonthlyRow[] = [];
    let monthlySkipped = 0;
    for (const row of monthlyRevCSV) {
      if (row["หมวดหมู่"] !== "รายได้") {
        monthlySkipped++;
        continue;
      }

      const revenue = parseNumber(row["ผลงาน"]);
      const monthNum = parseInt(row["เดือน"] || "0", 10);
      const yearBE = parseInt(row["ปี"] || "0", 10);
      const yearCE = yearBE > 2500 ? yearBE - 543 : yearBE;

      if (monthNum < 1 || monthNum > 12 || yearCE < 2000) continue;

      const province = row["จังหวัด"] || "";
      const office = row["ที่ทำการ"] || "";

      // Construct an ISO date for filtering (use 1st of the month)
      const dateStr = `${yearCE}-${String(monthNum).padStart(2, '0')}-01`;

      // Also read target from this sheet (column I: เป้าหมาย)
      const targetFromSheet = parseNumber(row["เป้าหมาย"]);

      monthlyRows.push({
        date: dateStr,
        province,
        office,
        businessGroup: "รวม", // ตัวเลขประธาน doesn't have Business Group breakdown, it's aggregate
        revenue,
        target: targetFromSheet,
      });
    }
    console.log(`[API] Monthly: ${monthlyRows.length} revenue rows kept, ${monthlySkipped} non-revenue rows skipped`);

    const payload = {
      dailyRows,
      monthlyRows,
      rawTargets: targetsList,
    };

    // Save to Cache
    try {
      fs.writeFileSync(CACHE_FILE, JSON.stringify(payload), 'utf-8');
    } catch (e) {
      console.error("Failed to write cache:", e);
    }

    return NextResponse.json(payload);
  } catch (error: any) {
    console.error("[API] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
