// lib/aiInsight.ts
// Rule-based AI Insight Analysis (ไม่ใช่ LLM จริง)

import { DailyRow } from "@/types/revenue";
import { groupByKey, sumRevenue } from "@/lib/aggregate";

interface ProvinceProgress {
  province: string;
  progressPercent: number;
  momentum: number;       // % เปลี่ยนแปลงของ 3 วันล่าสุด เทียบ 3 วันก่อนหน้า
  topBusinessGroup: string;
  topBusinessGroupShare: number;
  revenue: number;
  target: number;
}

export function computeProvinceProgress(
  rankingData: { name: string; progressPercent: number; revenue: number; target: number }[],
  dailyRows: DailyRow[],
  asOfDate: string,
  isDrillDown: boolean
): ProvinceProgress[] {
  const results: ProvinceProgress[] = [];

  rankingData.forEach((rankItem) => {
    // rankingData is already filtered to valid targets > 0
    if (rankItem.target <= 0) return;

    const name = rankItem.name; // This is either province or office

    // Filter daily rows for this specific province/office
    const rows = dailyRows.filter(r => 
      (isDrillDown ? r.office === name : r.province === name) && r.date <= asOfDate
    );

    // momentum: เทียบผลรวม 3 วันล่าสุด vs 3 วันก่อนหน้า
    const sorted = [...rows].sort((a, b) => a.date.localeCompare(b.date));
    const byDate = groupByKey(sorted, (r) => r.date);
    const dates = Array.from(byDate.keys()).sort();
    
    // We only compute momentum if we have at least 3 days of data
    if (dates.length < 3) return;

    const last3Dates = dates.slice(-3);
    const prev3Dates = dates.slice(-6, -3);

    const last3 = last3Dates.reduce((s, d) => s + sumRevenue(byDate.get(d) ?? []), 0);
    const prev3 = prev3Dates.reduce((s, d) => s + sumRevenue(byDate.get(d) ?? []), 0);
    const momentum = prev3 > 0 ? ((last3 - prev3) / prev3) * 100 : 0;

    // Find top business group
    const byGroup = groupByKey(rows, (r) => r.businessGroup);
    let topGroup = "";
    let topGroupSum = 0;
    byGroup.forEach((groupRows, groupName) => {
      const s = sumRevenue(groupRows);
      if (s > topGroupSum) {
        topGroupSum = s;
        topGroup = groupName;
      }
    });
    const totalRevenue = sumRevenue(rows);

    results.push({
      province: name,
      progressPercent: rankItem.progressPercent,
      momentum: Number(momentum.toFixed(1)),
      topBusinessGroup: topGroup,
      topBusinessGroupShare: totalRevenue > 0 ? Number(((topGroupSum / totalRevenue) * 100).toFixed(1)) : 0,
      revenue: rankItem.revenue,
      target: rankItem.target,
    });
  });

  // Sort by progressPercent first (to match the chart's rank #1), 
  // then fallback to momentum if progress is exactly equal
  return results.sort((a, b) => b.progressPercent - a.progressPercent || b.momentum - a.momentum);
}

export function generateInsightText(progress: ProvinceProgress[]): string {
  if (progress.length === 0)
    return "ยังไม่มีข้อมูลเพียงพอสำหรับการวิเคราะห์ (ต้องการข้อมูลอย่างน้อย 3 วันต่อรายการ)";

  const top = progress[0];
  const avgProgress = progress.reduce((s, p) => s + p.progressPercent, 0) / progress.length;
  const comparedToAvg = top.progressPercent - avgProgress;

  const momentumWord = top.momentum >= 0 ? "เพิ่มขึ้น" : "ลดลง";

  // Check if it's a special unit that shouldn't have "จังหวัด" prefix
  const isSpecialUnit = top.province.startsWith("ศป.") || top.province.includes("ปข.6") || top.province.includes("รายได้อื่น");
  const prefix = isSpecialUnit ? "" : "จังหวัด";

  return (
    `${prefix}${top.province} มาแรงที่สุดในช่วงนี้ ` +
    `ด้วยความคืบหน้าเป้าหมายสะสมที่ ${top.progressPercent.toFixed(1)}% ` +
    `ซึ่ง${comparedToAvg >= 0 ? "สูงกว่า" : "ต่ำกว่า"}ค่าเฉลี่ย ${Math.abs(comparedToAvg).toFixed(1)} จุด ` +
    `แม้แนวโน้มรายได้ 3 วันล่าสุด${momentumWord} ${Math.abs(top.momentum).toFixed(1)}% เทียบกับ 3 วันก่อนหน้า ` +
    `แรงขับเคลื่อนหลักมาจาก${top.topBusinessGroup} ` +
    `คิดเป็น ${top.topBusinessGroupShare.toFixed(1)}% ของรายได้ทั้งหมด`
  );
}

export type { ProvinceProgress };
