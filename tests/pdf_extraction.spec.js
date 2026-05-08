const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('GhostWords PDF Extraction', () => {
    test('loads a PDF and verifies titles and paragraphs are formatted', async ({ page }) => {
        // Navigate to the app
        await page.goto('/');

        // Wait for the app to be fully ready
        await expect(page.locator('.brand strong')).toHaveText('GhostWords');

        // Make sure empty state is there
        await expect(page.locator('.empty-state')).toBeVisible();

        // Prepare the fake upload
        const filePath = path.resolve(__dirname, 'fixtures', 'Test_document.pdf');

        // Upload the file
        // The input is hidden, so we must force set the files or use page.setInputFiles
        await page.setInputFiles('#fileInput', filePath);

        // Wait for the document to be parsed and rendered
        // The loader changes text to 'Cargando Test_document.pdf...'
        await expect(page.locator('#fileInfo')).toContainText('Test_document.pdf');

        // Wait for reader blocks to appear
        await expect(page.locator('.block').first()).toBeVisible({ timeout: 10000 });

        // Assert that the formatting created headings (H1 or H2). 
        // This confirms our font-size threshold logic is working.
        const headings = page.locator('.block h1, .block h2, .block h3');
        const headingCount = await headings.count();
        expect(headingCount).toBeGreaterThan(0);

        // Assert that there are regular paragraphs mapped from the PDF text
        const paragraphs = page.locator('.block p');
        const paragraphCount = await paragraphs.count();
        expect(paragraphCount).toBeGreaterThan(0);

        // Ensure ghost-words were generated
        const ghostWords = page.locator('.ghost-word');
        const ghostCount = await ghostWords.count();
        expect(ghostCount).toBeGreaterThan(0);

        // Optional: Log success information
        console.log(`Successfully verified ${headingCount} headings, ${paragraphCount} paragraphs, and ${ghostCount} ghosted words.`);
    });
});
