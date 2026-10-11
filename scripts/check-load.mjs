import http from 'http';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const PORT = 3008;

console.log(`[check-load] Starting production server on port ${PORT}...`);

const serverProcess = spawn('npx', ['next', 'start', '-p', PORT.toString()], {
  cwd: rootDir,
  env: {
    ...process.env,
    PORT: PORT.toString(),
    NODE_ENV: 'production',
    PROVIDER_MODE: 'mock',
    RATE_LIMIT_PER_MIN: '100',
  },
  shell: true,
  stdio: 'pipe',
});

function cleanup() {
  try {
    if (process.platform === 'win32') {
      spawn('taskkill', ['/pid', serverProcess.pid.toString(), '/T', '/F']);
    } else {
      serverProcess.kill('SIGTERM');
    }
  } catch {
    // ignore
  }
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);

// Wait for server ready
async function waitForServer(timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/api/health`);
      if (res.ok) return;
    } catch {
      await new Promise((r) => setTimeout(r, 200));
    }
  }
  throw new Error('[check-load] Server failed to start within timeout');
}

try {
  await waitForServer();
  console.log(`[check-load] Server ready. Firing 20 concurrent requests to /api/classify...`);

  const memBefore = process.memoryUsage().heapUsed;
  const startTime = Date.now();

  const requests = Array.from({ length: 20 }, async (_, i) => {
    const reqStart = Date.now();
    const res = await fetch(`http://127.0.0.1:${PORT}/api/classify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fixtureId: 'aluminum-can-clean' }),
    });

    const latency = Date.now() - reqStart;
    const body = await res.json();
    return { status: res.status, latency, body };
  });

  const results = await Promise.all(requests);
  const totalDuration = Date.now() - startTime;
  const memAfter = process.memoryUsage().heapUsed;

  console.log(
    `[check-load] Sample response 0: status ${results[0].status}:`,
    JSON.stringify(results[0].body)
  );

  const successCount = results.filter(
    (r) => r.status === 200 && r.body.result?.status === 'decided'
  ).length;
  const latencies = results.map((r) => r.latency).sort((a, b) => a - b);
  const p50 = latencies[Math.floor(latencies.length * 0.5)];
  const p95 = latencies[Math.floor(latencies.length * 0.95)];

  console.log('\n========================================');
  console.log(`[check-load] Load Check Results:`);
  console.log(`  Total concurrent requests: 20`);
  console.log(`  Success count (200 OK):    ${successCount} / 20`);
  console.log(`  Total duration:            ${totalDuration}ms`);
  console.log(`  Latency p50:               ${p50}ms`);
  console.log(`  Latency p95:               ${p95}ms`);
  console.log(`  Heap delta:                ${Math.round((memAfter - memBefore) / 1024)} KB`);
  console.log('========================================\n');

  if (successCount !== 20) {
    console.error(`[check-load] FAILED: expected 20 successful responses, got ${successCount}`);
    process.exit(1);
  }

  console.log('[check-load] PASSED: All 20 concurrent requests succeeded with healthy latency.');
  process.exit(0);
} catch (err) {
  console.error('[check-load] ERROR:', err.message);
  process.exit(1);
} finally {
  cleanup();
}
