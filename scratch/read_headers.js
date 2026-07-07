const xlsx = require('xlsx');
const path = require('path');

const filePath = path.join('..', 'ทำรายได้รายวันใหม่ (1).xlsx');
const workbook = xlsx.readFile(filePath);

const targetSheets = ['รส.201', 'Pickup', 'Summary ปันส่วน', 'Estimate ปันส่วน', 'Target'];

const result = {};

targetSheets.forEach(sheetName => {
    const sheet = workbook.Sheets[sheetName];
    if (sheet) {
        const json = xlsx.utils.sheet_to_json(sheet, { header: 1 });
        result[sheetName] = json.slice(0, 5); // get first 5 rows to understand header structure
    } else {
        result[sheetName] = "Sheet not found";
    }
});

console.log(JSON.stringify(result, null, 2));
