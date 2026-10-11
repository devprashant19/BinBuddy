export type VoiceState = 'idle' | 'loading' | 'playing' | 'fallback' | 'unavailable';

const AUTO_SPEAK_KEY = 'binbuddy:auto_speak';

let currentAudio: HTMLAudioElement | null = null;
const audioBlobCache = new Map<string, string>(); // ruleId -> objectUrl

export function getAutoSpeakPreference(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(AUTO_SPEAK_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setAutoSpeakPreference(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(AUTO_SPEAK_KEY, enabled ? 'true' : 'false');
  } catch {
    // ignore
  }
}

export function stopCurrentSpeech(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

export async function speakNarration({
  ruleId,
  rulesetVersion,
  narration,
  onStateChange,
}: {
  ruleId: string;
  rulesetVersion: string;
  narration: string;
  onStateChange: (state: VoiceState) => void;
}): Promise<void> {
  stopCurrentSpeech();
  onStateChange('loading');

  // 1. Check if we already have an in-memory object URL for this rule
  const cachedUrl = audioBlobCache.get(`${ruleId}:${rulesetVersion}`);
  if (cachedUrl) {
    playHtmlAudio(cachedUrl, onStateChange);
    return;
  }

  // 2. Fetch from /api/speech
  try {
    const res = await fetch('/api/speech', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ruleId, rulesetVersion }),
    });

    if (res.ok && res.headers.get('content-type')?.includes('audio')) {
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      audioBlobCache.set(`${ruleId}:${rulesetVersion}`, objectUrl);
      playHtmlAudio(objectUrl, onStateChange);
      return;
    }
  } catch (err) {
    console.warn('[speech] /api/speech request failed, falling back to browser voice:', err);
  }

  // 3. Fall back to browser speech synthesis
  fallbackToBrowserVoice(narration, onStateChange);
}

function playHtmlAudio(url: string, onStateChange: (state: VoiceState) => void) {
  try {
    const audio = new Audio(url);
    currentAudio = audio;

    audio.onplay = () => onStateChange('playing');
    audio.onended = () => {
      onStateChange('idle');
      currentAudio = null;
    };
    audio.onerror = () => {
      onStateChange('unavailable');
      currentAudio = null;
    };

    audio.play().catch((err) => {
      console.warn('[speech] audio.play() failed:', err);
      onStateChange('unavailable');
    });
  } catch {
    onStateChange('unavailable');
  }
}

function fallbackToBrowserVoice(
  narration: string,
  onStateChange: (state: VoiceState) => void
) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    onStateChange('unavailable');
    return;
  }

  try {
    window.speechSynthesis.cancel();
    const UtteranceConstructor =
      window.SpeechSynthesisUtterance || (globalThis as any).SpeechSynthesisUtterance;

    if (!UtteranceConstructor) {
      onStateChange('unavailable');
      return;
    }

    const utterance = new UtteranceConstructor(narration);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => onStateChange('fallback');
    utterance.onend = () => onStateChange('idle');
    utterance.onerror = () => onStateChange('unavailable');

    onStateChange('fallback');
    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('[speech] browser voice fallback error:', err);
    onStateChange('unavailable');
  }
}
