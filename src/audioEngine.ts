/**
 * Hardened Web Speech API & Web Audio Synthesizer Engine
 * - Prevents Garbage Collection (GC) cutoff of active SpeechSynthesisUtterance instances
 *   using a strong-reference Set pool (`utterancePool`) + safety timeout cleanup.
 * - Handles rapid-tap events from 6-year-old children via cooldown throttling and
 *   debounced speech queue transitions (avoiding the Chromium synchronous cancel+speak bug).
 * - Preserves full UTF-8 Khmer Phonetic fallback (`KHMER_PHONETIC_MAP`) when devices lack `km-KH` voices.
 * - Provides schema-validated `localStorage` hydration helpers to prevent corrupted cache crashes.
 */

let sharedAudioCtx: AudioContext | null = null;

// Strong-reference pool preventing V8/WebKit Garbage Collector from collecting active utterances mid-speech
const utterancePool = new Set<SpeechSynthesisUtterance>();
let speechDebounceTimer: ReturnType<typeof setTimeout> | null = null;
let cachedVoices: SpeechSynthesisVoice[] = [];
let lastChimeTimestamp = 0;
const RAPID_TAP_CHIME_COOLDOWN_MS = 65;

/**
 * Complete UTF-8 Khmer-to-Phonetic Dictionary for devices without a native `km-KH` OS voice.
 */
export const KHMER_PHONETIC_MAP: Record<string, string> = {
  // Full question speech phrases
  'ក... ក ក្តាម': 'Kah... Kah, Kdaam',
  'ខ... ខ ខ្លា': 'Khah... Khah, Khlaa',
  'គ... គ គោ': 'Koh... Koh, Ko',
  'ឃ... ឃ ឃ្មុំ': 'Khoh... Khoh, Khmum',
  'ច... ច ចេក': 'Chah... Chah, Chek',
  'ឆ... ឆ ឆ្មា': 'Chhah... Chhah, Chhmaa',
  'ដ... ដ ដំរី': 'Dah... Dah, Dam-rei',
  'ស... ស សេះ': 'Sah... Sah, Seh',
  'ស្រៈ អា... ក អា កា': 'Srah Aah... Kah Aah, Kaa',
  'ស្រៈ អី... ត្រី': 'Srah Ei... Trei',
  'ស្រៈ អោ... គ អោ គោ': 'Srah Ao... Koh Ao, Ko',
  'ស្រៈ អៅ... ប អៅ បៅ': 'Srah Au... Bah Au, Bau',
  'ឥ... ឥ ឥសី': 'Srah E... Ey-sei',
  'ឧ... ឧ ឧសភា': 'Srah Oh... U-sa-phea',
  'ឯ... ឯ ឯកសណ្ឋាន': 'Srah Ae... Ae-ka-san-than',
  'ឪ... ឪ ឪឡឹក': 'Srah Au... Ouv-loek',

  // Individual Khmer consonants & vowels
  'ក': 'Kah',
  'ខ': 'Khah',
  'គ': 'Koh',
  'ឃ': 'Khoh',
  'ង': 'Ngoh',
  'ច': 'Chah',
  'ឆ': 'Chhah',
  'ជ': 'Choh',
  'ឈ': 'Chhoh',
  'ញ': 'Nhoh',
  'ដ': 'Dah',
  'ឋ': 'Thah',
  'ឌ': 'Doh',
  'ឍ': 'Thoh',
  'ណ': 'Nah',
  'ត': 'Tah',
  'ថ': 'Thah',
  'ទ': 'Toh',
  'ធ': 'Thoh',
  'ន': 'Noh',
  'ប': 'Bah',
  'ផ': 'Phah',
  'ព': 'Poh',
  'ភ': 'Phoh',
  'ម': 'Moh',
  'យ': 'Yoh',
  'រ': 'Roh',
  'ល': 'Loh',
  'វ': 'Voh',
  'ស': 'Sah',
  'ហ': 'Hah',
  'ឡ': 'Lah',
  'អ': 'Ah',
  'ស្រៈ អា': 'Srah Aah',
  'ា': 'Srah Aah',
  'ស្រៈ អិ': 'Srah Eh',
  'ិ': 'Srah Eh',
  'ស្រៈ អី': 'Srah Ei',
  'ី': 'Srah Ei',
  'ស្រៈ អឹ': 'Srah Oe',
  'ឹ': 'Srah Oe',
  'ស្រៈ អឺ': 'Srah Oeu',
  'ឺ': 'Srah Oeu',
  'ស្រៈ អុ': 'Srah Oh',
  'ុ': 'Srah Oh',
  'ស្រៈ អូ': 'Srah Ou',
  'ូ': 'Srah Ou',
  'ស្រៈ អេ': 'Srah Ey',
  'េ': 'Srah Ey',
  'ស្រៈ អែ': 'Srah Ae',
  'ែ': 'Srah Ae',
  'ស្រៈ អោ': 'Srah Ao',
  'ោ': 'Srah Ao',
  'ស្រៈ អៅ': 'Srah Au',
  'ៅ': 'Srah Au',
  'ស្រៈ អាំ': 'Srah Am',
  'ាំ': 'Srah Am',
  'ឥ': 'Srah E',
  'ឧ': 'Srah Oh',
  'ឯ': 'Srah Ae',
  'ឪ': 'Srah Au',
  'ឱ': 'Srah Ao',
};

