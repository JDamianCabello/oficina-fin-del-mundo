// Sistema de partículas en Canvas 2D (capa a pantalla completa, sin eventos de
// puntero). Totalmente independiente de la economía: desactivarlo no cambia
// ningún cálculo. El bucle de animación solo corre mientras hay partículas.

import { drawFrame } from './sprites.js';

export const MAX_PARTICLES = 350;

const COLORS = {
  cyan: '#32F5C8',
  magenta: '#FF4FD8',
  yellow: '#FFD166',
  white: '#F4F4FA',
  grey: '#A9A9BC',
};

let canvas = null;
let ctx = null;
let dpr = 1;
let enabled = true;
let reduced = false;
let running = false;
let lastTime = 0;
const particles = [];

export function initParticles(target) {
  canvas = target;
  ctx = canvas.getContext('2d');
  resize();
  window.addEventListener('resize', resize);
}

function resize() {
  if (!canvas) return;
  dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = false;
}

export function setParticlesEnabled(value) {
  enabled = Boolean(value);
  if (!enabled) particles.length = 0;
}

export function setReducedMotion(value) {
  reduced = Boolean(value);
}

export function getParticleCount() {
  return particles.length;
}

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

/** Crea una partícula (respeta el máximo; descarta las más antiguas). */
function spawn(p) {
  if (particles.length >= MAX_PARTICLES) particles.shift();
  particles.push({
    x: 0, y: 0, vx: 0, vy: 0, gravity: 0, drag: 0, life: 1,
    size: 4, color: COLORS.white, kind: 'square', rotation: 0, spin: 0, text: '', fade: true,
    ...p,
    maxLife: p.life ?? 1,
  });
}

const PRESETS = {
  paper(x, y, n) {
    for (let i = 0; i < n; i++) {
      spawn({ kind: 'paper', x, y, vx: rand(-90, 90), vy: rand(-220, -80), gravity: 380, drag: 0.6, life: rand(0.8, 1.4),
        size: rand(5, 8), color: COLORS.white, rotation: rand(0, 6), spin: rand(-8, 8) });
    }
  },
  coin(x, y, n) {
    for (let i = 0; i < n; i++) {
      spawn({ kind: 'coin', x, y, vx: rand(-120, 120), vy: rand(-280, -140), gravity: 600, life: rand(0.7, 1.1), size: rand(5, 7), color: COLORS.yellow, spin: rand(8, 16) });
    }
  },
  spark(x, y, n) {
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2);
      const s = rand(60, 220);
      spawn({ kind: 'square', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, drag: 3, life: rand(0.3, 0.6), size: rand(2, 4), color: pick([COLORS.cyan, COLORS.yellow, COLORS.white]) });
    }
  },
  smoke(x, y, n) {
    for (let i = 0; i < n; i++) {
      spawn({ kind: 'sprite', frame: 2, x: x + rand(-6, 6), y, vx: rand(-10, 10), vy: rand(-40, -20), life: rand(1.2, 2), size: rand(18, 28), color: COLORS.grey, grow: 16, alpha: 0.35 });
    }
  },
  glow(x, y, n) {
    for (let i = 0; i < n; i++) {
      spawn({ kind: 'sprite', frame: 1, x: x + rand(-20, 20), y: y + rand(-10, 10), vx: rand(-15, 15), vy: rand(-50, -20), life: rand(0.6, 1.2), size: rand(16, 32), alpha: 0.8 });
    }
  },
  star(x, y, n) {
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2);
      const s = rand(80, 260);
      spawn({ kind: 'sprite', frame: 0, x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, drag: 2.5, life: rand(0.5, 0.9), size: rand(14, 26), alpha: 1, spin: rand(-4, 4) });
    }
  },
  confetti(x, y, n) {
    for (let i = 0; i < n; i++) {
      spawn({ kind: 'paper', x: x + rand(-30, 30), y, vx: rand(-260, 260), vy: rand(-520, -220), gravity: 520, drag: 1.2, life: rand(1.4, 2.4),
        size: rand(4, 7), color: pick([COLORS.cyan, COLORS.magenta, COLORS.yellow, COLORS.white]), rotation: rand(0, 6), spin: rand(-12, 12) });
    }
  },
  ascend(x, y, n) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    for (let i = 0; i < n; i++) {
      spawn({ kind: 'sprite', frame: pick([0, 1, 5]), x: rand(0, w), y: h + rand(0, 80), vx: rand(-20, 20), vy: rand(-520, -260), life: rand(1.4, 2.4), size: rand(14, 34), alpha: 0.9, spin: rand(-3, 3) });
    }
    void x;
    void y;
  },
};

