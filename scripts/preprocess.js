const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'ทำรายได้รายวันใหม่ (1).xlsx');
const outputDir = path.join(__dirname, '..', 'src', 'data');
const outputFile = path.join(outputDir, 'dashboardData.json');

console.log('Reading Excel file... This may take a moment.');
const workbook = xlsx.readFile(filePath);
console.log('Excel file read successfully.');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 1. Process "รส.201" (Daily Revenue)
const rawRevenue = xlsx.utils.sheet_to_json(workbook.Sheets['รส.201'], { raw: true });
const dailyRevenue = rawRevenue.map(row => ({
  date: row['DATE'], // Excel serial date
  amount: row['AMOUNT'] || 0,
  province: row['จังหวัด'],
  location: row['ที่ทำการ'],
  businessGroup: row['กลุ่มธุรกิจ'],
  region: row['เขต']
})).filter(row => row.region === 'ปข.6' && row.amount > 0);

// 2. Process "Target" (Monthly Targets)
const rawTargets = xlsx.utils.sheet_to_json(workbook.Sheets['Target'], { raw: true });
const targets = rawTargets.map(row => ({
  locationId: row['รหัสไปรษณีย์'], 
  targetAmount: row['เป้าหมาย 68'] || 0,
  businessGroup: row['Bussiness Group']
}));

// Aggregate data
const aggregated = {
  provinces: {},
  locations: {},
  totalRevenue: 0,
};

dailyRevenue.forEach(record => {
  const prov = record.province;
  const loc = record.location;

  if (!prov || !loc) return;

  if (!aggregated.provinces[prov]) {
    aggregated.provinces[prov] = { name: prov, revenue: 0, businessGroups: {} };
  }
  if (!aggregated.locations[loc]) {
    aggregated.locations[loc] = { name: loc, province: prov, revenue: 0, businessGroups: {} };
  }

  const amt = record.amount;
  aggregated.provinces[prov].revenue += amt;
  aggregated.locations[loc].revenue += amt;
  aggregated.totalRevenue += amt;

  const bg = record.businessGroup;
  if (bg) {
    aggregated.provinces[prov].businessGroups[bg] = (aggregated.provinces[prov].businessGroups[bg] || 0) + amt;
    aggregated.locations[loc].businessGroups[bg] = (aggregated.locations[loc].businessGroups[bg] || 0) + amt;
  }
});

const result = {
  dailyRevenue,
  aggregated,
  targets
};

fs.writeFileSync(outputFile, JSON.stringify(result));
console.log('Data processing complete. Saved to', outputFile);