export function toKhmerPhoneticSpeech(text: string): string {
  const trimmed = String(text || '').trim();
  if (KHMER_PHONETIC_MAP[trimmed]) {
    return KHMER_PHONETIC_MAP[trimmed];
  }
  let result = trimmed;
  Object.keys(KHMER_PHONETIC_MAP)
    .sort((a, b) => b.length - a.length)
    .forEach((khmerKey) => {
      if (result.includes(khmerKey)) {
        result = result.split(khmerKey).join(` ${KHMER_PHONETIC_MAP[khmerKey]} `);
      }
    });
  return result.replace(/\s+/g, ' ').trim() || 'Kah';
}

function refreshVoicesCache(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
  try {
    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      cachedVoices = voices;
    }
  } catch {
    // Ignore
  }
  return cachedVoices;
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  refreshVoicesCache();
  try {
    window.speechSynthesis.onvoiceschanged = () => {
      refreshVoicesCache();
    };
  } catch {
    // Ignore on browsers where onvoiceschanged is read-only
  }
}

function getAudioCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        sharedAudioCtx = new AudioContextClass();
      }
    }
    return sharedAudioCtx;
  } catch {
    return null;
  }
}

function withUnlockedAudioCtx(callback: (ctx: AudioContext) => void): void {
  const ctx = getAudioCtx();
  if (!ctx) return;

  try {
    // Play a 1-sample silent buffer synchronously to unlock mobile Safari/Chrome audio
    const silentBuffer = ctx.createBuffer(1, 1, 22050);
    const source = ctx.createBufferSource();
    source.buffer = silentBuffer;
    source.connect(ctx.destination);
    source.start(0);
  } catch {
    // Ignore
  }

  if (ctx.state === 'suspended') {
    ctx
      .resume()
      .then(() => callback(ctx))
      .catch(() => {});
  } else {
    callback(ctx);
  }
}

if (typeof window !== 'undefined') {
  const unlockOnFirstGesture = () => {
    withUnlockedAudioCtx(() => {});
    refreshVoicesCache();
  };
  window.addEventListener('pointerdown', unlockOnFirstGesture, { once: true, passive: true });
  window.addEventListener('touchstart', unlockOnFirstGesture, { once: true, passive: true });
  window.addEventListener('keydown', unlockOnFirstGesture, { once: true, passive: true });
}

export function playSoundEffect(
  type: 'correct' | 'tryAgain' | 'tap' | 'speak' | 'victory'
): void {
  const nowMs = Date.now();
  // Throttle ultra-rapid duplicate tap chimes while always allowing 'correct'/'victory'/'tryAgain'
  if ((type === 'tap' || type === 'speak') && nowMs - lastChimeTimestamp < RAPID_TAP_CHIME_COOLDOWN_MS) {
    return;
  }
  lastChimeTimestamp = nowMs;

  withUnlockedAudioCtx((ctx) => {
    const now = ctx.currentTime + 0.01;

    const playTone = (
      freq: number,
      startTime: number,
      duration: number,
      wave: OscillatorType = 'triangle',
      peakGain = 0.32
    ) => {
      const osc = ctx.createOscillator();
      const subOsc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = wave;
      osc.frequency.setValueAtTime(freq, startTime);

      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(freq * 2, startTime);

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(peakGain, startTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0008, startTime + duration);

      osc.connect(gain);
      subOsc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      subOsc.start(startTime);
      osc.stop(startTime + duration + 0.02);
      subOsc.stop(startTime + duration + 0.02);
    };

    if (type === 'correct') {
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        playTone(freq, now + idx * 0.08, 0.28, 'triangle', 0.35);
      });
    } else if (type === 'tryAgain') {
      [392.0, 329.63].forEach((freq, idx) => {
        playTone(freq, now + idx * 0.12, 0.25, 'sine', 0.28);
      });
    } else if (type === 'speak') {
      playTone(587.33, now, 0.14, 'triangle', 0.26);
      playTone(880.0, now + 0.07, 0.18, 'sine', 0.24);
    } else if (type === 'tap') {
      playTone(659.25, now, 0.12, 'triangle', 0.28);
    } else if (type === 'victory') {
      [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5].forEach((freq, idx) => {
        playTone(freq, now + idx * 0.1, 0.34, 'triangle', 0.36);
      });
    }
  });
}

