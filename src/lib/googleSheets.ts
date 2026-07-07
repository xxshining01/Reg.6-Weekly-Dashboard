import Papa from 'papaparse';

export async function fetchGoogleSheetCSV(sheetId: string, sheetName: string): Promise<any[]> {
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
  
  try {
    const res = await fetch(url, {
      next: { revalidate: 300 }, // Cache for 5 minutes
    });
    
    if (!res.ok) {
      throw new Error(`Failed to fetch sheet ${sheetName}: ${res.statusText}`);
    }

    const csvText = await res.text();
    
    const parsed = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
    });

    return parsed.data;
  } catch (error) {
    console.error(`Error fetching sheet ${sheetName}:`, error);
    return [];
  }
}

// "d/mm/yyyy" to "YYYY-MM-DD"
export function parseThaiDateString(dateStr: string): string | null {
  if (!dateStr) return null;
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2];
    // ถ้า year เป็น พ.ศ. ให้แปลงเป็น ค.ศ.
    const yearNum = parseInt(year, 10);
    const finalYear = yearNum > 2500 ? yearNum - 543 : yearNum;
    
    return `${finalYear}-${month}-${day}`;
  }
  return null;
}
