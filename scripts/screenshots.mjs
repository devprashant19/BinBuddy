import { chromium } from '@playwright/test';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

let BASE_URL = process.env.BASE_URL;
let serverProcess = null;

async function waitForServer(url, timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${url}/api/health`);
      if (res.ok) return true;
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  return false;
}

const VIEWPORTS = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 800 },
];

const outDir = path.resolve(process.cwd(), 'artifacts/screenshots/phase-3');
fs.mkdirSync(outDir, { recursive: true });

try {
  if (!BASE_URL) {
    const testPort = 3007;
    BASE_URL = `http://127.0.0.1:${testPort}`;
    console.log(`[screenshots] Starting production server on port ${testPort}...`);

    serverProcess = spawn('npx', ['next', 'start', '-p', String(testPort)], {
      shell: true,
      stdio: 'pipe',
      env: { ...process.env, PORT: String(testPort), NODE_ENV: 'production' },
    });

    const ready = await waitForServer(BASE_URL);
    if (!ready) {
      throw new Error(`Timed out waiting for production server on ${BASE_URL}`);
    }
  }

  console.log(`[screenshots] Capturing UI states across 3 viewports against ${BASE_URL}...`);

  const browser = await chromium.launch();

  for (const vp of VIEWPORTS) {
    console.log(`[screenshots] Capturing ${vp.name} (${vp.width}x${vp.height})...`);
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });

    // 1. Empty state
    await page.goto(BASE_URL);
    await page.waitForSelector('text=Find the right bin');
    await page.screenshot({ path: path.join(outDir, `${vp.name}-01-empty.png`) });

    // 2. Manual picker state
    await page.click('text=Pick it yourself');
    await page.waitForSelector('text=Pick the item yourself');
    await page.screenshot({ path: path.join(outDir, `${vp.name}-02-manual-picker.png`) });

    // 3. Decided state (via sample)
    await page.goto(BASE_URL);
    await page.waitForSelector('button:has-text("Plastic Water Bottle")');
    await page.click('button:has-text("Plastic Water Bottle")');
    await page.waitForSelector('#destination-heading');
    await page.screenshot({ path: path.join(outDir, `${vp.name}-03-decided.png`) });

    // 4. Clarification state (via blurry fixture)
    await page.goto(BASE_URL);
    await page.waitForSelector('button:has-text("Blurry Item")');
    await page.click('button:has-text("Blurry Item")');
    await page.waitForSelector('text=Need clarification');
    await page.screenshot({ path: path.join(outDir, `${vp.name}-04-clarification.png`) });

    // 5. Manual check state (answering "Not sure")
    await page.click('button:has-text("Not sure")');
    await page.waitForSelector('text=Manual check');
    await page.screenshot({ path: path.join(outDir, `${vp.name}-05-manual-check.png`) });

    await page.close();
  }

  await browser.close();
  console.log(`[screenshots] Successfully generated all screenshots in ${outDir}`);
} finally {
  if (serverProcess) {
    console.log('[screenshots] Stopping server...');
    serverProcess.kill('SIGTERM');
  }
}

process.exit(0);
