const fs = require('fs');
const pdfjs = require('pdfjs-dist/legacy/build/pdf.js');

async function debugPdf() {
    const data = new Uint8Array(fs.readFileSync('tests/fixtures/Test_document.pdf'));
    const doc = await pdfjs.getDocument({ data }).promise;
    const page = await doc.getPage(1);
    const content = await page.getTextContent();

    // Look at the raw items for the first few
    console.log("=== RAW ITEMS ===");
    content.items.slice(0, 15).forEach(item => {
        console.log(`Str: "${item.str}" | Y: ${item.transform[5].toFixed(2)} | X: ${item.transform[4].toFixed(2)}`);
    });

    // Sort logic and see if it helps
    const items = content.items.filter(item => item.str && item.str.trim() !== '');
    items.sort((a, b) => {
        const yA = a.transform[5];
        const yB = b.transform[5];
        if (Math.abs(yA - yB) > 4) return yB - yA;
        return a.transform[4] - b.transform[4];
    });

    console.log("\n=== SORTED LOGIC ===");
    items.slice(0, 15).forEach(item => {
        console.log(`Str: "${item.str}" | Y: ${item.transform[5].toFixed(2)} | X: ${item.transform[4].toFixed(2)}`);
    });

    console.log("\n=== OLD APP.JS LOGIC ===");
    let output = '';
    // (Paste minimal version of old app.js parsing logic to see what it did)
    // ...
}
debugPdf().catch(console.error);
