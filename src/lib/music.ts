import { getJsonStorage, setJsonStorage } from '@/lib/storage';

/**
 * Background music engine (Gói H8) — fully generative WebAudio.
 *
 * No audio files and no copyrighted material: every track is an
 * original pentatonic loop in a nhã-nhạc flavour, synthesized live
 * (plucked triangle strings, a soft sine bass, breath-noise ticks and
 * a low festival drum). Tracks follow the game state:
 *
 *   calm     — home / learning loop, slow and sparse
 *   stall    — the stall & market at a normal pace
 *   rush     — rush hour: the stall theme at a faster tempo with a
 *              denser percussion layer (điểm treo H5, closed here)
 *   festival — the Night Festival shift: its own ornamented melody
 *              over drum + shaker (điểm treo H7, closed here)
 *
 * Rules from the approved plan (Kế hoạch 1 + Phần 10, gói H8):
 * music starts only after the player's first interaction, ducks
 * itself while a cooking run is on screen, can be toggled off from a
 * always-visible control, and the choice is remembered across loads.
 */

export type MusicTrack = 'calm' | 'stall' | 'rush' | 'festival';
export type MusicArea = 'other' | 'player' | 'cooking' | 'stall' | 'market';

export interface MusicScene {
  track: MusicTrack | null;
  ducked: boolean;
}

/**
 * Pure scene resolution — the single source of truth the director
 * component feeds and the unit tests pin down.
 */
export function resolveMusicScene(input: {
  area: MusicArea;
  isPlayer: boolean;
  festival: boolean;
  rush: boolean;
}): MusicScene {
  if (!input.isPlayer || input.area === 'other') return { track: null, ducked: false };
  switch (input.area) {
    case 'cooking':
      // The run keeps the calm theme but ducks under the gestures.
      return { track: 'calm', ducked: true };
    case 'stall':
      if (input.festival) return { track: 'festival', ducked: false };
      if (input.rush) return { track: 'rush', ducked: false };
      return { track: 'stall', ducked: false };
    case 'market':
      return { track: 'stall', ducked: false };
    default:
      return { track: 'calm', ducked: false };
  }
}

/* ---------------- settings ---------------- */

const STORAGE_KEY = 'hue-chef-music';

interface MusicSettings {
  enabled: boolean;
  volume: number;
}

let settings: MusicSettings = loadMusicSettings();

function loadMusicSettings(): MusicSettings {
  try {
    const raw = getJsonStorage<MusicSettings>(STORAGE_KEY);
    if (raw && typeof raw.enabled === 'boolean') {
      return {
        enabled: raw.enabled,
        volume:
          typeof raw.volume === 'number' && raw.volume > 0 && raw.volume <= 1 ? raw.volume : 0.8,
      };
    }
  } catch {
    // ignore
  }
  // Default ON (per the approved music decision) — but the engine
  // still cannot make a sound before the first user interaction.
  return { enabled: true, volume: 0.8 };
}

function saveMusicSettings(): void {
  setJsonStorage<MusicSettings>(STORAGE_KEY, settings);
}

export function isMusicEnabled(): boolean {
  return settings.enabled;
}

export function setMusicEnabled(enabled: boolean): void {
  settings = { ...settings, enabled: Boolean(enabled) };
  saveMusicSettings();
  engine.onSettingsChanged();
}

export function toggleMusic(): boolean {
  setMusicEnabled(!settings.enabled);
  return settings.enabled;
}

/* ---------------- composition ---------------- */

/** Pentatonic ladder (C D E G A) across two octaves, semitone offsets. */
const SCALE = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21];
const ROOT_HZ = 261.63; // C4

function freqOf(degree: number): number {
  const idx = Math.max(0, Math.min(SCALE.length - 1, degree));
  return ROOT_HZ * Math.pow(2, SCALE[idx] / 12);
}

/** Bass roots per bar (C — A — F — G), as absolute semitone offsets. */
const BASS_ROOTS = [0, 9, 5, 7];

type Melody = ReadonlyArray<number>; // scale degree per 8th step, -1 = rest

const CALM_MELODY: Melody = [
  4, -1, 2, -1, 3, -1, -1, -1,
  2, -1, 1, -1, 0, -1, -1, -1,
  3, -1, 4, -1, 5, -1, 4, -1,
  2, -1, 1, -1, 0, -1, -1, -1,
];

const STALL_MELODY: Melody = [
  4, -1, 5, 4, 3, -1, 2, -1,
  1, 2, 3, -1, 2, -1, -1, -1,
  4, -1, 5, 4, 3, 2, 3, -1,
  2, -1, 1, -1, 0, -1, 2, -1,
];

