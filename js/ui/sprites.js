// Sistema de sprites: hojas configurables (tamaño de fotograma, columnas,
// separación), animaciones con nombre (fotogramas, fps, bucle) y pixel art
// propio rasterizado. No presupone que todas las hojas tengan el mismo formato.

import { PIXEL_ART, rasterize, recolor } from './pixelArt.js';

/** Hojas de sprites. Ver ASSET_CREDITS.md para su procedencia. */
export const SHEETS = {
  platformerChars: { src: 'assets/sprites/kenney/platformer-characters.png', frameW: 24, frameH: 24, cols: 9, spacing: 0 },
  industrial: { src: 'assets/sprites/kenney/industrial-tiles.png', frameW: 18, frameH: 18, cols: 16, spacing: 0 },
  dungeon: { src: 'assets/sprites/kenney/tiny-dungeon.png', frameW: 16, frameH: 16, cols: 12, spacing: 0 },
  particles: { src: 'assets/sprites/kenney/particles-atlas.png', frameW: 32, frameH: 32, cols: 6, spacing: 0 },
  minotaur: { src: 'assets/sprites/reaktori/sprMinotaur1.png', frameW: 31, frameH: 24, cols: 4, spacing: 0 },
  ghost: { src: 'assets/sprites/reaktori/sprGhost1.png', frameW: 19, frameH: 28, cols: 4, spacing: 0 },
  ghostPurple: { src: 'assets/sprites/reaktori/sprGhost3.png', frameW: 19, frameH: 28, cols: 4, spacing: 0 },
  lizard: { src: 'assets/sprites/reaktori/sprLizardMonk1.png', frameW: 21, frameH: 20, cols: 4, spacing: 0 },
  wizard: { src: 'assets/sprites/reaktori/sprWizard.png', frameW: 26, frameH: 18, cols: 7, spacing: 0 },
  dragon: { src: 'assets/sprites/reaktori/sprDragon.png', frameW: 70, frameH: 73, cols: 6, spacing: 0 },
  skeleton: { src: 'assets/sprites/reaktori/sprSkeleton1.png', frameW: 19, frameH: 20, cols: 4, spacing: 0 },
  goblin: { src: 'assets/sprites/reaktori/sprGoblin3.png', frameW: 25, frameH: 25, cols: 4, spacing: 0 },
  sparkle: { src: 'assets/sprites/reaktori/sprSparkle.png', frameW: 7, frameH: 7, cols: 4, spacing: 0 },
  explosion: { src: 'assets/sprites/reaktori/sprExplosion.png', frameW: 51, frameH: 51, cols: 5, spacing: 0 },
  magicExplosion: { src: 'assets/sprites/reaktori/sprMagicExplosion.png', frameW: 13, frameH: 13, cols: 4, spacing: 0 },
};

/**
 * Animaciones con nombre. `sheet` puede ser una hoja de SHEETS o un sprite de
 * PIXEL_ART (con prefijo «px:»). `frames` son índices de fotograma.
 */
export const ANIMATIONS = {
  alienGreen: { sheet: 'platformerChars', frames: [0, 1], fps: 4 },
  alienBlue: { sheet: 'platformerChars', frames: [2, 3], fps: 4 },
  alienPink: { sheet: 'platformerChars', frames: [4, 5], fps: 4 },
  alienYellow: { sheet: 'platformerChars', frames: [6, 7], fps: 4 },
  humanHelmet: { sheet: 'platformerChars', frames: [9, 10], fps: 4 },
  boxFace: { sheet: 'platformerChars', frames: [11, 12], fps: 3 },
  flyingBot: { sheet: 'platformerChars', frames: [24, 25, 26, 25], fps: 8 },
  bigBot: { sheet: 'platformerChars', frames: [21, 22], fps: 4 },
  smallBot: { sheet: 'platformerChars', frames: [18, 19], fps: 5 },
  spikeBot: { sheet: 'platformerChars', frames: [15, 16], fps: 5 },
  minotaurWalk: { sheet: 'minotaur', frames: [0, 1, 2, 3], fps: 6 },
  ghostFloat: { sheet: 'ghost', frames: [0, 1, 2, 3], fps: 5 },
  ghostPurpleFloat: { sheet: 'ghostPurple', frames: [0, 1, 2, 3], fps: 5 },
  lizardWalk: { sheet: 'lizard', frames: [0, 1, 2, 3], fps: 6 },
  wizardWalk: { sheet: 'wizard', frames: [0, 1, 2, 3], fps: 6 },
  wizardCast: { sheet: 'wizard', frames: [4, 5, 6, 5], fps: 4 },
  dragonIdle: { sheet: 'dragon', frames: [0, 1, 2, 3, 4, 5], fps: 6 },
  skeletonWalk: { sheet: 'skeleton', frames: [0, 1, 2, 3], fps: 6 },
  goblinWalk: { sheet: 'goblin', frames: [0, 1, 2, 3], fps: 8 },
  sparkle: { sheet: 'sparkle', frames: [0, 1, 2, 3], fps: 10, loop: false },
  explosion: { sheet: 'explosion', frames: [0, 1, 2, 3, 4], fps: 14, loop: false },
  portal: { sheet: 'magicExplosion', frames: [0, 1, 2, 3], fps: 8 },
  printerIdle: { sheet: 'px:printer', frames: [0], fps: 1 },
  printerPrint: { sheet: 'px:printer', frames: [0, 1], fps: 5 },
  dimPrinterPrint: { sheet: 'px:dimPrinter', frames: [0, 1], fps: 6 },
  pigeonIdle: { sheet: 'px:pigeon', frames: [0, 0, 0, 1, 0, 1], fps: 3 },
  pigeonFly: { sheet: 'px:pigeon', frames: [2, 3], fps: 10 },
  bossIdle: { sheet: 'px:boss', frames: [0, 0, 0, 1], fps: 2 },
  bossTalk: { sheet: 'px:boss', frames: [0, 1], fps: 5 },
  serverBlink: { sheet: 'px:server', frames: [0, 1], fps: 2 },
};

