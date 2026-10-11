import { execSync } from 'child_process';
import fs from 'fs';

console.log('[check-secrets] Scanning repository for leaked secrets...');

// Secret patterns to look for
const SECRET_PATTERNS = [
  /AIza[0-9A-Za-z\-_]{30,}/, // Google API key
  /AQ\.[0-9A-Za-z\-_]{30,}/, // Gemini Vertex/Studio key
  /sk_[0-9a-zA-Z]{20,}/, // Generic secret key / ElevenLabs
  /NEXT_PUBLIC_[A-Z0-9_]*(KEY|SECRET|TOKEN|AUTH|PASSWORD)/i, // Leaked public env var
];

let failed = false;

// 1. Verify tracked files
try {
  const trackedFilesOutput = execSync('git ls-files', { encoding: 'utf-8' });
  const trackedFiles = trackedFilesOutput
    .split('\n')
    .map((f) => f.trim())
    .filter(Boolean);

  for (const file of trackedFiles) {
    if (file === '.env' || (file.startsWith('.env.') && file !== '.env.example')) {
      console.error(`[check-secrets] ERROR: Tracked env file found: ${file}`);
      failed = true;
    }

    if (fs.existsSync(file) && fs.statSync(file).isFile()) {
      // Skip binary files and test photos
      if (
        file.endsWith('.png') ||
        file.endsWith('.jpg') ||
        file.endsWith('.jpeg') ||
        file.endsWith('.webp') ||
        file.endsWith('.mp3') ||
        file.endsWith('.ico')
      ) {
        continue;
      }

      const content = fs.readFileSync(file, 'utf-8');
      for (const pattern of SECRET_PATTERNS) {
        if (pattern.test(content)) {
          // If in check-secrets.mjs itself, skip pattern definition
          if (file === 'scripts/check-secrets.mjs') continue;
          console.error(
            `[check-secrets] ERROR: Secret pattern ${pattern} matched in tracked file: ${file}`
          );
          failed = true;
        }
      }
    }
  }
} catch (err) {
  console.error('[check-secrets] Warning during git ls-files check:', err.message);
}

// 2. Verify git log -p (if commits exist)
try {
  const gitLog = execSync('git log -p -n 50', {
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'ignore'],
  });
  for (const pattern of SECRET_PATTERNS) {
    const lines = gitLog.split('\n');
    for (const line of lines) {
      if (line.startsWith('+') && !line.startsWith('+++')) {
        if (pattern.test(line)) {
          // Skip if this is check-secrets.mjs
          if (line.includes('check-secrets.mjs') || line.includes('SECRET_PATTERNS')) continue;
          console.error(
            `[check-secrets] ERROR: Secret pattern ${pattern} matched in commit diff: ${line}`
          );
          failed = true;
        }
      }
    }
  }
} catch {
  // No commits yet or git log failed - fine for initial pre-commit check
}

// 3. Verify .next/static client bundle if built
if (fs.existsSync('.next/static')) {
  function scanDir(dir) {
    const entries = fs.readdirSync(dir);
    for (const entry of entries) {
      const full = `${dir}/${entry}`;
      if (fs.statSync(full).isDirectory()) {
        scanDir(full);
      } else {
        const text = fs.readFileSync(full, 'utf-8');
        for (const pattern of SECRET_PATTERNS) {
          if (pattern.test(text)) {
            console.error(
              `[check-secrets] ERROR: Secret pattern ${pattern} matched in client bundle: ${full}`
            );
            failed = true;
          }
        }
      }
    }
  }
  scanDir('.next/static');
}

if (failed) {
  console.error('[check-secrets] FAILED: Potential secrets detected!');
  process.exit(1);
} else {
  console.log('[check-secrets] PASSED: No secrets found in tracked files or history.');
  process.exit(0);
}
