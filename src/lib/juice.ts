/**
 * "Nước sốt" — game feel helpers (Gói H8): a short vibration on
 * devices that support it, and a hand-rolled confetti burst painted
 * ONLY in Theme D colours (gold, brick red, cream — plan mục 2.4).
 * Hand-rolled instead of canvas-confetti so the package adds no
 * dependency and no bundle weight beyond these few lines; the burst
 * honours prefers-reduced-motion by simply not firing.
 */

const THEME_D_COLORS = ['#E9A23B', '#B03E26', '#FAF5EF'] as const;

export function buzz(pattern: number | number[]): void {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(pattern);
    }
  } catch {
    // ignore — vibration is a garnish, never a requirement
  }
}

function reducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

export type CelebrateKind = 'small' | 'big' | 'coins';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  vr: number;
  circle: boolean;
  life: number;
  maxLife: number;
}

const KIND_SETTINGS: Record<CelebrateKind, { count: number; power: number; circles: boolean }> = {
  small: { count: 36, power: 9, circles: false },
  big: { count: 110, power: 13, circles: false },
  coins: { count: 46, power: 10, circles: true },
};

let canvas: HTMLCanvasElement | null = null;
let ctx2d: CanvasRenderingContext2D | null = null;
let particles: Particle[] = [];
let rafId: number | null = null;
let lastFrame = 0;

function ensureCanvas(): CanvasRenderingContext2D | null {
  if (canvas && ctx2d) {
    if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    return ctx2d;
  }
  try {
    canvas = document.createElement('canvas');
    canvas.id = 'hue-chef-celebrate';
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.position = 'fixed';
    canvas.style.inset = '0';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '9999';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);
    ctx2d = canvas.getContext('2d');
  } catch {
    return null;
  }
  return ctx2d;
}

function frame(now: number): void {
  if (!ctx2d || !canvas) {
    rafId = null;
    return;
  }
  const dt = Math.min(0.05, (now - lastFrame) / 1000 || 0.016);
  lastFrame = now;
  ctx2d.clearRect(0, 0, canvas.width, canvas.height);
  particles = particles.filter((p) => p.life > 0);
  for (const p of particles) {
    p.life -= dt;
    p.vy += 900 * dt; // gravity
    p.vx *= 1 - 1.6 * dt; // drag
    p.vy *= 1 - 0.4 * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.rotation += p.vr * dt;
    const alpha = Math.max(0, Math.min(1, p.life / (p.maxLife * 0.45)));
    ctx2d.save();
    ctx2d.globalAlpha = alpha;
    ctx2d.translate(p.x, p.y);
    ctx2d.rotate(p.rotation);
    ctx2d.fillStyle = p.color;
    if (p.circle) {
      ctx2d.beginPath();
      ctx2d.arc(0, 0, p.size / 2, 0, Math.PI * 2);
      ctx2d.fill();
    } else {
      ctx2d.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
    }
    ctx2d.restore();
  }
  if (particles.length > 0) {
    rafId = window.requestAnimationFrame(frame);
  } else {
    ctx2d.clearRect(0, 0, canvas.width, canvas.height);
    rafId = null;
  }
}

/**
 * Fire a confetti burst. `origin` is in viewport fractions
 * (0..1, 0..1); default is bottom-centre, where rewards land.
 */
export function celebrate(
  kind: CelebrateKind = 'small',
  origin: { x: number; y: number } = { x: 0.5, y: 0.85 },
): void {
  if (typeof window === 'undefined' || reducedMotion()) return;
  const context = ensureCanvas();
  if (!context || !canvas) return;
  const { count, power, circles } = KIND_SETTINGS[kind];
  const ox = origin.x * canvas.width;
  const oy = origin.y * canvas.height;
  for (let i = 0; i < count; i += 1) {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.5;
    const speed = (0.45 + Math.random() * 0.75) * power * 60;
    const life = 1.1 + Math.random() * 0.9;
    particles.push({
      x: ox + (Math.random() - 0.5) * 30,
      y: oy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: circles ? 7 + Math.random() * 5 : 6 + Math.random() * 6,
      color: circles
        ? '#E9A23B'
        : THEME_D_COLORS[Math.floor(Math.random() * THEME_D_COLORS.length)],
      rotation: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 14,
      circle: circles,
      life,
      maxLife: life,
    });
  }
  // Cap the particle pool so stacked celebrations stay cheap.
  if (particles.length > 420) particles = particles.slice(particles.length - 420);
  if (rafId === null) {
    lastFrame = performance.now();
    rafId = window.requestAnimationFrame(frame);
  }
}
