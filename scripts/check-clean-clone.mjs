import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

import os from 'os';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const cloneDir = path.join(os.tmpdir(), 'binbuddy-clean-clone');

console.log('[check-clean-clone] Starting clean clone test...');

if (fs.existsSync(cloneDir)) {
  fs.rmSync(cloneDir, { recursive: true, force: true });
}

try {
  console.log('[check-clean-clone] 1. Cloning repository into .clone_test...');
  execSync('git clone . .clone_test', { cwd: rootDir, stdio: 'inherit' });

  console.log('[check-clean-clone] 2. Copying .env.example to .env in clone...');
  fs.copyFileSync(path.join(cloneDir, '.env.example'), path.join(cloneDir, '.env'));

  console.log('[check-clean-clone] 3. Running npm ci in clone...');
  execSync('npm ci', { cwd: cloneDir, stdio: 'inherit' });

  console.log('[check-clean-clone] 4. Running npm run verify in clone...');
  execSync('npm run verify', { cwd: cloneDir, stdio: 'inherit' });

  console.log('[check-clean-clone] 5. Running npm run check:load in clone...');
  execSync('npm run check:load', { cwd: cloneDir, stdio: 'inherit' });

  console.log('\n========================================');
  console.log(
    '[check-clean-clone] PASSED: Clean clone builds, tests, and verifies 100% cleanly from scratch!'
  );
  console.log('========================================\n');
  process.exit(0);
} catch (err) {
  console.error('[check-clean-clone] FAILED:', err.message);
  process.exit(1);
} finally {
  if (fs.existsSync(cloneDir)) {
    try {
      fs.rmSync(cloneDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  }
}
