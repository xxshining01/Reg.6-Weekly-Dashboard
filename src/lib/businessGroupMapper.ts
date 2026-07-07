export function mapBusinessGroup(rawGroup: string): string {
  const g = rawGroup || "";
  
  if (g.includes("1.1")) return "กลุ่มบริการไปรษณียภัณฑ์";
  if (g.includes("1.2") || g.includes("Pickup")) return "กลุ่มบริการขนส่งและโลจิสติกส์";
  if (g.includes("1.4.1") || g.includes("1.4.2")) return "กลุ่มธุรกิจค้าปลีกและการเงิน";
  if (g.includes("1.3")) return "กลุ่มบริการระหว่างประเทศ";
  if (g.includes("1.6")) return "รายได้อื่น";
  if (g.includes("1.5")) return "กลุ่มธุรกิจอื่นๆ";
  
  // Fallback for anything else
  return g;
}

export function parseNumber(val: any): number {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const str = String(val).replace(/,/g, '');
  const parsed = parseFloat(str);
  return isNaN(parsed) ? 0 : parsed;
}
