const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

test('Debug ghostwords logic', async ({ page }) => {
    await page.goto('/');

    const filePath = path.resolve('D:/Documents/GitHub/GhostWords/Documents/Test_document.pdf');
    await page.setInputFiles('#fileInput', filePath);

    await expect(page.locator('#fileInfo')).toContainText('Test_document.pdf', { timeout: 10000 });
    await page.waitForSelector('.block');

    const debugLines = await page.evaluate(() => window.__debugPdfLines);
    const debugMarkdown = await page.evaluate(() => window.__debugPdfMarkdown);

    fs.writeFileSync('pdf_debug_output.json', debugLines);
    fs.writeFileSync('pdf_debug_markdown.txt', debugMarkdown);
});
