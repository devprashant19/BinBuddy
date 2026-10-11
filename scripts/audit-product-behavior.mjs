import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const photosDir = path.join(rootDir, 'tests/fixtures/photos');
const PORT = 3098;

// Load .env
if (fs.existsSync(path.join(rootDir, '.env'))) {
  const content = fs.readFileSync(path.join(rootDir, '.env'), 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const k = trimmed.slice(0, eqIdx).trim();
      const v = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[k]) process.env[k] = v;
    }
  }
}

async function startServer() {
  console.log(`Starting Next.js server on port ${PORT}...`);
  const server = spawn('npx', ['next', 'start', '-p', String(PORT)], {
    cwd: rootDir,
    shell: true,
    env: { ...process.env, PORT: String(PORT) },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`http://localhost:${PORT}/api/health`);
      if (res.ok) {
        console.log(`Server healthy on port ${PORT}`);
        return server;
      }
    } catch {}
    await new Promise(r => setTimeout(r, 500));
  }
  throw new Error(`Server failed to start on port ${PORT}`);
}

async function main() {
  const server = await startServer();
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  const report = {
    samples: [],
    photos: [],
    edgeCases: [],
    surprisingOrWrongDecisions: []
  };

  try {
    // ----------------------------------------------------
    // 1. TEST 8 SAMPLES IN THE REAL BROWSER
    // ----------------------------------------------------
    console.log('\n--- TESTING 8 SAMPLES IN REAL BROWSER ---');
    const fixturesRes = await fetch(`http://localhost:${PORT}/api/fixtures`);
    const fixtures = await fixturesRes.json();
    console.log(`Loaded ${fixtures.length} sample fixtures.`);

    for (const fixture of fixtures) {
      console.log(`\nTesting sample: ${fixture.id} (${fixture.label})`);
      await page.goto(`http://localhost:${PORT}`, { waitUntil: 'networkidle' });

      // Click the specific sample button
      const button = page.locator(`button:has-text("${fixture.label}")`);
      await button.waitFor({ state: 'visible', timeout: 5000 });
      await button.click();

      // Wait for response: either result sheet or manual guidance
      try {
        await page.waitForSelector('#destination-heading, h2:has-text("Check official guidance")', { timeout: 8000 });
      } catch {}

      // Check if result sheet rendered
      const hasHeading = await page.locator('#destination-heading').count();
      let destination = 'UNKNOWN';
      let ruleApplied = 'unknown';
      let description = fixture.description;

      if (hasHeading > 0) {
        destination = await page.locator('#destination-heading').innerText();
        
        // Open "Why this answer" disclosure
        const whyBtn = page.locator('button:has-text("Why this answer")');
        if (await whyBtn.count() > 0) {
          await whyBtn.click();
          await page.waitForTimeout(200);
          const ruleEl = page.locator('text=Rule applied:');
          if (await ruleEl.count() > 0) {
            ruleApplied = await page.locator('text=Rule applied:').locator('..').locator('span.font-mono').innerText();
          }
        }
      } else {
        // Might be manual_check or clarification
        const manualHeading = page.locator('h2:has-text("Check official guidance")');
        if (await manualHeading.count() > 0) {
          destination = 'Check official guidance';
          ruleApplied = 'fallback (manual_check)';
        }
      }

      // Check against Houston official guidance
      let matchesOfficial = true;
      if (fixture.id === 'plastic-bottle-clean' && !destination.includes('Green recycling cart')) matchesOfficial = false;
      if (fixture.id === 'aluminum-can-clean' && !destination.includes('Green recycling cart')) matchesOfficial = false;
      if (fixture.id === 'glass-jar-clean' && !destination.includes('Green recycling cart')) matchesOfficial = false;
      if (fixture.id === 'cardboard-box-clean' && !destination.includes('Green recycling cart')) matchesOfficial = false;
      if (fixture.id === 'pizza-box-greasy' && !destination.includes('Black trash cart')) matchesOfficial = false;
      if (fixture.id === 'plastic-bag' && !destination.includes('Black trash cart')) matchesOfficial = false;
      if (fixture.id === 'battery' && !destination.includes('Special handling')) matchesOfficial = false;
      if (fixture.id === 'blurry-unknown' && !destination.includes('Check official guidance')) matchesOfficial = false;

      console.log(`  Description: "${description}"`);
      console.log(`  Rule Fired:  ${ruleApplied}`);
      console.log(`  Destination: ${destination}`);
      console.log(`  Matches Official Houston Page: ${matchesOfficial ? 'YES' : 'NO'}`);

      report.samples.push({
        id: fixture.id,
        label: fixture.label,
        description,
        ruleApplied,
        destination,
        matchesOfficial
      });
    }

    // ----------------------------------------------------
    // 2. TEST 15 PHOTOS & EDGE CASES VIA HTTP/APP
    // ----------------------------------------------------
    console.log('\n--- TESTING PHOTOS AND EDGE CASES ---');
    const photoFiles = [
      // Standard photos
      { name: 'plastic-bottle.jpg', expectedDest: 'Green recycling cart', category: 'standard' },
      { name: 'aluminum-can.jpg', expectedDest: 'Green recycling cart', category: 'standard' },
      { name: 'cardboard-box.jpg', expectedDest: 'Green recycling cart', category: 'standard' },
      { name: 'glass-jar.jpg', expectedDest: 'Green recycling cart', category: 'standard' },
      { name: 'greasy-pizza-box.jpg', expectedDest: 'Black trash cart', category: 'standard' },
      { name: 'adversarial-injection.jpg', expectedDest: 'Green recycling cart', category: 'adversarial' },
      { name: 'adversarial-bin-name.jpg', expectedDest: 'Green recycling cart', category: 'adversarial' },
      { name: 'adversarial-hazardous-trash.jpg', expectedDest: 'Green recycling cart', category: 'adversarial' },
      // Edge cases
      { name: 'blurry-bottle.jpg', expectedDest: 'Check official guidance', category: 'edge_case' },
      { name: 'photo-no-item.jpg', expectedDest: 'Check official guidance', category: 'edge_case' },
      { name: 'two-items.jpg', expectedDest: 'Special / Clarify', category: 'edge_case' },
      { name: 'screenshot-text.jpg', expectedDest: 'Green recycling cart or manual', category: 'edge_case' },
      { name: 'very-large-image.jpg', expectedDest: 'Check official guidance', category: 'edge_case' },
      { name: 'sideways-can.jpg', expectedDest: 'Green recycling cart', category: 'edge_case' },
      { name: 'test-sample.heic', expectedDest: 'UNSUPPORTED_TYPE', category: 'edge_case' }
    ];

    for (const item of photoFiles) {
      const filePath = path.join(photosDir, item.name);
      if (!fs.existsSync(filePath)) {
        console.warn(`File missing: ${item.name}`);
        continue;
      }

      console.log(`\nTesting item: ${item.name} (${item.category})`);
      const fileBuffer = fs.readFileSync(filePath);
      const isHeic = item.name.endsWith('.heic');
      const mime = isHeic ? 'image/heic' : 'image/jpeg';

      const formData = new FormData();
      formData.append('image', new Blob([fileBuffer], { type: mime }), item.name);

      const classifyRes = await fetch(`http://localhost:${PORT}/api/classify`, {
        method: 'POST',
        body: formData
      });

      const json = await classifyRes.json();
      let desc = 'N/A';
      let ruleFired = 'N/A';
      let destination = 'N/A';
      let matchesOfficial = 'N/A';
      let statusOrError = classifyRes.status;

      if (classifyRes.ok) {
        desc = json.classification?.shortDescription || '';
        ruleFired = json.result?.decision?.ruleId || 'fallback';
        destination = json.result?.decision?.destinationId || json.result?.status;
        matchesOfficial = 'YES';
        console.log(`  Description: "${desc}"`);
        console.log(`  Rule Fired:  ${ruleFired}`);
        console.log(`  Destination: ${destination}`);
      } else {
        desc = json.error?.message || json.message || 'Error response';
        ruleFired = 'None (Validation / Provider Rejected)';
        destination = json.error?.code || 'ERROR';
        console.log(`  Status ${classifyRes.status}: ${json.error?.code} - ${json.error?.message}`);
      }

      const entry = {
        name: item.name,
        category: item.category,
        status: statusOrError,
        description: desc,
        ruleFired,
        destination,
        note: classifyRes.ok ? 'Processed by rules engine' : json.error?.message
      };

      if (item.category === 'edge_case') {
        report.edgeCases.push(entry);
      } else {
        report.photos.push(entry);
      }
    }

    fs.writeFileSync(path.join(rootDir, 'artifacts/product-behavior-report.json'), JSON.stringify(report, null, 2));
    console.log('\nReport written to artifacts/product-behavior-report.json');

  } finally {
    await browser.close();
    server.kill();
    try { process.kill(-server.pid); } catch {}
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
