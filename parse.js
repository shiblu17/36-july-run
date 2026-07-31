const fs = require('fs');
const path = require('path');

// Read sheet.csv
const csvPath = path.join(__dirname, 'sheet.csv');
const csvContent = fs.readFileSync(csvPath, 'utf8');

// Parse CSV lines handling double quotes and commas inside them
function parseCSV(content) {
    const lines = content.split(/\r?\n/);
    const result = [];
    
    // Skip header line
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const row = [];
        let inQuotes = false;
        let currentValue = '';
        
        for (let j = 0; j < line.length; j++) {
            const char = line[j];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                row.push(currentValue.trim());
                currentValue = '';
            } else {
                currentValue += char;
            }
        }
        row.push(currentValue.trim());
        result.push(row);
    }
    return result;
}

const rows = parseCSV(csvContent);
console.log(`Parsed ${rows.length} rows.`);

let bibCounter = 501;
const registrations = [];

rows.forEach((row, index) => {
    // Columns mapping:
    // 0: Timestamp
    // 1: Transaction ID / Bkash detail
    // 2: Name
    // 3: Dept/Batch
    // 4: Hall
    // 5: Email
    // 6: Phone Number
    // 7: Size
    // 8: Comments
    // 9: Verify (YES or NO)
    
    const txRaw = row[1] || "";
    const name = row[2] || "Unnamed Runner";
    const email = row[5] || "";
    const phone = row[6] || "";
    const size = row[7] || "L";
    const verify = (row[9] || "").toUpperCase().trim();
    
    // Extract a clean transaction ID from the raw input if it's long, or keep it
    let tx = txRaw;
    if (txRaw.length > 20) {
        // Try to find a transaction ID pattern (usually letters and numbers, e.g. DGI0H5BKSE)
        const match = txRaw.match(/[A-Z0-9]{8,12}/i);
        if (match) {
            tx = match[0];
        }
    }
    
    // Assign BIB if verified
    let bib = "";
    if (verify === "YES") {
        bib = bibCounter.toString();
        bibCounter++;
    }
    
    registrations.push({
        tx: tx,
        name: name,
        email: email,
        phone: phone,
        size: size,
        bib: bib,
        verify: verify // Add verify status (YES or NO)
    });
});

// Sort by BIB ascending for verified ones, then unverified ones
registrations.sort((a, b) => {
    if (a.bib && b.bib) return parseInt(a.bib) - parseInt(b.bib);
    if (a.bib) return -1;
    if (b.bib) return 1;
    return 0;
});

// Generate data.js content
let fileContent = `const registrations = [\n`;
registrations.forEach((runner, idx) => {
    const comma = idx === registrations.length - 1 ? "" : ",";
    fileContent += `  { tx: ${JSON.stringify(runner.tx)}, name: ${JSON.stringify(runner.name)}, email: ${JSON.stringify(runner.email)}, phone: ${JSON.stringify(runner.phone)}, size: ${JSON.stringify(runner.size)}, bib: ${JSON.stringify(runner.bib)}, verify: ${JSON.stringify(runner.verify)} }${comma}\n`;
});
fileContent += `];\n\nif (typeof module !== 'undefined') {\n  module.exports = registrations;\n}\n`;

// Write to data.js
const outputPath = path.join(__dirname, 'data.js');
fs.writeFileSync(outputPath, fileContent, 'utf8');

console.log(`Generated data.js successfully with ${registrations.length} registrations.`);
console.log(`Last BIB Number assigned: ${bibCounter - 1}`);
