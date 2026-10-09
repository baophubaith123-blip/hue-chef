import { getJsonStorage, setJsonStorage } from '@/lib/storage';

const STORAGE_KEY = 'hue-chef-sound';

type SoundName = 'click' | 'success' | 'error' | 'drop' | 'unlock';

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
  if (audioCtx) return audioCtx;
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

function playTone(freq: number, durationMs: number, type: OscillatorType = 'sine', gain = 0.1): void {
  const ctx = getCtx();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.value = gain;
    osc.connect(g).connect(ctx.destination);
    const now = ctx.currentTime;
    g.gain.setValueAtTime(gain, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000);
    osc.start(now);
    osc.stop(now + durationMs / 1000 + 0.02);
  } catch {
    // ignore
  }
}

export function playSound(name: SoundName): void {
  if (!settings.enabled) return;
  switch (name) {
    case 'click':
      playTone(720, 70, 'square', 0.05);
      break;
    case 'success':
      playTone(523, 110, 'sine', 0.08);
      setTimeout(() => playTone(659, 110, 'sine', 0.08), 90);
      setTimeout(() => playTone(784, 160, 'sine', 0.08), 190);
      break;
    case 'error':
      playTone(220, 180, 'sawtooth', 0.08);
      break;
    case 'drop':
      playTone(440, 80, 'triangle', 0.07);
      break;
    case 'unlock':
      playTone(659, 100, 'sine', 0.08);
      setTimeout(() => playTone(784, 100, 'sine', 0.08), 90);
      setTimeout(() => playTone(1046, 200, 'sine', 0.09), 190);
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

export type { SoundName };
