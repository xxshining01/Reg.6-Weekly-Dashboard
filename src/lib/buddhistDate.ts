// lib/buddhistDate.ts
// แปลงวันที่เป็น พ.ศ. ทุกจุดใน dashboard

import dayjs from "dayjs";
import "dayjs/locale/th";

/**
 * แปลง Excel serial date → ISO string
 * Excel serial 1 = 1900-01-01 (แต่ Excel นับ Feb 29, 1900 ผิด ต้อง offset 25569 ไม่ใช่ 25568)
 */
export function excelSerialToISO(serial: number): string {
  const utcDays = Math.floor(serial - 25569);
  const date = new Date(utcDays * 86400 * 1000);
  return date.toISOString().split("T")[0];
}

/**
 * แปลง ISO date string → Thai Buddhist date string
 * @param dateISO "2026-07-07"
 * @param pattern dayjs format pattern (ไม่รวมปี)
 * @example formatThaiDate("2026-07-07") → "7 กรกฎาคม 2569"
 */
export function formatThaiDate(dateISO: string, pattern = "D MMMM"): string {
  const d = dayjs(dateISO).locale("th");
  const buddhistYear = d.year() + 543;
  return `${d.format(pattern)} ${buddhistYear}`;
}

/**
 * แปลง ISO date string → Thai Buddhist short date
 * @example formatThaiDateShort("2026-07-07") → "7 ก.ค. 2569"
 */
export function formatThaiDateShort(dateISO: string): string {
  return formatThaiDate(dateISO, "D MMM");
}

/**
 * แปลง ISO date string → รูปแบบ "D (dd)" เช่น "3 (พ)"
 */
export function formatThaiDateDayOfWeek(dateISO: string): string {
  const d = dayjs(dateISO).locale("th");
  // dd จะได้ จ, อ, พ, พฤ, ศ, ส, อา
  return d.format("D (dd)");
}

/**
 * คืนชื่อเดือนภาษาไทย (เต็ม) และปี พ.ศ.
 * @example getThaiMonthYear("2026-07-07") → "กรกฎาคม 2569"
 */
export function getThaiMonthYear(dateISO: string): string {
  const d = dayjs(dateISO).locale("th");
  const buddhistYear = d.year() + 543;
  return `${d.format("MMMM")} ${buddhistYear}`;
}
