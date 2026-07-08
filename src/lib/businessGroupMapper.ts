export function mapBusinessGroup(rawGroup: string): string {
  let g = rawGroup || "";
  
  // ตัดคำนำหน้าออกเพื่อให้ชื่อสั้นลง
  g = g.replace("กลุ่มธุรกิจ", "");
  g = g.replace("กลุ่มบริการ", "");
  g = g.trim();
  
  if (g.includes("1.1")) return "ไปรษณียภัณฑ์";
  if (g.includes("1.2") || g.includes("Pickup")) return "ขนส่งและโลจิสติกส์";
  if (g.includes("1.4.1") || g.includes("1.4.2")) return "ค้าปลีกและการเงิน";
  if (g.includes("1.3")) return "ระหว่างประเทศ";
  if (g.includes("1.6")) return "รายได้อื่น";
  if (g.includes("1.5")) return "อื่นๆ";
  
  // Fallback for anything else (e.g. "ค้าปลีกและการเงิน" will just be returned)
  return g;
}

export function parseNumber(val: any): number {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const str = String(val).replace(/,/g, '');
  const parsed = parseFloat(str);
  return isNaN(parsed) ? 0 : parsed;
}