const images = {};
const pixelFrames = {};
let loaded = false;

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => {
      console.warn(`[sprites] No se pudo cargar ${src}; se usará un marcador.`);
      resolve(null);
    };
    img.src = src;
  });
}

/** Carga todas las hojas y rasteriza el pixel art. Nunca rechaza. */
export async function loadSprites() {
  const entries = await Promise.all(Object.entries(SHEETS).map(async ([id, def]) => [id, await loadImage(def.src)]));
  for (const [id, img] of entries) images[id] = img;
  for (const [name, def] of Object.entries(PIXEL_ART)) pixelFrames[name] = rasterize(def);
  // Variantes recoloreadas.
  pixelFrames.dimPrinter = rasterize(recolor(PIXEL_ART.printer, { g: '#8e44ad', G: '#ff4fd8', d: '#4a235a', c: '#32f5c8', r: '#32f5c8' }));
  pixelFrames.goldPrinter = rasterize(recolor(PIXEL_ART.printer, { g: '#e0a800', G: '#ffd166', d: '#7a5200' }));
  pixelFrames.bossRed = rasterize(recolor(PIXEL_ART.boss, { s: '#5a1a2a', S: '#8e2b45', m: '#ffd166' }));
  pixelFrames.bossHolo = rasterize(recolor(PIXEL_ART.boss, { s: '#1a4a5a', S: '#32f5c8', f: '#a8fff0', h: '#2bb5a0', m: '#ff4fd8' }));
  loaded = true;
  return { images, pixelFrames };
}

export function isLoaded() {
  return loaded;
}

/** Dibuja el fotograma `index` de una hoja (o de un pixel art con «px:»). */
export function drawFrame(ctx, sheetId, index, dx, dy, { flip = false, scale = 1, alpha = 1 } = {}) {
  let source;
  let sx = 0;
  let sy = 0;
  let w;
  let h;
  if (sheetId.startsWith('px:')) {
    const frames = pixelFrames[sheetId.slice(3)];
    source = frames?.[index % (frames?.length || 1)];
    if (!source) return drawPlaceholder(ctx, dx, dy, 12, 12);
    w = source.width;
    h = source.height;
  } else {
    const def = SHEETS[sheetId];
    source = images[sheetId];
    if (!def || !source) return drawPlaceholder(ctx, dx, dy, def?.frameW ?? 16, def?.frameH ?? 16);
    w = def.frameW;
    h = def.frameH;
    sx = (index % def.cols) * (w + def.spacing);
    sy = Math.floor(index / def.cols) * (h + def.spacing);
  }
  const dw = w * scale;
  const dh = h * scale;
  const prevAlpha = ctx.globalAlpha;
  if (alpha !== 1) ctx.globalAlpha = prevAlpha * alpha;
  if (flip) {
    ctx.save();
    ctx.translate(Math.round(dx + dw), Math.round(dy));
    ctx.scale(-1, 1);
    ctx.drawImage(source, sx, sy, w, h, 0, 0, dw, dh);
    ctx.restore();
  } else {
    ctx.drawImage(source, sx, sy, w, h, Math.round(dx), Math.round(dy), dw, dh);
  }
  ctx.globalAlpha = prevAlpha;
  return { w: dw, h: dh };
}

