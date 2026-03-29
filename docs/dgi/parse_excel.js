const XLSX = require('xlsx');
function parse(filename) {
    console.log(`\n\n=== PARSING: ${filename} ===`);
    const workbook = XLSX.readFile(filename);
    workbook.SheetNames.forEach(sheetName => {
        console.log(`\n-- Sheet: ${sheetName} --`);
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        // print first 20 rows to understand the structure
        json.slice(0, 20).forEach((row, i) => {
            if (row.length > 0) {
               console.log(`Row ${i}: ${row.join(' | ')}`);
            }
        });
    });
}
parse('DAS - DGI.xlsx');
parse('Déclaration ITS - DGI.xlsx');
