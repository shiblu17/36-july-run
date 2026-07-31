const fs = require('fs');
const path = require('path');

// Read sheet2.csv
const sheet2Path = path.join(__dirname, 'sheet2.csv');
const sheet2Content = fs.readFileSync(sheet2Path, 'utf8');

// Parse CSV lines handling double quotes and commas inside them
function parseCSV(content) {
    const lines = content.split(/\r?\n/);
    const result = [];
    
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

const rows = parseCSV(sheet2Content);
console.log(`Parsed ${rows.length} rows from Sheet2.`);

const registrations = [];

rows.forEach((row) => {
    // Columns in sheet2.csv:
    // 0: Name
    // 1: Email
    // 2: Phone Number
    // 3: Size
    // 4: BIB NUMBER
    
    const name = (row[0] || "").trim();
    const email = (row[1] || "").trim();
    const phone = (row[2] || "").trim();
    const size = (row[3] || "").trim();
    const bib = (row[4] || "").trim();
    
    registrations.push({
        tx: "", // No transaction ID in Sheet2
        name: name,
        email: email,
        phone: phone,
        size: size,
        bib: bib,
        verify: "YES" // All records in Sheet2 are verified
    });
});

// Sort by BIB ascending
registrations.sort((a, b) => parseInt(a.bib) - parseInt(b.bib));

// Generate data.js content with version string
let fileContent = `const dbVersion = "${Date.now()}";\nconst registrations = [\n`;
registrations.forEach((runner, idx) => {
    const comma = idx === registrations.length - 1 ? "" : ",";
    fileContent += `  { tx: ${JSON.stringify(runner.tx)}, name: ${JSON.stringify(runner.name)}, email: ${JSON.stringify(runner.email)}, phone: ${JSON.stringify(runner.phone)}, size: ${JSON.stringify(runner.size)}, bib: ${JSON.stringify(runner.bib)}, verify: ${JSON.stringify(runner.verify)} }${comma}\n`;
});
fileContent += `];\n\nif (typeof module !== 'undefined') {\n  module.exports = registrations;\n}\n`;

// Write to data.js
const outputPath = path.join(__dirname, 'data.js');
fs.writeFileSync(outputPath, fileContent, 'utf8');

console.log(`Generated data.js successfully with a total of ${registrations.length} registrations from Sheet2.`);
