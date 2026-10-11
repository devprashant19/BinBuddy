import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const tempDir = path.join(os.tmpdir(), 'binbuddy-audit-clean-' + Date.now());

console.log(`[audit-clean-clone] Target temp directory: ${tempDir}`);

if (fs.existsSync(tempDir)) {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

try {
  // Step 1: Clone repo
  console.log('[audit-clean-clone] Step 1: Cloning repo from local working directory...');
  execSync(`git clone "${rootDir}" "${tempDir}"`, { stdio: 'inherit' });

  // Step 2: npm ci
  console.log('[audit-clean-clone] Step 2: Running npm ci...');
  execSync('npm ci', { cwd: tempDir, stdio: 'inherit' });

  // Step 3: Copy .env.example with NO keys
  console.log('[audit-clean-clone] Step 3: Copying .env.example to .env (NO keys)...');
  fs.copyFileSync(path.join(tempDir, '.env.example'), path.join(tempDir, '.env'));

  // Step 4: Run npm run verify
  console.log('[audit-clean-clone] Step 4: Running npm run verify in clean clone...');
  const verifyOutput = execSync('npm run verify', {
    cwd: tempDir,
    encoding: 'utf8',
    env: { ...process.env, PORT: '3000' },
  });
  console.log(verifyOutput);

  // Step 5: Test with real keys from rootDir/.env
  const realEnvPath = path.join(rootDir, '.env');
  if (fs.existsSync(realEnvPath)) {
    console.log('[audit-clean-clone] Step 5: Copying real .env keys to clean clone...');
    fs.copyFileSync(realEnvPath, path.join(tempDir, '.env'));

    console.log('[audit-clean-clone] Step 6: Running npm run smoke:live with real keys in clean clone...');
    const smokeOutput = execSync('npm run smoke:live', {
      cwd: tempDir,
      encoding: 'utf8',
    });
    console.log(smokeOutput);
  } else {
    console.warn('[audit-clean-clone] Warning: real .env not found in rootDir');
  }

  console.log('\n[audit-clean-clone] SUCCESS: Clean clone verification completed.');
} catch (err) {
  console.error('[audit-clean-clone] FAILED:', err.message);
  if (err.stdout) console.log('STDOUT:\n', err.stdout);
  if (err.stderr) console.error('STDERR:\n', err.stderr);
  process.exit(1);
} finally {
  if (fs.existsSync(tempDir)) {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
      console.log('[audit-clean-clone] Cleaned up temp directory.');
    } catch {
      // ignore
    }
  }
}
