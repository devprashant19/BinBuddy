import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const PORT = 3099;

async function startServer() {
  console.log(`Starting production Next.js server on port ${PORT}...`);
  const server = spawn('npx', ['next', 'start', '-p', String(PORT)], {
    cwd: rootDir,
    shell: true,
    env: { ...process.env, PORT: String(PORT) },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  return new Promise(async (resolve, reject) => {
    let ready = false;
    server.stdout.on('data', (d) => {
      const s = d.toString();
      if (s.includes('Ready') || s.includes('started server') || s.includes('http://')) {
        if (!ready) {
          ready = true;
          resolve(server);
        }
      }
    });

    server.stderr.on('data', (d) => {
      // console.error(d.toString());
    });

    // Poll until HTTP port is responding
    let connected = false;
    for (let i = 0; i < 30; i++) {
      try {
        const res = await fetch(`http://localhost:${PORT}/api/health`);
        if (res.ok) {
          connected = true;
          break;
        }
      } catch {}
      await new Promise(r => setTimeout(r, 500));
    }
    if (!connected) throw new Error(`Server failed to start on port ${PORT}`);
    resolve(server);
  });
}

async function runBenchmark() {
  const server = await startServer();

  try {
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    console.log(`Navigating to http://localhost:${PORT}...`);
    const pageLoadStart = performance.now();
    await page.goto(`http://localhost:${PORT}`, { waitUntil: 'networkidle' });
    const pageReadyTime = performance.now();

    console.log(`Page ready in ${(pageReadyTime - pageLoadStart).toFixed(1)}ms. Waiting for sample buttons...`);
    
    // Find first sample fixture button
    const sampleButton = page.locator('button:has-text("Aluminum soda can"), button:has-text("Plastic water bottle"), [data-testid="fixture-button"]').first();
    await sampleButton.waitFor({ state: 'visible', timeout: 5000 });

    const tapStart = performance.now();
    await sampleButton.click();

    // Wait for the decision result sheet
    await page.waitForSelector('#destination-heading', { timeout: 15000 });
    const decidedTime = performance.now();

    const totalFromPageStart = (decidedTime - pageLoadStart).toFixed(1);
    const timeFromTapToDecision = (decidedTime - tapStart).toFixed(1);

    console.log(`\n========================================`);
    console.log(`[cold-start benchmark] Results:`);
    console.log(`  Page Load to Network Idle:  ${(pageReadyTime - pageLoadStart).toFixed(1)}ms`);
    console.log(`  Sample Tap to Decision:      ${timeFromTapToDecision}ms`);
    console.log(`  Total Cold Start to Result:  ${totalFromPageStart}ms`);
    console.log(`========================================\n`);

    const results = {
      pageLoadMs: Number((pageReadyTime - pageLoadStart).toFixed(1)),
      tapToDecisionMs: Number(timeFromTapToDecision),
      totalColdStartMs: Number(totalFromPageStart),
      sampleTested: 'Aluminum soda can',
      timestamp: new Date().toISOString()
    };

    fs.writeFileSync(path.join(rootDir, 'artifacts/cold-start.json'), JSON.stringify(results, null, 2));

    await browser.close();
  } finally {
    server.kill();
    try {
      process.kill(-server.pid);
    } catch {}
  }
}

runBenchmark().catch(err => {
  console.error(err);
  process.exit(1);
});