export function cancelActiveSpeech(): void {
  if (speechDebounceTimer) {
    clearTimeout(speechDebounceTimer);
    speechDebounceTimer = null;
  }
  utterancePool.clear();
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Ignore
    }
  }
}

export function speakKhmerText(text: string): void {
  playSoundEffect('speak');

  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  const dispatchUtterance = () => {
    try {
      const synth = window.speechSynthesis;
      if (synth.paused) {
        synth.resume();
      }

      const voices = cachedVoices.length > 0 ? cachedVoices : refreshVoicesCache();
      const khmerVoice = voices.find(
        (v) =>
          (v.lang && v.lang.toLowerCase().includes('km')) ||
          (v.name && v.name.toLowerCase().includes('khmer')) ||
          (v.name && v.name.toLowerCase().includes('cambodia'))
      );

      const spokenString = khmerVoice ? text : toKhmerPhoneticSpeech(text);
      const utterance = new SpeechSynthesisUtterance(spokenString);

      // Retain strong reference in utterancePool so browser GC never cuts off speech prematurely
      utterancePool.add(utterance);
      const releaseUtterance = () => {
        utterancePool.delete(utterance);
      };

      // Safety cleanup timer in case onend/onerror is not fired by mobile WebView
      const safetyCleanupId = setTimeout(releaseUtterance, 8000);

      utterance.onend = () => {
        clearTimeout(safetyCleanupId);
        releaseUtterance();
      };
      utterance.onerror = () => {
        clearTimeout(safetyCleanupId);
        releaseUtterance();
      };

      if (khmerVoice) {
        utterance.voice = khmerVoice;
        utterance.lang = khmerVoice.lang || 'km-KH';
        utterance.rate = 0.85;
        utterance.pitch = 1.08;
      } else {
        const fallbackVoice =
          voices.find((v) => v.lang && v.lang.toLowerCase().startsWith('en') && v.default) ||
          voices.find((v) => v.lang && v.lang.toLowerCase().startsWith('en')) ||
          voices[0];
        if (fallbackVoice) {
          utterance.voice = fallbackVoice;
          utterance.lang = fallbackVoice.lang || 'en-US';
        } else {
          utterance.lang = 'en-US';
        }
        utterance.rate = 0.82;
        utterance.pitch = 1.05;
      }

      utterance.volume = 1.0;
      synth.speak(utterance);
    } catch {
      // Fallback gracefully
    }
  };

  try {
    if (speechDebounceTimer) {
      clearTimeout(speechDebounceTimer);
      speechDebounceTimer = null;
    }

    const synth = window.speechSynthesis;
    if (synth.speaking || synth.pending) {
      synth.cancel();
      utterancePool.clear();
      // 45ms debounce prevents rapid-tap queue lockups and Chromium cancel-race bugs
      speechDebounceTimer = setTimeout(dispatchUtterance, 45);
    } else {
      dispatchUtterance();
    }
  } catch {
    // Fallback gracefully
  }
}

/**
 * Schema-Validated LocalStorage Loader
 * Prevents corrupted or partial JSON data in localStorage from crashing React components.
 */
export function safeLoadFromStorage<T>(
  key: string,
  fallback: T,
  validator: (val: unknown) => val is T
): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed: unknown = JSON.parse(raw);
    if (validator(parsed)) {
      return parsed;
    }
    // Self-heal corrupted entry
    localStorage.setItem(key, JSON.stringify(fallback));
    return fallback;
  } catch {
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore
    }
    return fallback;
  }
}
