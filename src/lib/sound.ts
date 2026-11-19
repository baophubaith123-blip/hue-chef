import { getJsonStorage, setJsonStorage } from '@/lib/storage';

const STORAGE_KEY = 'hue-chef-sound';

/**
 * Sound effects (WebAudio, fully synthesized — no audio assets).
 * The original five tones (click/success/error/drop/unlock) date from
 * the base game; Gói H8 extends the vocabulary for the sell loop and
 * the event modes, and adds a per-name throttle so simultaneous game
 * events (a serve + a coin + a pot landing in the same tick) never
 * stack into a harsh pile-up.
 */
export type SoundName =
  | 'click'
  | 'success'
  | 'error'
  | 'drop'
  | 'unlock'
  | 'buy'
  | 'coin'
  | 'cok'
  | 'bell'
  | 'serve'
  | 'potready'
  | 'alarm'
  | 'fixed'
  | 'chest'
  | 'checkin'
  | 'starup'
  | 'win'
  | 'lose'
  | 'feast';

interface SoundSettings {
  enabled: boolean;
}

let settings: SoundSettings = loadSettings();
let audioCtx: AudioContext | null = null;

function loadSettings(): SoundSettings {
  try {
    const raw = getJsonStorage<SoundSettings>(STORAGE_KEY);
    if (raw && typeof raw.enabled === 'boolean') {
      return raw;
    }
  } catch {
    // ignore
  }
  return { enabled: true };
}

function saveSettings(): void {
  setJsonStorage<SoundSettings>(STORAGE_KEY, settings);
}

function getCtx(): AudioContext | null {
  if (!settings.enabled) return null;
  if (audioCtx) {
    if (audioCtx.state === 'suspended') void audioCtx.resume().catch(() => undefined);
    return audioCtx;
  }
  try {
    const Ctor =
      (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext })
        .AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    audioCtx = new Ctor();
  } catch {
    return null;
  }
  return audioCtx;
}

function playTone(
  freq: number,
  durationMs: number,
  type: OscillatorType = 'sine',
  gain = 0.1,
  delayMs = 0,
): void {
  const ctx = getCtx();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(g).connect(ctx.destination);
    const now = ctx.currentTime + delayMs / 1000;
    g.gain.setValueAtTime(gain, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000);
    osc.start(now);
    osc.stop(now + durationMs / 1000 + 0.02);
  } catch {
    // ignore
  }
}

function playSweep(
  fromFreq: number,
  toFreq: number,
  durationMs: number,
  type: OscillatorType = 'triangle',
  gain = 0.07,
): void {
  const ctx = getCtx();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(fromFreq, now);
    osc.frequency.exponentialRampToValueAtTime(toFreq, now + durationMs / 1000);
    g.gain.setValueAtTime(gain, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000);
    osc.connect(g).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + durationMs / 1000 + 0.02);
  } catch {
    // ignore
  }
}

/** Minimum gap between two plays of the same sound (ms). */
const MIN_GAP: Partial<Record<SoundName, number>> = {
  alarm: 450,
  bell: 300,
  coin: 120,
  click: 60,
};
const DEFAULT_MIN_GAP = 90;
const lastPlayAt = new Map<SoundName, number>();