/**
 * Emite partículas en coordenadas de pantalla (clientX/clientY).
 * type: 'paper' | 'coin' | 'spark' | 'smoke' | 'glow' | 'star' | 'confetti' | 'ascend'
 */
export function emit(type, x, y, count = 10) {
  if (!enabled || !ctx) return;
  const preset = PRESETS[type];
  if (!preset) return;
  const n = Math.max(1, Math.round(count * (reduced ? 0.3 : 1)));
  preset(x, y, n);
  start();
}

/** Texto flotante («+12») que sube y se desvanece. */
export function emitText(text, x, y, { color = COLORS.cyan, size = 22 } = {}) {
  if (!enabled || !ctx) return;
  spawn({ kind: 'text', text, x: x + rand(-8, 8), y, vx: 0, vy: reduced ? -20 : -70, life: 0.9, size, color });
  start();
}

function start() {
  if (running) return;
  running = true;
  lastTime = performance.now();
  requestAnimationFrame(frame);
}

function frame(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;
  update(dt);
  draw();
  if (particles.length > 0 && enabled) requestAnimationFrame(frame);
  else {
    running = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

function update(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= dt;
    if (p.life <= 0) {
      particles.splice(i, 1);
      continue;
    }
    p.vy += p.gravity * dt;
    if (p.drag) {
      const k = Math.max(0, 1 - p.drag * dt);
      p.vx *= k;
      p.vy *= k;
    }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    // Los papeles y el confeti ondean como una hoja al caer.
    if (p.kind === 'paper' && p.vy > 0) p.x += Math.sin((p.maxLife - p.life) * 9 + p.size) * 40 * dt;
    p.rotation += p.spin * dt;
    if (p.grow) p.size += p.grow * dt;
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
  for (const p of particles) {
    const t = Math.max(0, p.life / p.maxLife);
    const fade = p.fade ? Math.min(1, t * 2) : 1;
    ctx.globalAlpha = fade * (p.alpha ?? 1);
    switch (p.kind) {
      case 'text': {
        // Aparece con un pequeño salto de escala y luego sube despacio.
        const age = p.maxLife - p.life;
        const pop = age < 0.12 ? 0.6 + (age / 0.12) * 0.6 : age < 0.22 ? 1.2 - ((age - 0.12) / 0.1) * 0.2 : 1;
        ctx.font = `${Math.round(p.size * pop)}px 'Kenney Pixel', monospace`;
        ctx.textAlign = 'center';
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#10111B';
        ctx.strokeText(p.text, p.x, p.y);
        ctx.fillStyle = p.color;
        ctx.fillText(p.text, p.x, p.y);
        break;
      }
      case 'paper':
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size * 0.65, p.size, p.size * 1.3);
        if (p.color === COLORS.white) {
          ctx.fillStyle = '#A9A9BC';
          ctx.fillRect(-p.size / 2 + 1, -p.size * 0.3, p.size - 2, 1);
          ctx.fillRect(-p.size / 2 + 1, p.size * 0.1, p.size - 2, 1);
        }
        ctx.restore();
        break;
      case 'coin': {
        // Moneda girando: su anchura varía con el ángulo.
        const w = Math.max(1, p.size * Math.abs(Math.cos(p.rotation)));
        ctx.fillStyle = '#b8860b';
        ctx.fillRect(Math.round(p.x - w / 2), Math.round(p.y) - p.size / 2, w, p.size);
        ctx.fillStyle = p.color;
        if (w > 2) ctx.fillRect(Math.round(p.x - w / 2) + 1, Math.round(p.y) - p.size / 2 + 1, w - 2, p.size - 2);
        ctx.fillStyle = '#fff6d0';
        if (w > 3) ctx.fillRect(Math.round(p.x - w / 2) + 1, Math.round(p.y) - p.size / 2 + 1, 1, 1);
        break;
      }
      case 'sprite': {
        ctx.save();
        ctx.translate(p.x, p.y);
        if (p.rotation) ctx.rotate(p.rotation);
        ctx.globalCompositeOperation = p.frame === 2 ? 'source-over' : 'lighter';
        const scale = p.size / 32;
        drawFrame(ctx, 'particles', p.frame, -p.size / 2, -p.size / 2, { scale });
        ctx.restore();
        break;
      }
      default:
        ctx.fillStyle = p.color;
        ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
    }
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
}
