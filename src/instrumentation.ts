export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { seedAudioCache } = await import('@/lib/voice/audio-cache');
    const result = seedAudioCache();
    if (result.copied > 0) {
      console.log(`[seed-audio] Server startup: seeded ${result.copied} missing audio file(s) into cache.`);
    }
  }
}
