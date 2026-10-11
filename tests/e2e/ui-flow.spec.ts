import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Phase 3 Complete UI Suite', () => {
  test('Sample flow: selects sample fixture to reach decided result sheet and disclosure', async ({
    page,
  }) => {
    await page.goto('/');

    // 1. Initial empty state checks
    await expect(page.locator('text=Find the right bin')).toBeVisible();
    await expect(page.locator('#demo-mode-chip')).toBeVisible();

    // 2. Click "Plastic Water Bottle" sample
    const sampleBtn = page.locator('button:has-text("Plastic Water Bottle")');
    await expect(sampleBtn).toBeVisible();
    await sampleBtn.click();

    // 3. Verify ResultSheet appears with destination heading
    const heading = page.locator('#destination-heading');
    await expect(heading).toBeVisible();
    await expect(heading).toContainText(/RECYCLING/i);

    // 4. Focus moves to destination heading
    await expect(heading).toBeFocused();

    // 5. Check reason and buttons
    await expect(page.locator('text=Why this answer')).toBeVisible();
    await expect(page.locator('button:has-text("Try another")')).toBeVisible();
    await expect(page.locator('button:has-text("I sorted it")')).toBeVisible();

    // 6. Expand "Why this answer" disclosure
    await page.click('button:has-text("Why this answer")');
    await expect(page.locator('text=Official source:')).toBeVisible();
    await expect(page.locator('text=Rule applied:')).toBeVisible();

    // 7. Click "Try another" resets state
    await page.click('button:has-text("Try another")');
    await expect(page.locator('text=Find the right bin')).toBeVisible();
  });

  test('Upload flow: uploads generated PNG and resolves to decided result', async ({ page }) => {
    await page.goto('/');

    // Create a tiny 1x1 valid PNG in memory
    const pngBuffer = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44,
      0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f,
      0x15, 0xc4, 0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00,
      0x01, 0x00, 0x00, 0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
      0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
    ]);

    const uploadInput = page.locator('input[data-testid="upload-input"]');
    await uploadInput.setInputFiles({
      name: 'test-item.png',
      mimeType: 'image/png',
      buffer: pngBuffer,
    });

    // Verifies destination heading resolves
    await expect(page.locator('#destination-heading')).toBeVisible();
  });

  test('Manual picker flow: user selects material and condition manually', async ({ page }) => {
    await page.goto('/');

    await page.click('text=Pick it yourself');
    await expect(page.locator('text=Pick the item yourself')).toBeVisible();

    // Select Glass, Clean
    await page.click('button:has-text("Glass")');
    await page.click('button:has-text("Clean & empty")');

    await page.click('button:has-text("Find bin")');

    // Should resolve to recycling cart
    const heading = page.locator('#destination-heading');
    await expect(heading).toBeVisible();
    await expect(heading).toContainText(/RECYCLING/i);
    await expect(page.locator('text=Source:').locator('..')).toContainText('manual');
  });

  test('Clarification flow: answering question disambiguates item or manual check on uncertainty', async ({
    page,
  }) => {
    await page.goto('/');

    // Click "Blurry Item" fixture (confidence 0.28)
    await page.click('button:has-text("Blurry Item")');

    // Should trigger clarification
    await expect(page.locator('text=Need clarification')).toBeVisible();
    await expect(page.locator('text=What is this item mostly made of?')).toBeVisible();

    // Select "Not sure" -> should navigate directly to Manual Check panel
    await page.click('button:has-text("Not sure")');
    await expect(page.locator('#destination-heading')).toContainText(/MANUAL/i);
    await expect(page.locator('text=Check city guidance')).toBeVisible();

    // "Pick it yourself" recovery action from manual check works
    await page.click('button:has-text("Pick it yourself")');
    await expect(page.locator('text=Pick the item yourself')).toBeVisible();
  });

  test('Accessibility and responsive tests: axe zero critical violations & 320px width no overflow', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 600 });
    await page.goto('/');

    // Check no horizontal scroll at 320px
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1); // 1px tolerance for rounding

    // Axe audit on empty state
    const axeResultsEmpty = await new AxeBuilder({ page }).analyze();
    const criticalViolations = axeResultsEmpty.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );
    expect(criticalViolations).toEqual([]);

    // Trigger sample to test ResultSheet state with Axe
    await page.click('button:has-text("Soda Can")');
    await expect(page.locator('#destination-heading')).toBeVisible();

    const axeResultsResult = await new AxeBuilder({ page }).analyze();
    const resultViolations = axeResultsResult.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );
    expect(resultViolations).toEqual([]);
  });

  test('Keyboard accessibility: entire main flow navigates without pointer', async ({ page }) => {
    await page.goto('/');

    // Focus sample button and activate via keyboard Enter
    const sampleBtn = page.locator('button:has-text("Plastic Water Bottle")');
    await expect(sampleBtn).toBeVisible();
    await sampleBtn.focus();
    await sampleBtn.press('Enter');

    await expect(page.locator('#destination-heading')).toBeVisible();
    await expect(page.locator('#destination-heading')).toBeFocused();
  });
});
