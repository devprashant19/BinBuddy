import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

// Load .env if present
if (fs.existsSync(path.join(rootDir, '.env'))) {
  const content = fs.readFileSync(path.join(rootDir, '.env'), 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const k = trimmed.slice(0, eqIdx).trim();
      const v = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[k]) {
        process.env[k] = v;
      }
    }
  }
}

console.log('======================================================');
console.log('     BINBUDDY PRE-DEMO CHECKLIST & PREPARATION        ');
console.log('======================================================\n');

// 1. Ruleset check
const rulesPath = path.join(rootDir, 'data/rules/houston-tx-curbside.json');
if (fs.existsSync(rulesPath)) {
  const rules = JSON.parse(fs.readFileSync(rulesPath, 'utf8'));
  console.log(`✓ Ruleset loaded:     ${rules.rulesetId} (v${rules.rulesetVersion})`);
  console.log(`  Target City:        ${rules.city.name}, ${rules.city.region}`);
  console.log(`  Total Rules:        ${rules.rules.length}`);
  console.log(`  Destinations:       ${rules.destinations.map((d) => d.label).join(', ')}`);
} else {
  console.error('✗ Ruleset file missing!');
}

// 2. Audio Cache Status
const audioCacheDir = path.resolve(rootDir, process.env.AUDIO_CACHE_DIR || '.cache/audio');
if (fs.existsSync(audioCacheDir)) {
  const files = fs.readdirSync(audioCacheDir).filter((f) => f.endsWith('.mp3'));
  console.log(`✓ Audio Cache:        ${files.length} MP3 files cached in ${audioCacheDir}`);
} else {
  console.log('! Audio Cache:        No cache directory found yet (run npm run warm:audio)');
}

// 3. Provider Configuration
const geminiKey = process.env.GEMINI_API_KEY;
const elevenKey = process.env.ELEVENLABS_API_KEY;

console.log(
  `✓ Vision Provider:    ${geminiKey ? `Gemini Live (${process.env.GEMINI_MODEL || 'gemini-3.8-flash'})` : 'Demo Mock Mode'}`
);
console.log(
  `✓ Voice Provider:     ${elevenKey ? 'ElevenLabs Live' : 'Browser SpeechSynthesis Fallback'}`
);

// 4. Sample Fixtures
const fixturesPath = path.join(rootDir, 'data/fixtures/classification-fixtures.json');
if (fs.existsSync(fixturesPath)) {
  const fixtures = JSON.parse(fs.readFileSync(fixturesPath, 'utf8'));
  console.log(`✓ Demo Samples:       ${fixtures.length} available fixtures:`);
  for (const fix of fixtures) {
    console.log(`    - [${fix.id}] ${fix.label}: ${fix.description}`);
  }
}

console.log('\n======================================================');
console.log('3-MINUTE DEMO RUN-THROUGH GUIDE:');
console.log('  1. 0:00 - Point over bin on phone/laptop; state problem.');
console.log('  2. 0:15 - Tap "Soda Can" sample or take photo; see blue lid open.');
console.log('  3. 0:35 - Tap "Hear it" button to hear municipal narration.');
console.log('  4. 0:50 - Open "Why this answer" disclosure; show rule & city link.');
console.log('  5. 1:10 - Pick ambiguous item to show Clarification question.');
console.log('  6. 1:40 - Demonstrate graceful fallback & manual material picker.');
console.log('  7. 2:20 - Tap "I sorted it" to update honest personal tally.');
console.log('  8. 2:45 - Wrap up: AI describes, rules decide, auditable & safe.');
console.log('======================================================\n');
