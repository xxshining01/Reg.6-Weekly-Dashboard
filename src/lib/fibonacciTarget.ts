// lib/fibonacciTarget.ts
// อัลกอริทึม Fibonacci Weekly Target — หัวใจของ Gauge

import dayjs from "dayjs";

/** คืนลำดับ Fibonacci ความยาว n เริ่มที่ 1,1,2,3,5,8,... */
function fibonacciSequence(n: number): number[] {
  const seq = [1, 1];
  while (seq.length < n) {
    seq.push(seq[seq.length - 1] + seq[seq.length - 2]);
  }
  return seq.slice(0, n);
}

/**
 * แบ่งเดือน (year, month 1-12) เป็นสัปดาห์ศุกร์–พฤหัสบดี
 * คืนค่าจำนวนวันของแต่ละสัปดาห์
 */
export function splitMonthIntoFriThuWeeks(year: number, month: number): number[] {
  const start = dayjs(`${year}-${String(month).padStart(2, "0")}-01`);
  const end = start.endOf("month");
  const totalDays = end.date();

  const weeks: number[] = [];
  let cursor = start;
  let daysCounted = 0;

  while (daysCounted < totalDays) {
    // หา "วันพฤหัสบดี" ถัดไป (นับรวมวันปัจจุบันถ้าตรงพฤหัส) เป็นจุดตัดสัปดาห์
    const dayOfWeek = cursor.day(); // 0=อาทิตย์ ... 4=พฤหัส 5=ศุกร์
    const daysUntilThursday = (4 - dayOfWeek + 7) % 7;
    let weekEnd = cursor.add(daysUntilThursday, "day");
    if (weekEnd.isAfter(end)) weekEnd = end;

    const daysInWeek = weekEnd.diff(cursor, "day") + 1;
    weeks.push(daysInWeek);
    daysCounted += daysInWeek;
    cursor = weekEnd.add(1, "day");
  }

  return weeks;
}

export interface WeeklyTarget {
  weekIndex: number;
  daysInWeek: number;
  weekStart: string;
  weekEnd: string;
  percentOfMonth: number;     // % ของสัปดาห์นี้เดี่ยวๆ
  cumulativePercent: number;  // % สะสมถึงสัปดาห์นี้
  cumulativeAmount: number;   // จำนวนเงินสะสมถึงสัปดาห์นี้
}

export function calculateFibonacciWeeklyTargets(
  year: number,
  month: number,
  monthlyTarget: number
): WeeklyTarget[] {
  const daysPerWeek = splitMonthIntoFriThuWeeks(year, month);
  const fib = fibonacciSequence(daysPerWeek.length);

  const weightedScores = daysPerWeek.map((days, i) => days * fib[i]);
  const totalScore = weightedScores.reduce((a, b) => a + b, 0);

  let cumulativePercent = 0;
  let cursorDate = dayjs(`${year}-${String(month).padStart(2, "0")}-01`);

  return daysPerWeek.map((days, i) => {
    const percentOfMonth = (weightedScores[i] / totalScore) * 100;
    cumulativePercent += percentOfMonth;

    const weekStart = cursorDate;
    const weekEnd = cursorDate.add(days - 1, "day");
    cursorDate = weekEnd.add(1, "day");

    return {
      weekIndex: i + 1,
      daysInWeek: days,
      weekStart: weekStart.format("YYYY-MM-DD"),
      weekEnd: weekEnd.format("YYYY-MM-DD"),
      percentOfMonth: Number(percentOfMonth.toFixed(2)),
      cumulativePercent: Number(Math.min(cumulativePercent, 100).toFixed(2)),
      cumulativeAmount: Number(
        ((Math.min(cumulativePercent, 100) / 100) * monthlyTarget).toFixed(2)
      ),
    };
  });
}

/**
 * ขยายเป้าหมายรายสัปดาห์ (แบบสะสม) ให้เป็นเส้นเป้าหมายสะสมรายวัน
 * โดยเฉลี่ยเชิงเส้น (linear) ภายในแต่ละสัปดาห์
 */
export function expandToDailyCumulativeTarget(
  weeklyTargets: WeeklyTarget[],
  monthlyTarget: number
): { date: string; cumulativeTarget: number }[] {
  const result: { date: string; cumulativeTarget: number }[] = [];
  let prevCumulative = 0;

  weeklyTargets.forEach((week) => {
    const weekAmount =
      (week.cumulativePercent / 100) * monthlyTarget - prevCumulative;
    const perDay = weekAmount / week.daysInWeek;

    let d = dayjs(week.weekStart);
    for (let i = 0; i < week.daysInWeek; i++) {
      prevCumulative += perDay;
      result.push({
        date: d.format("YYYY-MM-DD"),
        cumulativeTarget: Math.round(prevCumulative),
      });
      d = d.add(1, "day");
    }
  });

  return result;
}

/**
 * หาสัปดาห์ปัจจุบัน (index 0-based) จาก weeklyTargets
 */
export function getCurrentWeekIndex(
  weeklyTargets: WeeklyTarget[],
  actualToday: string
): number {
  if (weeklyTargets.length === 0) return 0;
  
  for (let i = 0; i < weeklyTargets.length; i++) {
    if (actualToday >= weeklyTargets[i].weekStart && actualToday <= weeklyTargets[i].weekEnd) {
      return i;
    }
  }
  
  // หากเลยสัปดาห์สุดท้ายของเดือนไปแล้ว (เช่น ดูย้อนหลัง) ให้มองเป็นสัปดาห์อดีตทั้งหมด
  if (actualToday > weeklyTargets[weeklyTargets.length - 1].weekEnd) {
    return weeklyTargets.length;
  }
  // หากยังไม่ถึงสัปดาห์แรกของเดือน (เช่น ดูล่วงหน้า) ให้มองเป็นสัปดาห์อนาคตทั้งหมด
  if (actualToday < weeklyTargets[0].weekStart) {
    return -1;
  }
  
  return weeklyTargets.length - 1;
}
