const fs = require('fs');
const path = require('path');

// Read files
const verifiedPath = path.join(__dirname, 'verified.csv');
const sheetPath = path.join(__dirname, 'sheet.csv');

const verifiedContent = fs.readFileSync(verifiedPath, 'utf8');
const sheetContent = fs.readFileSync(sheetPath, 'utf8');

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

const verifiedRows = parseCSV(verifiedContent);
const sheetRows = parseCSV(sheetContent);

console.log(`Parsed ${verifiedRows.length} verified rows.`);
console.log(`Parsed ${sheetRows.length} total form response rows.`);

const registrations = [];
const verifiedPhones = new Set();

// 1. Process Verified List
verifiedRows.forEach((row) => {
    // 0: Transaction ID
    // 1: Name
    // 2: Email
    // 3: Phone Number
    // 4: Size
    // 5: BIB NUMBER
    
    const tx = (row[0] || "").trim();
    const name = (row[1] || "").trim();
    const email = (row[2] || "").trim();
    const phone = (row[3] || "").trim();
    const size = (row[4] || "").trim();
    const bib = (row[5] || "").trim();
    
    registrations.push({
        tx: tx,
        name: name,
        email: email,
        phone: phone,
        size: size,
        bib: bib,
        verify: "YES"
    });
    
    // Add cleaned phone to set to prevent duplicate entry for pending search
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone) {
        verifiedPhones.add(cleanPhone);
    }
});

// 2. Process Form Responses (for Pending Verification Status)
let pendingCount = 0;
sheetRows.forEach((row) => {
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
    
    const txRaw = (row[1] || "").trim();
    const name = (row[2] || "").trim();
    const email = (row[5] || "").trim();
    const phone = (row[6] || "").trim();
    const size = (row[7] || "").trim();
    const verify = (row[9] || "NO").toUpperCase().trim();
    
    const cleanPhone = phone.replace(/\D/g, "");
    
    // If the phone is NOT in the verified list, they are pending
    if (cleanPhone && !verifiedPhones.has(cleanPhone)) {
        // Clean Transaction ID
        let tx = txRaw;
        if (txRaw.length > 20) {
            const match = txRaw.match(/[A-Z0-9]{8,12}/i);
            if (match) tx = match[0];
        }
        
        registrations.push({
            tx: tx,
            name: name,
            email: email,
            phone: phone,
            size: size,
            bib: "",
            verify: "NO"
        });
        pendingCount++;
    }
});

console.log(`Added ${pendingCount} pending/unverified registrations.`);

// Sort by BIB ascending for verified ones, then pending ones
registrations.sort((a, b) => {
    if (a.bib && b.bib) return parseInt(a.bib) - parseInt(b.bib);
    if (a.bib) return -1;
    if (b.bib) return 1;
    // Both pending, sort by name
    return a.name.localeCompare(b.name);
});

// Generate data.js content
let fileContent = `const dbVersion = "${Date.now()}";\nconst registrations = [\n`;
registrations.forEach((runner, idx) => {
    const comma = idx === registrations.length - 1 ? "" : ",";
    fileContent += `  { tx: ${JSON.stringify(runner.tx)}, name: ${JSON.stringify(runner.name)}, email: ${JSON.stringify(runner.email)}, phone: ${JSON.stringify(runner.phone)}, size: ${JSON.stringify(runner.size)}, bib: ${JSON.stringify(runner.bib)}, verify: ${JSON.stringify(runner.verify)} }${comma}\n`;
});
fileContent += `];\n\nif (typeof module !== 'undefined') {\n  module.exports = registrations;\n}\n`;

// Write to data.js
const outputPath = path.join(__dirname, 'data.js');
fs.writeFileSync(outputPath, fileContent, 'utf8');

console.log(`Generated data.js successfully with a total of ${registrations.length} registrations.`);
console.log(`- Verified (with official BIB numbers): ${verifiedRows.length}`);
console.log(`- Pending (without BIB numbers): ${pendingCount}`);