function drawPlaceholder(ctx, x, y, w, h) {
  ctx.fillStyle = '#ff4fd8';
  ctx.fillRect(Math.round(x), Math.round(y), w, h);
  return { w, h };
}

/** Índice de fotograma de una animación en el instante `timeMs`. */
export function getAnimFrame(animId, timeMs) {
  const anim = ANIMATIONS[animId];
  if (!anim) return 0;
  const step = Math.floor((timeMs / 1000) * anim.fps);
  const i = anim.loop === false ? Math.min(step, anim.frames.length - 1) : step % anim.frames.length;
  return anim.frames[i];
}

export function isAnimFinished(animId, timeMs) {
  const anim = ANIMATIONS[animId];
  return Boolean(anim) && anim.loop === false && (timeMs / 1000) * anim.fps >= anim.frames.length;
}

export function drawAnim(ctx, animId, timeMs, dx, dy, opts) {
  const anim = ANIMATIONS[animId];
  if (!anim) return null;
  return drawFrame(ctx, anim.sheet, getAnimFrame(animId, timeMs), dx, dy, opts);
}

/** Tamaño de un fotograma de una hoja o pixel art. */
export function frameSize(sheetId) {
  if (sheetId.startsWith('px:')) {
    const f = pixelFrames[sheetId.slice(3)]?.[0];
    return f ? { w: f.width, h: f.height } : { w: 12, h: 12 };
  }
  const def = SHEETS[sheetId];
  return def ? { w: def.frameW, h: def.frameH } : { w: 16, h: 16 };
}

// ─── Iconos para la interfaz ──────────────────────────────────────────────

/** Icono de cada edificio: hoja + fotograma (o dibujo procedural). */
export const ICONS = {
  printer: { sheet: 'px:printer', index: 1 },
  intern: { sheet: 'dungeon', index: 88 },
  pigeon: { sheet: 'px:pigeon', index: 0 },
  boss: { sheet: 'px:boss', index: 0 },
  reactor: { sheet: 'industrial', index: 60 },
  meeting: { sheet: 'industrial', index: 85 },
  minotaur: { sheet: 'minotaur', index: 0 },
  dimPrinter: { sheet: 'px:dimPrinter', index: 1 },
  universe: { procedural: 'planet' },
  ghost: { sheet: 'ghost', index: 0 },
  wizard: { sheet: 'wizard', index: 4 },
  lizard: { sheet: 'lizard', index: 0 },
  dragon: { sheet: 'dragon', index: 0 },
  timeRobot: { sheet: 'platformerChars', index: 21 },
  quantum: { sheet: 'platformerChars', index: 24 },
  goldPrinter: { sheet: 'px:goldPrinter', index: 1 },
  voidCoffee: { sheet: 'px:coffee', index: 0 },
  shareholder: { sheet: 'goblin', index: 0 },
  entropy: { sheet: 'platformerChars', index: 15 },
};

const iconCache = new Map();

export function drawPlanet(ctx, cx, cy, r, t = 0, colors = ['#ff4fd8', '#8e44ad', '#ffd166']) {
  ctx.fillStyle = colors[1];
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors[0];
  ctx.beginPath();
  ctx.arc(cx - r * 0.25, cy - r * 0.25, r * 0.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = colors[2];
  ctx.lineWidth = Math.max(1, r * 0.18);
  ctx.beginPath();
  ctx.ellipse(cx, cy, r * 1.6, r * 0.45, -0.3 + Math.sin(t) * 0.05, 0, Math.PI * 2);
  ctx.stroke();
}

/** Devuelve un data URL de 32×32 con el icono (cacheado). */
export function getIconURL(key) {
  if (iconCache.has(key)) return iconCache.get(key);
  const def = ICONS[key];
  const size = 32;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  if (!def) {
    ctx.fillStyle = '#ff4fd8';
    ctx.fillRect(8, 8, 16, 16);
  } else if (def.procedural === 'planet') {
    drawPlanet(ctx, 16, 16, 8);
  } else {
    const { w, h } = frameSize(def.sheet);
    const scale = Math.max(1, Math.floor(Math.min(size / w, size / h)));
    const fit = Math.min(scale, size / Math.max(w, h));
    drawFrame(ctx, def.sheet, def.index, (size - w * fit) / 2, (size - h * fit) / 2, { scale: fit });
  }
  const url = canvas.toDataURL();
  if (loaded) iconCache.set(key, url);
  return url;
}
