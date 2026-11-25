// Apple Taptic-inspired web haptics + subtle tactile audio micro-feedback

const HAPTICS_STORAGE_KEY = 'cloudmaster_haptics_enabled_v1';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (Ctx) {
      audioCtx = new Ctx();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function getHapticsEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  const saved = localStorage.getItem(HAPTICS_STORAGE_KEY);
  return saved === null ? true : saved === 'true';
}

export function setHapticsEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(HAPTICS_STORAGE_KEY, String(enabled));
}

export type HapticStyle = 'light' | 'medium' | 'success' | 'error';

export function triggerHaptic(style: HapticStyle = 'light'): void {
  if (!getHapticsEnabled()) return;

  // Respect user's reduced motion preference for tactile feedback intensity
  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  // 1. Physical Vibration API (Android / supported mobile browsers)
  if (!prefersReduced && typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try {
      if (style === 'light') navigator.vibrate(8);
      else if (style === 'medium') navigator.vibrate(15);
      else if (style === 'success') navigator.vibrate([10, 30, 14]);
      else if (style === 'error') navigator.vibrate([18, 25, 18]);
    } catch {
      // Ignore unsupported vibration blocks
    }
  }

  // 2. Ultra-subtle Apple-style Taptic micro-tone via Web Audio API
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (style === 'light') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(640, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.018);
      gain.gain.setValueAtTime(0.025, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.018);
      osc.start(now);
      osc.stop(now + 0.02);
    } else if (style === 'medium') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(480, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.028);
      gain.gain.setValueAtTime(0.035, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.028);
      osc.start(now);
      osc.stop(now + 0.03);
    } else if (style === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.055); // E5
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (style === 'error') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.09);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
      osc.start(now);
      osc.stop(now + 0.1);
    }
  } catch {
    // Ignore audio context autoplay restrictions
  }
}
