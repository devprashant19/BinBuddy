import { spawn } from 'child_process';
import http from 'http';

let BASE_URL = process.env.BASE_URL;
let serverProcess = null;

async function waitForServer(url, timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${url}/api/health`);
      if (res.ok) return true;
    } catch {
      // wait and retry
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  return false;
}

function assertNoLeaks(text, context) {
  if (
    text.includes('at Object.') ||
    text.includes('at async') ||
    text.includes('node_modules') ||
    text.includes('E:\\BinBuddy') ||
    text.includes('C:\\Users')
  ) {
    throw new Error(`Security leak detected in ${context}: stack trace or internal path exposed.`);
  }
}

try {
  if (!BASE_URL) {
    const testPort = 3006;
    BASE_URL = `http://127.0.0.1:${testPort}`;
    console.log(`[check-api] Starting production server on port ${testPort}...`);

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

  console.log(`[check-api] Executing API contract test suite against ${BASE_URL}...`);

  // 1. GET /api/health
  const healthRes = await fetch(`${BASE_URL}/api/health`);
  if (!healthRes.ok) throw new Error(`/api/health failed: ${healthRes.status}`);
  const healthData = await healthRes.json();
  assertNoLeaks(JSON.stringify(healthData), '/api/health');
  if (!healthData.ok || !healthData.rulesetId || !healthData.providers) {
    throw new Error(`/api/health payload invalid: ${JSON.stringify(healthData)}`);
  }
  console.log('✓ GET /api/health returns valid schema');

  // 2. GET /api/rules
  const rulesRes = await fetch(`${BASE_URL}/api/rules`);
  if (!rulesRes.ok) throw new Error(`/api/rules failed: ${rulesRes.status}`);
  const rulesData = await rulesRes.json();
  assertNoLeaks(JSON.stringify(rulesData), '/api/rules');
  if (!rulesData.rulesetId || !rulesData.destinations || rulesData.destinations.length === 0) {
    throw new Error('/api/rules payload invalid');
  }
  console.log('✓ GET /api/rules returns public metadata & destinations');

  // 3. GET /api/fixtures
  const fixturesRes = await fetch(`${BASE_URL}/api/fixtures`);
  if (!fixturesRes.ok) throw new Error(`/api/fixtures failed: ${fixturesRes.status}`);
  const fixturesData = await fixturesRes.json();
  assertNoLeaks(JSON.stringify(fixturesData), '/api/fixtures');
  if (!Array.isArray(fixturesData) || fixturesData.length === 0) {
    throw new Error('/api/fixtures payload invalid');
  }
  console.log('✓ GET /api/fixtures returns demo fixtures list');

  // 4. POST /api/classify with valid fixtureId
  const classifyFixtureRes = await fetch(`${BASE_URL}/api/classify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fixtureId: 'plastic-bottle-clean' }),
  });
  if (!classifyFixtureRes.ok) {
    throw new Error(`/api/classify fixture failed: ${classifyFixtureRes.status}`);
  }
  const classifyFixtureData = await classifyFixtureRes.json();
  assertNoLeaks(JSON.stringify(classifyFixtureData), '/api/classify fixture');
  if (
    !classifyFixtureData.requestId ||
    classifyFixtureData.source !== 'demo-sample' ||
    classifyFixtureData.result.status !== 'decided'
  ) {
    throw new Error(
      `/api/classify invalid fixture response: ${JSON.stringify(classifyFixtureData)}`
    );
  }
  console.log('✓ POST /api/classify with fixtureId succeeds');

  // 5. POST /api/classify with multipart valid PNG
  const validPngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
  const formData = new FormData();
  formData.append('image', new Blob([validPngBytes], { type: 'image/png' }), 'test.png');

  const classifyUploadRes = await fetch(`${BASE_URL}/api/classify`, {
    method: 'POST',
    body: formData,
  });
  if (!classifyUploadRes.ok) {
    throw new Error(`/api/classify upload failed: ${classifyUploadRes.status}`);
  }
  const classifyUploadData = await classifyUploadRes.json();
  assertNoLeaks(JSON.stringify(classifyUploadData), '/api/classify upload');
  if (!classifyUploadData.requestId || !classifyUploadData.classification) {
    throw new Error('/api/classify invalid upload response');
  }
  console.log('✓ POST /api/classify with multipart image succeeds');

  // 6. POST /api/decide with classification
  const decideRes = await fetch(`${BASE_URL}/api/decide`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      classification: classifyFixtureData.classification,
      answers: {},
    }),
  });
  if (!decideRes.ok) throw new Error(`/api/decide failed: ${decideRes.status}`);
  const decideData = await decideRes.json();
  assertNoLeaks(JSON.stringify(decideData), '/api/decide');
  if (!decideData.result || decideData.result.status !== 'decided') {
    throw new Error('/api/decide invalid response');
  }
  console.log('✓ POST /api/decide evaluates classification correctly');

  // 7. Error cases
  // (a) Unsupported content-type
  const badContentTypeRes = await fetch(`${BASE_URL}/api/classify`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: 'plain text',
  });
  if (badContentTypeRes.status !== 415) {
    throw new Error(`Expected 415 for text/plain, received ${badContentTypeRes.status}`);
  }
  const badContentTypeData = await badContentTypeRes.json();
  if (badContentTypeData.error?.code !== 'UNSUPPORTED_TYPE') {
    throw new Error(`Expected UNSUPPORTED_TYPE code, got ${badContentTypeData.error?.code}`);
  }
  console.log('✓ Rejected unsupported Content-Type with 415 UNSUPPORTED_TYPE');

  // (b) Malformed JSON
  const malformedJsonRes = await fetch(`${BASE_URL}/api/classify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{"invalid": json',
  });
  if (malformedJsonRes.status !== 400) {
    throw new Error(`Expected 400 for malformed JSON, got ${malformedJsonRes.status}`);
  }
  const malformedData = await malformedJsonRes.json();
  if (malformedData.error?.code !== 'BAD_REQUEST') {
    throw new Error(`Expected BAD_REQUEST code, got ${malformedData.error?.code}`);
  }
  console.log('✓ Rejected malformed JSON with 400 BAD_REQUEST');

  // (c) Missing fixtureId
  const missingFixtureRes = await fetch(`${BASE_URL}/api/classify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notFixtureId: 'something' }),
  });
  if (missingFixtureRes.status !== 400) {
    throw new Error(`Expected 400 for missing fixtureId, got ${missingFixtureRes.status}`);
  }
  console.log('✓ Rejected missing fixtureId with 400 BAD_REQUEST');

  // (d) Unknown fixtureId
  const unknownFixtureRes = await fetch(`${BASE_URL}/api/classify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fixtureId: 'does-not-exist' }),
  });
  if (unknownFixtureRes.status !== 400) {
    throw new Error(`Expected 400 for unknown fixtureId, got ${unknownFixtureRes.status}`);
  }
  console.log('✓ Rejected unknown fixtureId with 400 BAD_REQUEST');

  // (e) Spoofed PNG extension with text content
  const spoofedFormData = new FormData();
  spoofedFormData.append(
    'image',
    new Blob([new TextEncoder().encode('not a real png content')], { type: 'image/png' }),
    'spoofed.png'
  );
  const spoofedRes = await fetch(`${BASE_URL}/api/classify`, {
    method: 'POST',
    body: spoofedFormData,
  });
  if (spoofedRes.status !== 415 && spoofedRes.status !== 400) {
    throw new Error(`Expected 400/415 for spoofed extension, got ${spoofedRes.status}`);
  }
  console.log('✓ Rejected spoofed PNG extension via magic bytes validation');

  // (f) Oversized file (> 8MB)
  const oversizedBytes = new Uint8Array(9 * 1024 * 1024);
  oversizedBytes[0] = 0xff;
  oversizedBytes[1] = 0xd8;
  oversizedBytes[2] = 0xff;
  const oversizedForm = new FormData();
  oversizedForm.append('image', new Blob([oversizedBytes], { type: 'image/jpeg' }), 'huge.jpg');
  const oversizedRes = await fetch(`${BASE_URL}/api/classify`, {
    method: 'POST',
    body: oversizedForm,
  });
  if (oversizedRes.status !== 413) {
    throw new Error(`Expected 413 for oversized file, got ${oversizedRes.status}`);
  }
  const oversizedData = await oversizedRes.json();
  if (oversizedData.error?.code !== 'IMAGE_TOO_LARGE') {
    throw new Error(`Expected IMAGE_TOO_LARGE, got ${oversizedData.error?.code}`);
  }
  console.log('✓ Rejected oversized file with 413 IMAGE_TOO_LARGE');

  // (g) Rate limiting test
  console.log('[check-api] Testing rate limit threshold (20 req/min)...');
  let tripped = false;
  for (let i = 0; i < 25; i++) {
    const r = await fetch(`${BASE_URL}/api/classify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fixtureId: 'aluminum-can-clean' }),
    });
    if (r.status === 429) {
      tripped = true;
      const retryAfter = r.headers.get('retry-after');
      if (!retryAfter) throw new Error('Missing Retry-After header on 429 response');
      break;
    }
  }
  if (!tripped) {
    throw new Error('Rate limit was expected to trip after 20 requests');
  }
  console.log('✓ Rate limiter tripped with 429 RATE_LIMITED and Retry-After header');

  // (h) Security headers check on /
  const homeRes = await fetch(`${BASE_URL}/`);
  const nosniff = homeRes.headers.get('x-content-type-options');
  const frameOptions = homeRes.headers.get('x-frame-options');
  const csp = homeRes.headers.get('content-security-policy');
  const permissions = homeRes.headers.get('permissions-policy');
  if (nosniff !== 'nosniff' || frameOptions !== 'DENY' || !csp || !permissions) {
    throw new Error('Missing security headers on /');
  }
  console.log('✓ Security headers verified on /');

  console.log('[check-api] ALL 12 API CONTRACT CHECKS PASSED.');
} finally {
  if (serverProcess) {
    console.log('[check-api] Stopping test server...');
    serverProcess.kill('SIGTERM');
  }
}

process.exit(0);
