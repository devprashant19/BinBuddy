import { spawn } from 'child_process';
import http from 'http';

let BASE_URL = process.env.BASE_URL;
let serverProcess = null;

async function isPortOpen(port) {
  return new Promise((resolve) => {
    const server = http.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    server.listen(port);
  });
}

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

try {
  if (!BASE_URL) {
    const testPort = 3005;
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

  console.log(`[check-api] Running checks against ${BASE_URL}...`);

  // 1. Health check
  const healthRes = await fetch(`${BASE_URL}/api/health`);
  if (!healthRes.ok) {
    throw new Error(`/api/health failed with status ${healthRes.status}`);
  }
  const healthData = await healthRes.json();
  if (!healthData.ok || !healthData.rulesetId) {
    throw new Error(`/api/health returned invalid payload: ${JSON.stringify(healthData)}`);
  }
  console.log('[check-api] /api/health passed:', JSON.stringify(healthData));

  // 2. Home page and security headers
  const homeRes = await fetch(`${BASE_URL}/`);
  if (!homeRes.ok) {
    throw new Error(`/ returned status ${homeRes.status}`);
  }
  const nosniff = homeRes.headers.get('x-content-type-options');
  const frameOptions = homeRes.headers.get('x-frame-options');
  const referrerPolicy = homeRes.headers.get('referrer-policy');
  const csp = homeRes.headers.get('content-security-policy');
  const permissions = homeRes.headers.get('permissions-policy');

  if (nosniff !== 'nosniff') throw new Error('Missing or invalid X-Content-Type-Options header');
  if (frameOptions !== 'DENY') throw new Error('Missing or invalid X-Frame-Options header');
  if (!referrerPolicy) throw new Error('Missing Referrer-Policy header');
  if (!csp) throw new Error('Missing Content-Security-Policy header');
  if (!permissions?.includes('camera=(self)')) {
    throw new Error('Permissions-Policy does not restrict camera to self');
  }

  console.log('[check-api] Security headers verified: nosniff, DENY, CSP, camera=(self).');
  console.log('[check-api] Phase 0 API contract checks ALL PASSED.');
} finally {
  if (serverProcess) {
    console.log('[check-api] Stopping test server process...');
    serverProcess.kill('SIGTERM');
  }
}

process.exit(0);
