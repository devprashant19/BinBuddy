import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { ElevenLabsClient } from 'elevenlabs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

// Load .env natively
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

const apiKey = process.env.ELEVENLABS_API_KEY;
if (!apiKey || !apiKey.trim()) {
  console.log('SKIPPED: no key');
  process.exit(0);
}

const voiceId = process.env.ELEVENLABS_VOICE_ID || 'cicZiwk5NrFYKb3gi8in';
const modelId = process.env.ELEVENLABS_MODEL_ID || 'eleven_flash_v2_5';
const audioCacheDir = path.resolve(rootDir, process.env.AUDIO_CACHE_DIR || '.cache/audio');

if (!fs.existsSync(audioCacheDir)) {
  fs.mkdirSync(audioCacheDir, { recursive: true });
}

const rulesPath = path.join(rootDir, 'data/rules/houston-tx-curbside.json');
if (!fs.existsSync(rulesPath)) {
  console.error('[warm-audio] ERROR: Ruleset file not found:', rulesPath);
  process.exit(1);
}

const ruleset = JSON.parse(fs.readFileSync(rulesPath, 'utf8'));
const client = new ElevenLabsClient({ apiKey });

console.log(`[warm-audio] Pre-warming audio for ruleset: ${ruleset.rulesetId} (${ruleset.rulesetVersion})...`);
console.log(`[warm-audio] Target directory: ${audioCacheDir}`);
console.log(`[warm-audio] Model: ${modelId}, Voice: ${voiceId}`);

let cachedCount = 0;
let generatedCount = 0;

for (const rule of ruleset.rules) {
  const narration = rule.decision?.narration;
  if (!narration) continue;

  const rawKey = `${narration}:${voiceId}:${modelId}:${ruleset.rulesetVersion}`;
  const key = crypto.createHash('sha256').update(rawKey).digest('hex');
  const filePath = path.join(audioCacheDir, `${key}.mp3`);

  if (fs.existsSync(filePath) && fs.statSync(filePath).size > 100) {
    console.log(`  CACHED: [${rule.id}] -> ${key}.mp3`);
    cachedCount++;
    continue;
  }

  console.log(`  GENERATING: [${rule.id}] "${narration.slice(0, 40)}..."`);
  try {
    const audioStream = await client.textToSpeech.convert(voiceId, {
      text: narration,
      model_id: modelId,
      output_format: 'mp3_44100_128',
    });

    const chunks = [];
    for await (const chunk of audioStream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const buffer = Buffer.concat(chunks);

    fs.writeFileSync(filePath, buffer);
    console.log(`    SAVED: ${key}.mp3 (${buffer.length} bytes)`);
    generatedCount++;
  } catch (err) {
    console.error(`    ERROR: Failed to generate audio for ${rule.id}:`, err.message);
  }
}

console.log('\n========================================');
console.log(`[warm-audio] Summary:`);
console.log(`  Total narrations processed: ${ruleset.rules.length}`);
console.log(`  Already in cache:           ${cachedCount}`);
console.log(`  Newly generated & saved:    ${generatedCount}`);
console.log('========================================\n');
process.exit(0);