export function playSound(name: SoundName): void {
  if (!settings.enabled) return;
  const nowMs = performance.now();
  const gap = MIN_GAP[name] ?? DEFAULT_MIN_GAP;
  if (nowMs - (lastPlayAt.get(name) ?? -Infinity) < gap) return;
  lastPlayAt.set(name, nowMs);
  switch (name) {
    case 'click':
      playTone(720, 70, 'square', 0.05);
      break;
    case 'success':
      playTone(523, 110, 'sine', 0.08);
      playTone(659, 110, 'sine', 0.08, 90);
      playTone(784, 160, 'sine', 0.08, 190);
      break;
    case 'error':
      playTone(220, 180, 'sawtooth', 0.08);
      break;
    case 'drop':
      playTone(440, 80, 'triangle', 0.07);
      break;
    case 'unlock':
      playTone(659, 100, 'sine', 0.08);
      playTone(784, 100, 'sine', 0.08, 90);
      playTone(1046, 200, 'sine', 0.09, 190);
      break;
    case 'buy':
      // Spending: a short two-note descent, the mirror of 'coin'.
      playTone(659, 80, 'sine', 0.06);
      playTone(523, 110, 'sine', 0.06, 70);
      break;
    case 'coin':
      // Xu landing in the chest: bright two-blip coin.
      playTone(988, 70, 'sine', 0.07);
      playTone(1319, 140, 'sine', 0.07, 60);
      break;
    case 'cok':
      // Cok is rarer than xu — a three-note sparkle, higher and longer.
      playTone(1319, 90, 'sine', 0.06);
      playTone(1568, 90, 'sine', 0.06, 80);
      playTone(2093, 180, 'sine', 0.06, 160);
      break;
    case 'bell':
      // A new customer / new order: one clear service bell.
      playTone(1568, 320, 'sine', 0.06);
      playTone(2093, 240, 'sine', 0.03);
      break;
    case 'serve':
      playSweep(392, 784, 150, 'triangle', 0.07);
      break;
    case 'potready':
      // A background pot is done: warm rising steps.
      playTone(659, 100, 'triangle', 0.08);
      playTone(784, 100, 'triangle', 0.08, 85);
      playTone(988, 170, 'triangle', 0.08, 170);
      break;
    case 'alarm':
      // Kitchen incident: two low square pulses, urgent but not harsh.
      playTone(196, 130, 'square', 0.055);
      playTone(196, 130, 'square', 0.055, 180);
      break;
    case 'fixed':
      // Incident handled in time: quick rising repair arp.
      playTone(523, 80, 'sine', 0.07);
      playTone(659, 80, 'sine', 0.07, 70);
      playTone(784, 130, 'sine', 0.07, 140);
      break;
    case 'chest':
      // Quest-chain chest: unlock arp into a coin cascade.
      playTone(659, 90, 'sine', 0.07);
      playTone(784, 90, 'sine', 0.07, 80);
      playTone(988, 90, 'sine', 0.07, 160);
      playTone(1319, 160, 'sine', 0.07, 240);
      break;
    case 'checkin':
      playTone(784, 100, 'sine', 0.07);
      playTone(988, 160, 'sine', 0.07, 90);
      break;
    case 'starup':
      // Stall star gained: a small fanfare.
      playTone(523, 100, 'square', 0.045);
      playTone(659, 100, 'square', 0.045, 90);
      playTone(784, 100, 'square', 0.045, 180);
      playTone(1046, 220, 'square', 0.05, 270);
      break;
    case 'win':
      playTone(523, 110, 'sine', 0.08);
      playTone(659, 110, 'sine', 0.08, 95);
      playTone(784, 110, 'sine', 0.08, 190);
      playTone(1046, 240, 'sine', 0.09, 285);
      break;
    case 'lose':
      // A lost order / a failed run: soft descent, never punishing.
      playTone(392, 130, 'sine', 0.055);
      playTone(330, 130, 'sine', 0.055, 120);
      playTone(262, 200, 'sine', 0.055, 240);
      break;
    case 'feast':
      // Village feast served: bell over a warm arp.
      playTone(1568, 300, 'sine', 0.045);
      playTone(784, 100, 'triangle', 0.07, 40);
      playTone(988, 100, 'triangle', 0.07, 130);
      playTone(1175, 180, 'triangle', 0.07, 220);
      break;
  }
}

export function isSoundEnabled(): boolean {
  return settings.enabled;
}

export function setSoundEnabled(enabled: boolean): void {
  settings = { enabled: Boolean(enabled) };
  saveSettings();
}

export function toggleSound(): boolean {
  setSoundEnabled(!settings.enabled);
  return settings.enabled;
}
