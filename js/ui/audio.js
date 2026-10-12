// Efectos de sonido sintetizados con Web Audio (no hay archivos de audio:
// así el juego no depende de recursos externos y funciona sin conexión).

let ctx = null;
let enabled = true;
const lastPlay = {};

function getContext() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try {
      ctx = new AC();
    } catch {
      return null;
    }
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

/**
 * Los navegadores solo permiten iniciar el audio tras un gesto del usuario.
 * Se crea y reanuda el contexto en la primera interacción, de modo que los
 * sonidos posteriores lanzados por temporizadores (eventos, formularios
 * dorados) también suenen.
 */
export function initAudioUnlock() {
  const unlock = () => {
    const ac = getContext();
    if (ac && ac.state === 'running') {
      window.removeEventListener('pointerdown', unlock, true);
      window.removeEventListener('keydown', unlock, true);
    }
  };
  window.addEventListener('pointerdown', unlock, true);
  window.addEventListener('keydown', unlock, true);
}

export function setSoundEnabled(value) {
  enabled = Boolean(value);
}

function tone(ac, { freq, to = freq, duration = 0.08, type = 'square', volume = 0.05, delay = 0 }) {
  const t0 = ac.currentTime + delay;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (to !== freq) osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), t0 + duration);
  gain.gain.setValueAtTime(volume, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

const SOUNDS = {
  click: (ac) => tone(ac, { freq: 520 + Math.random() * 80, to: 300, duration: 0.05, volume: 0.03 }),
  crit: (ac) => { tone(ac, { freq: 880, to: 1320, duration: 0.09, volume: 0.05 }); tone(ac, { freq: 1320, duration: 0.08, delay: 0.06, volume: 0.04 }); },
  buy: (ac) => { tone(ac, { freq: 440, duration: 0.06 }); tone(ac, { freq: 660, duration: 0.08, delay: 0.05 }); },
  upgrade: (ac) => [523, 659, 784].forEach((f, i) => tone(ac, { freq: f, duration: 0.09, delay: i * 0.06, volume: 0.045 })),
  achievement: (ac) => [523, 659, 784, 1046].forEach((f, i) => tone(ac, { freq: f, duration: 0.14, delay: i * 0.09, type: 'triangle', volume: 0.07 })),
  error: (ac) => tone(ac, { freq: 180, to: 120, duration: 0.12, type: 'sawtooth', volume: 0.03 }),
  event: (ac) => { tone(ac, { freq: 740, duration: 0.12, volume: 0.05 }); tone(ac, { freq: 554, duration: 0.16, delay: 0.14, volume: 0.05 }); },
  golden: (ac) => [988, 1319, 1568].forEach((f, i) => tone(ac, { freq: f, duration: 0.1, delay: i * 0.05, type: 'triangle', volume: 0.06 })),
  prestige: (ac) => { tone(ac, { freq: 110, to: 880, duration: 1.2, type: 'sawtooth', volume: 0.05 }); tone(ac, { freq: 220, to: 1760, duration: 1.2, type: 'triangle', volume: 0.04, delay: 0.1 }); },
  department: (ac) => [392, 523, 659, 784, 1046].forEach((f, i) => tone(ac, { freq: f, duration: 0.12, delay: i * 0.08, volume: 0.05 })),
};

/** Reproduce un sonido (limitado para no saturar con clics rápidos). */
export function play(name) {
  if (!enabled) return;
  const now = performance.now();
  const minGap = name === 'click' ? 35 : 60;
  if (now - (lastPlay[name] ?? 0) < minGap) return;
  lastPlay[name] = now;
  const ac = getContext();
  if (!ac || !SOUNDS[name]) return;
  try {
    SOUNDS[name](ac);
  } catch {
    /* audio no disponible: el juego continúa en silencio */
  }
}
