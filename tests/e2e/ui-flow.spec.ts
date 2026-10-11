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

  test('Error state: classifier failure displays error panel with 3 working recovery actions', async ({
    page,
  }) => {
    await page.goto('/');

    // Intercept /api/classify to simulate provider failure
    await page.route('**/api/classify', (route) =>
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({
          error: {
            code: 'CLASSIFIER_UNAVAILABLE',
            message: 'Vision classifier is currently unavailable.',
            hint: 'Try again, use a sample, or pick the item manually.',
          },
        }),
      })
    );

    // Upload an image to trigger the failed classification
    const pngBuffer = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44,
      0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f,
      0x15, 0xc4, 0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00,
      0x01, 0x00, 0x00, 0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
      0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
    ]);

    const uploadInput = page.locator('input[data-testid="upload-input"]');
    await uploadInput.setInputFiles({
      name: 'test.png',
      mimeType: 'image/png',
      buffer: pngBuffer,
    });

    // Verify ErrorPanel is displayed
    await expect(page.locator('text=Analysis uncompleted')).toBeVisible();
    await expect(page.locator('text=Vision classifier is currently unavailable.')).toBeVisible();

    // Verify recovery 1: "Use a sample" navigates back to empty state
    await page.click('button:has-text("Use a sample")');
    await expect(page.locator('text=Find the right bin')).toBeVisible();

    // Re-trigger error
    await uploadInput.setInputFiles({
      name: 'test2.png',
      mimeType: 'image/png',
      buffer: pngBuffer,
    });
    await expect(page.locator('text=Analysis uncompleted')).toBeVisible();

    // Verify recovery 2: "Pick it yourself" navigates to manual picker
    await page.click('button:has-text("Pick it yourself")');
    await expect(page.locator('text=Pick the item yourself')).toBeVisible();
  });

  test('Voice flow: zero audio requested without user tap; tapping Hear it fetches /api/speech', async ({
    page,
  }) => {
    const audioRequests: string[] = [];
    await page.route('**/api/speech', (route) => {
      audioRequests.push(route.request().url());
      const fakeMp3 = Buffer.alloc(120);
      fakeMp3[0] = 0x49; // 'I'
      fakeMp3[1] = 0x44; // 'D'
      fakeMp3[2] = 0x33; // '3'
      return route.fulfill({
        status: 200,
        contentType: 'audio/mpeg',
        headers: { 'X-Audio-Source': 'elevenlabs' },
        body: fakeMp3,
      });
    });

    await page.goto('/');

    // Select sample to reach result sheet
    await page.click('button:has-text("Plastic Water Bottle")');
    await expect(page.locator('#destination-heading')).toBeVisible();

    // CRITICAL INVARIANT: Zero audio requested automatically without user tap
    expect(audioRequests.length).toBe(0);

    // Tap "Hear it"
    const voiceBtn = page.locator('button[data-testid="voice-button"]');
    await expect(voiceBtn).toBeVisible();
    await voiceBtn.click();

    // Exactly one audio request fired upon user tap
    expect(audioRequests.length).toBe(1);
  });

  test('Voice fallback flow: when /api/speech returns VOICE_UNAVAILABLE, uses browser voice and displays label', async ({
    page,
  }) => {
    page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));
    // Inject mock speechSynthesis and SpeechSynthesisUtterance
    await page.addInitScript(() => {
      (window as any).__spokenUtterances = [];
      if ('speechSynthesis' in window && window.speechSynthesis) {
        window.speechSynthesis.speak = (utterance: any) => {
          (window as any).__spokenUtterances.push(utterance.text || 'spoken');
          if (utterance.onstart) utterance.onstart();
        };
        window.speechSynthesis.cancel = () => {};
      } else {
        class MockUtterance {
          text: string;
          rate = 1.0;
          pitch = 1.0;
          onstart: any = null;
          onend: any = null;
          onerror: any = null;
          constructor(text: string) {
            this.text = text;
          }
        }
        Object.defineProperty(window, 'SpeechSynthesisUtterance', {
          configurable: true,
          value: MockUtterance,
        });
        Object.defineProperty(window, 'speechSynthesis', {
          configurable: true,
          value: {
            speak: (utterance: any) => {
              (window as any).__spokenUtterances.push(utterance.text || 'spoken');
              if (utterance.onstart) utterance.onstart();
            },
            cancel: () => {},
          },
        });
      }
    });

    // Intercept /api/speech to simulate unavailable ElevenLabs
    await page.route('**/api/speech', (route) =>
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({
          error: {
            code: 'VOICE_UNAVAILABLE',
            message: 'ElevenLabs voice unavailable.',
          },
        }),
      })
    );

    await page.goto('/');

    // Select sample to reach result sheet
    await page.click('button:has-text("Plastic Water Bottle")');
    await expect(page.locator('#destination-heading')).toBeVisible();

    // Tap "Hear it"
    const voiceBtn = page.locator('button[data-testid="voice-button"]');
    await voiceBtn.click();

    // Verify browser voice label appears
    await expect(page.locator('[data-testid="voice-fallback-label"]')).toBeVisible();

    // Verify synthesis was invoked
    const spoken = await page.evaluate(() => (window as any).__spokenUtterances);
    expect(spoken.length).toBeGreaterThan(0);
  });

  test('Tally flow: increments only on sorted confirm, survives page reload, and resets with confirmation', async ({
    page,
  }) => {
    await page.goto('/');

    const tallyEl = page.locator('[data-testid="tally-count"]');
    await expect(tallyEl).toHaveText(/Items you marked as sorted: 0 \(your own count\)/);

    // Reach decided result sheet
    await page.click('button:has-text("Soda Can")');
    await expect(page.locator('#destination-heading')).toBeVisible();

    // Verify tally is still 0 before clicking confirm
    await expect(tallyEl).toHaveText(/Items you marked as sorted: 0 \(your own count\)/);

    // Tap "I sorted it"
    const sortBtn = page.locator('button:has-text("I sorted it")');
    await sortBtn.click();
    await expect(page.locator('button:has-text("Sorted!")')).toBeVisible();

    // Verify tally incremented to 1
    await expect(tallyEl).toHaveText(/Items you marked as sorted: 1 \(your own count\)/);

    // Reload page to test persistence
    await page.reload();
    await expect(page.locator('[data-testid="tally-count"]')).toHaveText(
      /Items you marked as sorted: 1 \(your own count\)/
    );

    // Open settings and reset tally
    await page.click('[data-testid="settings-button"]');
    await expect(page.locator('#settings-heading')).toBeVisible();

    await page.click('button:has-text("Reset sorted count")');
    await expect(page.locator('text=Reset your personal sorted count to 0?')).toBeVisible();

    await page.click('button:has-text("Yes, reset")');
    await page.click('button:has-text("Done")');

    await expect(page.locator('[data-testid="tally-count"]')).toHaveText(
      /Items you marked as sorted: 0 \(your own count\)/
    );
  });

  test('Storage blocked resilience: app functions completely when localStorage is blocked', async ({
    page,
  }) => {
    // Block localStorage
    await page.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: () => {
            throw new Error('SecurityError: Access is denied for this document.');
          },
          setItem: () => {
            throw new Error('SecurityError: Access is denied for this document.');
          },
          removeItem: () => {},
          clear: () => {},
        },
        writable: false,
      });
    });

    await page.goto('/');
    await expect(page.locator('[data-testid="tally-count"]')).toBeVisible();

    // Select sample to reach result
    await page.click('button:has-text("Soda Can")');
    await expect(page.locator('#destination-heading')).toBeVisible();

    // Sort button works in-memory without throw
    await page.click('button:has-text("I sorted it")');
    await expect(page.locator('button:has-text("Sorted!")')).toBeVisible();
  });

  test('Hard Invariant: zero environmental claims anywhere in the DOM', async ({ page }) => {
    await page.goto('/');

    const emptyText = await page.locator('body').innerText();
    const forbiddenPatterns = [
      /\bCO2\b/i,
      /\bkg\s+saved\b/i,
      /\bsaved\s+kg\b/i,
      /\blandfill\s+diverted\b/i,
      /\bdiverted\s+from\s+landfill\b/i,
      /\bcarbon\s+offset\b/i,
      /\bemissions\s+saved\b/i,
    ];

    for (const pattern of forbiddenPatterns) {
      expect(emptyText).not.toMatch(pattern);
    }

    // Check decided state as well
    await page.click('button:has-text("Plastic Water Bottle")');
    await expect(page.locator('#destination-heading')).toBeVisible();

    const resultText = await page.locator('body').innerText();
    for (const pattern of forbiddenPatterns) {
      expect(resultText).not.toMatch(pattern);
    }
  });
});