const FESTIVAL_MELODY: Melody = [
  5, 4, 5, -1, 7, -1, 5, 4,
  3, -1, 4, 3, 2, -1, -1, -1,
  5, 4, 5, -1, 7, 8, 7, 5,
  4, -1, 3, -1, 2, -1, -1, -1,
];

interface TrackDef {
  bpm: number;
  melody: Melody;
  /** Extra harmony note a third above the melody on off-steps. */
  harmony: boolean;
  bassGain: number;
  /** Percussion: 'none' | 'soft' (offbeat ticks) | 'full' (drum + ticks). */
  percussion: 'none' | 'soft' | 'full';
  melodyGain: number;
}

const TRACKS: Record<MusicTrack, TrackDef> = {
  calm: { bpm: 72, melody: CALM_MELODY, harmony: false, bassGain: 0.05, percussion: 'none', melodyGain: 0.11 },
  stall: { bpm: 96, melody: STALL_MELODY, harmony: false, bassGain: 0.07, percussion: 'soft', melodyGain: 0.12 },
  rush: { bpm: 138, melody: STALL_MELODY, harmony: true, bassGain: 0.08, percussion: 'full', melodyGain: 0.12 },
  festival: { bpm: 112, melody: FESTIVAL_MELODY, harmony: false, bassGain: 0.08, percussion: 'full', melodyGain: 0.13 },
};

const STEPS_PER_LOOP = 32; // 4 bars of 8th notes

/* ---------------- engine ---------------- */

const DUCK_LEVEL = 0.32;

class MusicEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private duckGain: GainNode | null = null;
  private timer: number | null = null;
  private step = 0;
  private nextTime = 0;
  private current: MusicTrack | null = null;
  private pending: MusicTrack | null = null;
  private desired: MusicTrack | null = null;
  private ducked = false;
  private armed = false;
  private unlocked = false;
  private noiseBuffer: AudioBuffer | null = null;

  /** Register the one-time first-interaction unlock. Idempotent. */
  arm(): void {
    if (this.armed) return;
    this.armed = true;
    const unlock = () => this.unlock();
    window.addEventListener('pointerdown', unlock, { capture: true });
    window.addEventListener('keydown', unlock, { capture: true });
    this.mirrorState();
  }

  private unlock(): void {
    if (this.unlocked) return;
    this.unlocked = true;
    if (!settings.enabled) {
      this.mirrorState();
      return;
    }
    this.ensureContext();
    if (this.desired) this.startTrack(this.desired);
    this.mirrorState();
  }

  onSettingsChanged(): void {
    if (!settings.enabled) {
      this.stopScheduler(0.25);
      this.current = null;
      this.pending = null;
    } else if (this.unlocked && this.desired) {
      this.ensureContext();
      this.startTrack(this.desired);
    }
    this.mirrorState();
  }

  /** The director's only entry point: where the music should be now. */
  applyScene(scene: MusicScene): void {
    this.desired = scene.track;
    this.setDucked(scene.ducked);
    if (!settings.enabled || !this.unlocked) {
      this.mirrorState();
      return;
    }
    if (!scene.track) {
      this.stopScheduler(0.4);
      this.current = null;
      this.pending = null;
      this.mirrorState();
      return;
    }
    this.ensureContext();
    if (!this.current) {
      this.startTrack(scene.track);
    } else if (this.current !== scene.track) {
      // Switch at the next bar line so the loop never tears mid-phrase.
      this.pending = scene.track;
    }
    this.mirrorState();
  }

  private setDucked(ducked: boolean): void {
    if (this.ducked === ducked) return;
    this.ducked = ducked;
    if (this.ctx && this.duckGain) {
      const now = this.ctx.currentTime;
      this.duckGain.gain.cancelScheduledValues(now);
      this.duckGain.gain.setValueAtTime(this.duckGain.gain.value, now);
      this.duckGain.gain.linearRampToValueAtTime(ducked ? DUCK_LEVEL : 1, now + 0.35);
    }
    this.mirrorState();
  }

  private ensureContext(): void {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume().catch(() => undefined);
      return;
    }
    try {
      const Ctor =
        (window as unknown as { AudioContext?: typeof AudioContext }).AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = settings.volume * 0.55;
      this.duckGain = this.ctx.createGain();
      this.duckGain.gain.value = this.ducked ? DUCK_LEVEL : 1;
      this.duckGain.connect(this.master).connect(this.ctx.destination);
      // One shared breath-noise buffer for ticks / shakers.
      const len = Math.floor(this.ctx.sampleRate * 0.05);
      this.noiseBuffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < len; i += 1) data[i] = Math.random() * 2 - 1;
    } catch {
      this.ctx = null;
    }
  }

  private startTrack(track: MusicTrack): void {
    if (!this.ctx || !this.master) return;
    this.current = track;
    this.pending = null;
    this.step = 0;
    this.nextTime = this.ctx.currentTime + 0.06;
    if (this.timer !== null) window.clearInterval(this.timer);
    this.timer = window.setInterval(() => this.schedule(), 90);
    this.mirrorState();
  }

  private stopScheduler(fadeSeconds: number): void {
    if (this.timer !== null) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
    if (this.ctx && this.master) {
      const now = this.ctx.currentTime;
      this.master.gain.cancelScheduledValues(now);
      this.master.gain.setValueAtTime(this.master.gain.value, now);
      this.master.gain.linearRampToValueAtTime(0.0001, now + fadeSeconds);
      // Restore full level for the next start, after the fade lands.
      this.master.gain.setValueAtTime(settings.volume * 0.55, now + fadeSeconds + 0.05);
    }
  }

  private schedule(): void {
    if (!this.ctx || !this.current) return;
    const def = TRACKS[this.current];
    const stepDur = 60 / def.bpm / 2;
    while (this.nextTime < this.ctx.currentTime + 0.18) {
      this.scheduleStep(this.current, this.step, this.nextTime);
      this.nextTime += stepDur;
      this.step += 1;
      if (this.step >= STEPS_PER_LOOP) {
        this.step = 0;
        if (this.pending && this.pending !== this.current) {
          this.current = this.pending;
          this.pending = null;
          this.mirrorState();
        }
      }
    }
  }

  private scheduleStep(track: MusicTrack, step: number, time: number): void {
    const def = TRACKS[track];
    const degree = def.melody[step];
    if (degree >= 0) {
      this.pluck(freqOf(degree), time, 0.55, def.melodyGain);
      if (def.harmony && step % 2 === 1) {
        this.pluck(freqOf(Math.min(degree + 2, SCALE.length - 1)), time, 0.3, def.melodyGain * 0.45);
      }
    }
    if (step % 8 === 0) {
      const bar = Math.floor(step / 8) % BASS_ROOTS.length;
      const bassHz = (ROOT_HZ / 2) * Math.pow(2, BASS_ROOTS[bar] / 12);
      this.bass(bassHz, time, def.bassGain);
    }
    if (def.percussion === 'soft' && step % 4 === 2) {
      this.tick(time, 0.018);
    }
    if (def.percussion === 'full') {
      if (step % 8 === 0 || step % 8 === 4) this.drum(time, 0.11);
      if (step % 2 === 1) this.tick(time, 0.014);
    }
  }

  private pluck(freq: number, time: number, dur: number, gain: number): void {
    if (!this.ctx || !this.duckGain) return;
    try {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1900;
      osc.type = 'triangle';
      osc.frequency.value = freq;
      g.gain.setValueAtTime(gain, time);
      g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
      osc.connect(filter).connect(g).connect(this.duckGain);
      osc.start(time);
      osc.stop(time + dur + 0.02);
    } catch {
      // ignore
    }
  }

  private bass(freq: number, time: number, gain: number): void {
    if (!this.ctx || !this.duckGain) return;
    try {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      g.gain.setValueAtTime(gain, time);
      g.gain.exponentialRampToValueAtTime(0.0001, time + 1.1);
      osc.connect(g).connect(this.duckGain);
      osc.start(time);
      osc.stop(time + 1.15);
    } catch {
      // ignore
    }
  }

  private tick(time: number, gain: number): void {
    if (!this.ctx || !this.duckGain || !this.noiseBuffer) return;
    try {
      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 6000;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(gain, time);
      g.gain.exponentialRampToValueAtTime(0.0001, time + 0.045);
      src.connect(filter).connect(g).connect(this.duckGain);
      src.start(time);
      src.stop(time + 0.06);
    } catch {
      // ignore
    }
  }

  private drum(time: number, gain: number): void {
    if (!this.ctx || !this.duckGain) return;
    try {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, time);
      osc.frequency.exponentialRampToValueAtTime(58, time + 0.16);
      g.gain.setValueAtTime(gain, time);
      g.gain.exponentialRampToValueAtTime(0.0001, time + 0.22);
      osc.connect(g).connect(this.duckGain);
      osc.start(time);
      osc.stop(time + 0.25);
    } catch {
      // ignore
    }
  }

  /** Mirror the live state onto <html> data attributes (bot checks). */
  private mirrorState(): void {
    try {
      const el = document.documentElement;
      el.dataset.musicEnabled = settings.enabled ? '1' : '0';
      el.dataset.musicPlaying = this.current && this.timer !== null ? '1' : '0';
      el.dataset.musicTrack = this.current ?? this.desired ?? 'none';
      el.dataset.musicDucked = this.ducked ? '1' : '0';
    } catch {
      // ignore
    }
  }
}

const engine = new MusicEngine();

export function armMusic(): void {
  engine.arm();
}

export function applyMusicScene(scene: MusicScene): void {
  engine.applyScene(scene);
}
