import { test, expect } from '@playwright/test';

test.describe('Phase 0 Baseline Suite', () => {
  test('loads home page and asserts title and security headers', async ({ page }) => {
    const response = await page.goto('/');
    expect(response).not.toBeNull();
    expect(response?.status()).toBe(200);

    // Verify security headers
    const headers = response!.headers();
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(headers['content-security-policy']).toBeDefined();
    expect(headers['permissions-policy']).toContain('camera=(self)');

    // Verify page content
    await expect(page.locator('h1')).toHaveText('BinBuddy');
  });

  test('GET /api/health returns valid schema', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.ok).toBe(true);
    expect(data.version).toBe('1.0.0');
    expect(data.rulesetId).toBe('houston-tx-curbside');
    expect(data.rulesetVersion).toBe('1.0.0');
    expect(data.draft).toBe(false);
    expect(data.providers).toBeDefined();
    expect(['live', 'demo']).toContain(data.providers.gemini);
    expect(data.time).toBeDefined();
  });
});
