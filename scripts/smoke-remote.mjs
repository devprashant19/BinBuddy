const targetUrl = process.argv[2] || process.env.APP_URL || 'http://localhost:3000';
const baseUrl = targetUrl.replace(/\/+$/, '');

console.log(`\n========================================`);
console.log(`[smoke-remote] Testing deployment at: ${baseUrl}`);
console.log(`========================================\n`);

let passedCount = 0;
let totalChecks = 0;

async function check(name, fn) {
  totalChecks++;
  const t0 = Date.now();
  try {
    await fn();
    const duration = Date.now() - t0;
    console.log(`  ✓ ${name} (${duration}ms)`);
    passedCount++;
  } catch (err) {
    const duration = Date.now() - t0;
    console.error(`  ✗ ${name} (${duration}ms): ${err.message}`);
  }
}

// 1. Root page & Security Headers
await check('GET / responds 200 and serves security headers', async () => {
  const res = await fetch(`${baseUrl}/`);
  if (!res.ok) throw new Error(`Expected 200, got ${res.status}`);

  const nosniff = res.headers.get('x-content-type-options');
  if (nosniff !== 'nosniff') throw new Error(`Missing or invalid X-Content-Type-Options: ${nosniff}`);

  const xframe = res.headers.get('x-frame-options');
  if (xframe !== 'DENY') throw new Error(`Missing or invalid X-Frame-Options: ${xframe}`);

  const csp = res.headers.get('content-security-policy');
  if (!csp || !csp.includes("default-src 'self'")) throw new Error(`Missing or invalid CSP: ${csp}`);
});

// 2. Health endpoint
let healthData = null;
await check('GET /api/health returns valid schema', async () => {
  const res = await fetch(`${baseUrl}/api/health`);
  if (!res.ok) throw new Error(`Expected 200, got ${res.status}`);
  healthData = await res.json();
  if (healthData.status !== 'ok') throw new Error(`Expected status: ok, got: ${healthData.status}`);
  if (!healthData.providers) throw new Error('Missing providers in health check');
});

// 3. Rules endpoint
await check('GET /api/rules returns municipal ruleset', async () => {
  const res = await fetch(`${baseUrl}/api/rules`);
  if (!res.ok) throw new Error(`Expected 200, got ${res.status}`);
  const rules = await res.json();
  if (!Array.isArray(rules.destinations) || rules.destinations.length === 0) {
    throw new Error('Destinations list is empty');
  }
  if (!rules.city?.name) throw new Error('Missing city metadata in rules');
});

// 4. Classification endpoint with sample fixture
await check('POST /api/classify evaluates sample fixture correctly', async () => {
  const res = await fetch(`${baseUrl}/api/classify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fixtureId: 'plastic-bottle-clean' }),
  });
  if (!res.ok) throw new Error(`Expected 200, got ${res.status}`);
  const data = await res.json();
  if (data.result?.status !== 'decided') {
    throw new Error(`Expected status decided, got: ${data.result?.status}`);
  }
});

// 5. Bad input handling
await check('POST /api/classify rejects unknown fixture with 400 BAD_REQUEST', async () => {
  const res = await fetch(`${baseUrl}/api/classify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fixtureId: 'unknown_fake_fixture_123' }),
  });
  if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
  const data = await res.json();
  if (data.error?.code !== 'BAD_REQUEST') {
    throw new Error(`Expected error code BAD_REQUEST, got: ${data.error?.code}`);
  }
});

// 6. Speech endpoint contract
await check('POST /api/speech returns audio or expected voice status', async () => {
  const res = await fetch(`${baseUrl}/api/speech`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ruleId: 'metal-can-clean', rulesetVersion: '1.0.0' }),
  });

  if (res.ok) {
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('audio')) {
      throw new Error(`Expected audio Content-Type, got ${contentType}`);
    }
  } else if (res.status === 503) {
    // Valid graceful fallback status when ElevenLabs credentials/credits are unavailable
    const err = await res.json();
    if (err.error?.code !== 'VOICE_UNAVAILABLE') {
      throw new Error(`Expected VOICE_UNAVAILABLE on 503, got ${err.error?.code}`);
    }
  } else {
    throw new Error(`Unexpected speech response status: ${res.status}`);
  }
});

console.log('\n========================================');
console.log(`[smoke-remote] Results: ${passedCount} / ${totalChecks} checks passed`);
console.log('========================================\n');

if (passedCount < totalChecks) {
  console.error('[smoke-remote] FAILED: Some checks did not pass.');
  process.exit(1);
}

console.log('[smoke-remote] PASSED: Remote deployment is healthy and verified.');
process.exit(0);
