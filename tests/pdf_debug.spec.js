const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

test('Dump reader HTML', async ({ page }) => {
    await page.goto('/');

    const filePath = path.resolve('D:/Documents/GitHub/GhostWords/Documents/Test_document.pdf');
    await page.setInputFiles('#fileInput', filePath);

    await expect(page.locator('#fileInfo')).toContainText('Test_document.pdf', { timeout: 10000 });
    await page.waitForSelector('.block');

    const blocksCount = await page.locator('.block').count();
    console.log('Total blocks rendered:', blocksCount);

    const html = await page.locator('#reader').evaluate(el => el.innerHTML);
    fs.writeFileSync('reader_html_dump.html', html);
});
