// Escena de la oficina: canvas de 384×216 escalado con píxeles nítidos.
// Representa visualmente el estado del juego: cada edificio comprado añade
// personajes o máquinas, cada departamento cambia la decoración y los eventos
// provocan reacciones. Solo LEE el estado; nunca lo modifica.

import { drawFrame, drawAnim, frameSize, drawPlanet, getAnimFrame } from './sprites.js';
import { DEPARTMENTS } from '../config/departments.data.js';

export const SCENE_W = 384;
export const SCENE_H = 216;
const FLOOR_Y = 150;
const WALK_MIN_Y = 176;
const WALK_MAX_Y = 210;

const DEPARTMENT_STYLE = {
  basement: { wall: '#262a40', wall2: '#20243a', floor: '#1b1d2c', floor2: '#232638', sign: 'SÓTANO -1', signColor: '#ffd166', light: '#ffd16622' },
  exploitation: { wall: '#2b2546', wall2: '#241f3c', floor: '#1d1b2e', floor2: '#28243e', sign: 'EXPLOTACIÓN LABORAL', signColor: '#32f5c8', light: '#32f5c81c' },
  hellHR: { wall: '#3d1d2c', wall2: '#331826', floor: '#24121b', floor2: '#311924', sign: 'RR.HH. DEL INFIERNO', signColor: '#ff6b6b', light: '#ff4f4f26' },
  multinational: { wall: '#1b2c40', wall2: '#172537', floor: '#121b27', floor2: '#1a2534', sign: 'MULTINACIONAL INTERDIMENSIONAL', signColor: '#ff4fd8', light: '#ff4fd81f' },
  board: { wall: '#3a2f14', wall2: '#2e250f', floor: '#1d170a', floor2: '#2a2110', sign: 'CONSEJO DEL MULTIVERSO', signColor: '#ffd166', light: '#ffd16633' },
  timeOffice: { wall: '#173a3a', wall2: '#123030', floor: '#0e2020', floor2: '#143030', sign: 'GASTOS TEMPORALES', signColor: '#32f5c8', light: '#32f5c830' },
  quantumBureau: { wall: '#1a1a3d', wall2: '#141433', floor: '#0e0e24', floor2: '#16163a', sign: 'BUROCRACIA CUÁNTICA', signColor: '#9b8cff', light: '#9b8cff2a' },
  altReality: { wall: '#3d1a3a', wall2: '#331530', floor: '#220e20', floor2: '#2e142c', sign: 'REALIDADES ALTERNATIVAS', signColor: '#ff4fd8', light: '#ff4fd82e' },
  voidHQ: { wall: '#0c0c12', wall2: '#08080d', floor: '#050508', floor2: '#0b0b12', sign: 'SEDE EN EL VACÍO', signColor: '#f4f4fa', light: '#f4f4fa14' },
  primordialBoard: { wall: '#3d2e0a', wall2: '#332608', floor: '#1f1805', floor2: '#2b2108', sign: 'ACCIONISTAS PRIMORDIALES', signColor: '#ffd166', light: '#ffd16638' },
  endOfTime: { wall: '#2d0f0f', wall2: '#250b0b', floor: '#160606', floor2: '#210909', sign: 'EL FINAL DEL TIEMPO', signColor: '#ff6b35', light: '#ff6b3530' },
  adminGod: { wall: '#2a1747', wall2: '#22123b', floor: '#170f27', floor2: '#211638', sign: 'DESPACHO DEL DIOS ADMINISTRATIVO', signColor: '#ffd166', light: '#ffd16626' },
};

const CHATTER = [
  '¿Esto lo firmo yo?', 'Reunión a las 5', '¿Dónde está el 404-B?', 'Mi contrato es un pósit',
  'Las palomas me miran raro', '¿Quién ha clonado al jefe?', 'Ctrl+C, Ctrl+V, Ctrl+fin del mundo',
  'Esto es un trámite', 'Vuelva usted mañana', 'Falta un sello', 'Por triplicado, por favor',
  'Hoy no hay café', '¿El apocalipsis entra en mis horas?', 'Cuadra. No sé cómo, pero cuadra',
];

const SHAREHOLDER_CHATTER = ['Dividendos', 'Quiero mi 3 %', 'Vendo galaxias', '¡Compro!', 'Bajista, como siempre'];
const BOT_CHATTER = ['Viaje aprobado', 'Ayer vuelvo', 'Bip. Factura.', '01001111 01001011'];

/** Rebote elástico (sale de 0, se pasa un poco de 1 y vuelve). */
function easeOutBack(t) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

const PIGEON_PERCHES = [
  { x: 20, y: 14 }, { x: 60, y: 14 }, { x: 110, y: 14 }, { x: 260, y: 14 }, { x: 320, y: 14 }, { x: 360, y: 14 },
  { x: 150, y: 88 }, { x: 232, y: 88 }, { x: 30, y: 94 }, { x: 80, y: 94 }, { x: 186, y: 168 }, { x: 208, y: 168 },
];

const INTERN_ANIMS = [
  { sheet: 'dungeon', index: 85 }, { sheet: 'dungeon', index: 86 }, { sheet: 'dungeon', index: 87 }, { sheet: 'dungeon', index: 88 },
  { sheet: 'dungeon', index: 98 }, { sheet: 'dungeon', index: 99 }, { sheet: 'dungeon', index: 100 }, { sheet: 'dungeon', index: 112 },
];

const INTERN_DESKS = [{ x: 42, y: 186 }, { x: 328, y: 186 }, { x: 96, y: 204 }, { x: 270, y: 204 }];

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

export function createScene(canvas, { getState, isReducedMotion }) {
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const background = document.createElement('canvas');
  background.width = SCENE_W;
  background.height = SCENE_H;
  // Factor de resolución interna: la escena se dibuja en coordenadas lógicas
  // (384×216) pero el canvas tiene tantos píxeles como la pantalla, así los
  // sprites siguen nítidos (sin suavizado) y el texto se ve definido.
  let k = 1;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const next = Math.max(1, Math.min(6, Math.ceil(((rect.width || SCENE_W) * dpr) / SCENE_W)));
    if (next === k && canvas.width === SCENE_W * k) return;
    k = next;
    canvas.width = SCENE_W * k;
    canvas.height = SCENE_H * k;
    background.width = SCENE_W * k;
    background.height = SCENE_H * k;
    ctx.imageSmoothingEnabled = false;
    backgroundKey = '';
  }
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);
  window.addEventListener('resize', resize);
  let backgroundKey = '';

  const actors = []; // personajes y criaturas con movimiento
  const effects = []; // animaciones puntuales (chispas, explosiones)
  const bubbles = []; // bocadillos de texto
  let running = false;
  let lastTime = 0;
  let time = 0;
  let typingT = 0;
  const screenLines = [];
  let flashT = 0;
  let shakeT = 0;
  let celebrateT = 0;
  let printerShakeT = 0;
  let chatterTimer = 6;
  let smokeTimer = 0;
  let onSmoke = null;
  let counts = {};
  const ripples = []; // ondas al hacer clic
  const flyingPapers = []; // folios que vuelan del escritorio a la pila
  const motes = Array.from({ length: 22 }, () => ({ x: rand(120, 264), y: rand(30, 200), s: rand(0.3, 1), p: rand(0, 6.3) }));
  const envelopes = Array.from({ length: 10 }, () => ({ x: rand(0, SCENE_W), y: rand(-200, 140), v: rand(6, 14), p: rand(0, 6.3) }));
  let paperStack = 0; // altura de la pila de folios del escritorio (decorativa)

  // ─── Fondo (se regenera solo al cambiar de departamento) ──────────────
  function currentDepartment(state) {
    let dep = 'basement';
    for (const d of DEPARTMENTS) if (state.unlockedDepartments.includes(d.id)) dep = d.id;
    return dep;
  }

  function renderBackground(dep) {
    const b = background.getContext('2d');
    b.setTransform(k, 0, 0, k, 0, 0);
    b.imageSmoothingEnabled = false;
    const st = DEPARTMENT_STYLE[dep];
    b.clearRect(0, 0, SCENE_W, SCENE_H);
    // Pared con paneles
    b.fillStyle = st.wall;
    b.fillRect(0, 0, SCENE_W, FLOOR_Y);
    b.fillStyle = st.wall2;
    for (let x = 0; x < SCENE_W; x += 32) b.fillRect(x, 20, 2, FLOOR_Y - 20);
    for (let y = 40; y < FLOOR_Y; y += 36) b.fillRect(0, y, SCENE_W, 1);
    if (dep === 'basement') {
      // Manchas de humedad
      b.fillStyle = '#1d2033';
      [[30, 50, 18, 10], [300, 70, 26, 14], [210, 110, 14, 8]].forEach(([x, y, w, h]) => b.fillRect(x, y, w, h));
    }
    if (['adminGod', 'board', 'quantumBureau', 'voidHQ', 'endOfTime'].includes(dep)) {
      for (let i = 0; i < 70; i++) {
        b.fillStyle = pick(['#ffd16688', '#ffffff55', '#ff4fd866']);
        b.fillRect(Math.floor(rand(0, SCENE_W)), Math.floor(rand(18, FLOOR_Y)), 1, 1);
      }
    }
    // Tuberías del techo (Kenney Industrial)
    for (let x = 0; x < SCENE_W; x += 18) drawFrameTo(b, 'industrial', x === 0 ? 108 : x + 18 >= SCENE_W ? 111 : 109 + ((x / 18) % 2), x, 0);
    // Zócalo y suelo
    b.fillStyle = '#0d0e17';
    b.fillRect(0, FLOOR_Y, SCENE_W, 3);
    b.fillStyle = st.floor;
    b.fillRect(0, FLOOR_Y + 3, SCENE_W, SCENE_H - FLOOR_Y - 3);
    for (let y = FLOOR_Y + 3, row = 0; y < SCENE_H; y += 12, row++) {
      for (let x = (row % 2) * 12 - 12; x < SCENE_W; x += 24) {
        b.fillStyle = st.floor;
        b.fillRect(x, y, 12, 12);
        b.fillStyle = st.floor2;
        b.fillRect(x + 12, y, 12, 12);
      }
    }
    // Ventana al apocalipsis (marco; el cielo se anima aparte)
    b.fillStyle = '#0d0e17';
    b.fillRect(138, 24, 108, 64);
    b.fillStyle = '#5a6075';
    b.fillRect(140, 26, 104, 60);
    // Estanterías de impresoras
    b.fillStyle = '#5e3b26';
    b.fillRect(6, 106, 108, 4);
    b.fillRect(6, 132, 108, 4);
    b.fillStyle = '#3d2618';
    b.fillRect(8, 110, 3, 40);
    b.fillRect(109, 110, 3, 40);
    // Cartel de neón del departamento
    b.font = "10px 'Kenney Pixel', monospace";
    b.textBaseline = 'top';
    const signW = Math.min(118, Math.ceil(b.measureText(st.sign).width) + 10);
    const sx = 318 - signW / 2;
    b.fillStyle = '#0b0c14';
    b.fillRect(sx, 28, signW, 15);
    b.strokeStyle = st.signColor;
    b.strokeRect(sx + 0.5, 28.5, signW - 1, 14);
    b.fillStyle = st.signColor;
    b.textAlign = 'center';
    b.fillText(st.sign, 318, 31, signW - 6);
    // Decoración por departamento
    if (dep !== 'basement') {
      // Póster «empleado del mes»
      b.fillStyle = '#f4f4fa';
      b.fillRect(258, 54, 26, 32);
      b.fillStyle = '#10111b';
      b.font = "6px 'Kenney Pixel', monospace";
      b.fillText('EMPLEADO', 271, 56);
      b.fillText('DEL MES', 271, 62);
      drawFrameTo(b, 'px:pigeon', 0, 265, 70);
    }
    if (dep === 'hellHR' || dep === 'multinational' || dep === 'adminGod') {
      // Reloj sin agujas
      b.fillStyle = '#f4f4fa';
      b.beginPath();
      b.arc(300, 70, 9, 0, Math.PI * 2);
      b.fill();
      b.fillStyle = '#10111b';
      b.fillRect(299, 63, 2, 7);
      b.fillRect(300, 69, 5, 2);
    }
    // Luz ambiental
    const g = b.createRadialGradient(192, 40, 4, 192, 40, 200);
    g.addColorStop(0, st.light);
    g.addColorStop(1, 'transparent');
    b.fillStyle = g;
    b.fillRect(0, 0, SCENE_W, SCENE_H);
  }

  function drawFrameTo(target, sheet, index, x, y, opts) {
    drawFrame(target, sheet, index, x, y, opts);
  }

  // ─── Actores ──────────────────────────────────────────────────────────
  function makeWalker(type, draw, opts = {}) {
    const deskSlot = opts.desk ?? null;
    return {
      type,
      draw, // { anim } o { sheet, index }
      x: deskSlot ? deskSlot.x : rand(20, SCENE_W - 20),
      y: deskSlot ? deskSlot.y - 2 : rand(WALK_MIN_Y, WALK_MAX_Y),
      targetX: null,
      speed: opts.speed ?? rand(14, 26),
      state: deskSlot ? 'work' : 'idle',
      timer: rand(0.5, 3),
      flip: Math.random() < 0.5,
      spawnT: 0,
      jumpT: 0,
      bob: rand(0, 6),
      desk: deskSlot,
      float: opts.float ?? false,
      lifetime: opts.lifetime ?? Infinity,
      leaving: false,
      alpha: 1,
      scale: opts.scale ?? 1,
    };
  }

  function makePigeon() {
    const perch = pick(PIGEON_PERCHES);
    return { type: 'pigeon', x: perch.x, y: perch.y, fromX: perch.x, fromY: perch.y, toX: perch.x, toY: perch.y, flyT: 0, flyDur: 1, flying: false,
      timer: rand(1, 5), flip: Math.random() < 0.5, spawnT: 0, jumpT: 0, pokes: 0, leaving: false, alpha: 1, lifetime: Infinity };
  }

  function desiredCounts(state) {
    const b = state.buildings;
    const capped = (n, max, div = 1) => (n > 0 ? Math.min(max, Math.ceil(n / div)) : 0);
    return {
      intern: capped(b.intern, 8, 3),
      pigeon: capped(b.pigeon, 9, 3),
      boss: capped(b.bossClone, 4, 5),
      minotaur: capped(b.inhumanResources, 3, 5),
      alien: capped(b.meetingMachine, 4, 5),
      ghost: capped(b.paradoxDept, 4, 5),
      wizard: capped(b.godServer, 1),
      lizard: capped(b.lostTimeMinistry, 3, 5),
      skeleton: state.unlockedDepartments.includes('hellHR') ? 1 : 0,
      timeBot: capped(b.timeTravelAgency, 3, 5),
      quantumBot: capped(b.quantumNotary, 3, 5),
      shareholder: capped(b.primordialShareholders, 3, 5),
      spikeBot: capped(b.entropyInbox, 3, 5),
    };
  }

  function createActor(type, index) {
    switch (type) {
      case 'intern': {
        const desk = INTERN_DESKS[index] ?? null;
        const look = INTERN_ANIMS[index % INTERN_ANIMS.length];
        return makeWalker('intern', look, { desk });
      }
      case 'pigeon': return makePigeon();
      case 'boss': return makeWalker('boss', { anim: index === 0 ? 'bossIdle' : 'bossTalk', px: index % 2 ? 'bossHolo' : null }, { speed: 12 });
      case 'minotaur': return makeWalker('minotaur', { anim: 'minotaurWalk' }, { speed: 20 });
      case 'alien': return makeWalker('alien', { anim: ['alienGreen', 'alienBlue', 'alienPink', 'alienYellow'][index % 4] }, { speed: 16, scale: 0.75 });
      case 'ghost': return makeWalker('ghost', { anim: index % 2 ? 'ghostPurpleFloat' : 'ghostFloat' }, { float: true, speed: 10 });
      case 'wizard': return makeWalker('wizard', { anim: 'wizardWalk' }, { speed: 10 });
      case 'lizard': return makeWalker('lizard', { anim: 'lizardWalk' }, { speed: 12 });
      case 'timeBot': return makeWalker('timeBot', { anim: 'bigBot' }, { speed: 14 });
      case 'quantumBot': return makeWalker('quantumBot', { anim: 'flyingBot' }, { float: true, speed: 22 });
      case 'shareholder': return makeWalker('shareholder', { anim: 'goblinWalk' }, { speed: 11 });
      case 'spikeBot': return makeWalker('spikeBot', { anim: 'spikeBot' }, { speed: 9 });
      case 'skeleton': {
        const w = makeWalker('skeleton', { anim: 'skeletonWalk' }, { speed: 6 });
        w.x = 360;
        w.y = 210;
        return w;
      }
      default: return null;
    }
  }

  /** Ajusta los actores a lo que se posee (añade con «pop», retira con fundido). */
  function reconcile(state) {
    const want = desiredCounts(state);
    counts = { ...want };
    for (const [type, n] of Object.entries(want)) {
      const current = actors.filter((a) => a.type === type && !a.leaving);
      for (let i = current.length; i < n; i++) {
        const actor = createActor(type, i);
        if (actor) {
          actors.push(actor);
          spawnEffect('sparkle', actor.x - 4, (actor.y ?? 100) - 12);
        }
      }
      for (let i = n; i < current.length; i++) current[i].leaving = true;
    }
  }

  function spawnEffect(anim, x, y, scale = 1) {
    effects.push({ anim, x, y, t: 0, scale });
  }

  function say(actor, text, seconds = 2.6) {
    if (!actor) return;
    bubbles.push({ actor, text, t: seconds });
  }

  // ─── Actualización ───────────────────────────────────────────────────
  function updateWalker(a, dt, reduced) {
    if (a.lifetime !== Infinity) {
      a.lifetime -= dt;
      if (a.lifetime <= 0) a.leaving = true;
    }
    if (reduced) return;
    if (a.state === 'work') {
      a.timer -= dt;
      if (a.timer <= 0 && Math.random() < 0.15) {
        a.state = 'idle';
        a.timer = rand(1, 2);
      } else if (a.timer <= 0) a.timer = rand(2, 5);
      return;
    }
    if (a.state === 'idle') {
      a.timer -= dt;
      if (a.timer <= 0) {
        if (a.desk && Math.random() < 0.5) {
          a.targetX = a.desk.x;
          a.targetY = a.desk.y - 2;
        } else {
          a.targetX = rand(16, SCENE_W - 16);
          a.targetY = a.float ? rand(60, 150) : rand(WALK_MIN_Y, WALK_MAX_Y);
        }
        a.state = 'walk';
      }
      return;
    }
    // Caminar
    const dx = a.targetX - a.x;
    const dy = (a.targetY ?? a.y) - a.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 1) {
      a.state = a.desk && Math.abs(a.x - a.desk.x) < 2 ? 'work' : 'idle';
      a.timer = rand(1.5, 5);
      return;
    }
    const step = Math.min(dist, a.speed * dt);
    a.x += (dx / dist) * step;
    a.y += (dy / dist) * step;
    if (Math.abs(dx) > 0.5) a.flip = dx < 0;
  }

  function updatePigeon(p, dt, reduced) {
    if (reduced) return;
    if (p.flying) {
      p.flyT += dt;
      const t = Math.min(1, p.flyT / p.flyDur);
      p.x = p.fromX + (p.toX - p.fromX) * t;
      p.y = p.fromY + (p.toY - p.fromY) * t - Math.sin(t * Math.PI) * 28;
      if (t >= 1) {
        p.flying = false;
        p.timer = rand(2, 7);
        if (p.leavingOffscreen) p.leaving = true;
      }
      return;
    }
    p.timer -= dt;
    if (p.timer <= 0) flyPigeon(p, pick(PIGEON_PERCHES));
  }

  function flyPigeon(p, target) {
    p.fromX = p.x;
    p.fromY = p.y;
    p.toX = target.x;
    p.toY = target.y;
    p.flyT = 0;
    p.flyDur = Math.max(0.6, Math.hypot(p.toX - p.x, p.toY - p.y) / 90);
    p.flying = true;
    p.flip = p.toX < p.x;
  }

  function update(dt) {
    const reduced = isReducedMotion();
    time += dt * 1000;
    typingT = Math.max(0, typingT - dt);
    flashT = Math.max(0, flashT - dt);
    shakeT = Math.max(0, shakeT - dt);
    celebrateT = Math.max(0, celebrateT - dt);
    printerShakeT = Math.max(0, printerShakeT - dt);
    for (const a of actors) {
      a.spawnT = Math.min(1, a.spawnT + dt * 3);
      a.jumpT = Math.max(0, a.jumpT - dt);
      if (a.leaving) a.alpha = Math.max(0, a.alpha - dt * 2);
      if (a.type === 'pigeon') updatePigeon(a, dt, reduced);
      else updateWalker(a, dt, reduced);
    }
    for (let i = actors.length - 1; i >= 0; i--) if (actors[i].leaving && actors[i].alpha <= 0) actors.splice(i, 1);
    for (let i = effects.length - 1; i >= 0; i--) {
      effects[i].t += dt * 1000;
      if (effects[i].t > 1200) effects.splice(i, 1);
    }
    for (let i = bubbles.length - 1; i >= 0; i--) {
      bubbles[i].t -= dt;
      if (bubbles[i].t <= 0 || (!bubbles[i].fixed && !actors.includes(bubbles[i].actor))) bubbles.splice(i, 1);
    }
    // Charla aleatoria
    chatterTimer -= dt;
    if (chatterTimer <= 0) {
      chatterTimer = rand(7, 14);
      const talkers = actors.filter((a) => a.type !== 'pigeon' && !a.leaving);
      if (talkers.length) say(pick(talkers), pick(CHATTER), 3);
    }
    for (let i = ripples.length - 1; i >= 0; i--) {
      ripples[i].t += dt;
      if (ripples[i].t > 0.5) ripples.splice(i, 1);
    }
    for (let i = flyingPapers.length - 1; i >= 0; i--) {
      const f = flyingPapers[i];
      f.t += dt / 0.55;
      if (f.t >= 1) {
        flyingPapers.splice(i, 1);
        paperStack = Math.min(14, paperStack + 0.25);
      }
    }
    if (!reduced) {
      for (const m of motes) {
        m.y -= m.s * 4 * dt;
        m.x += Math.sin(time / 1500 + m.p) * 3 * dt;
        if (m.y < 24) { m.y = 205; m.x = rand(130, 254); }
      }
      if ((getState().buildings.entropyInbox || 0) > 0) {
        for (const e of envelopes) {
          e.y += e.v * dt;
          e.x += Math.sin(time / 700 + e.p) * 6 * dt;
          if (e.y > 150) { e.y = rand(-40, 0); e.x = rand(0, SCENE_W); }
        }
      }
      // Los accionistas y robots también opinan.
      if (Math.random() < dt * 0.08) {
        const sh = actors.find((a) => a.type === 'shareholder' && !a.leaving && Math.random() < 0.5);
        if (sh) say(sh, pick(SHAREHOLDER_CHATTER), 2);
        const bot = actors.find((a) => (a.type === 'timeBot' || a.type === 'spikeBot') && !a.leaving && Math.random() < 0.5);
        if (bot) say(bot, pick(BOT_CHATTER), 2);
      }
      // La imprenta de realidades suelta destellos de colores.
      if ((getState().buildings.realityPrinter || 0) > 0 && Math.random() < dt * 1.5) spawnEffect('sparkle', rand(146, 170), rand(108, 122));
    }
    // Humo del reactor
    smokeTimer -= dt;
    if (smokeTimer <= 0) {
      smokeTimer = 1.2;
      if ((getState().buildings.bureaucracyReactor || 0) > 0 && onSmoke) onSmoke(282, 112);
    }
  }

  // ─── Dibujo ──────────────────────────────────────────────────────────
  function drawWindow(state, t) {
    // Cielo apocalíptico
    const g = ctx.createLinearGradient(0, 26, 0, 86);
    g.addColorStop(0, '#1a0b2e');
    g.addColorStop(0.6, '#5a1a3a');
    g.addColorStop(1, '#ff6b35');
    ctx.fillStyle = g;
    ctx.fillRect(142, 28, 100, 56);
    // Estrellas parpadeantes (posiciones fijas)
    for (let i = 0; i < 14; i++) {
      const x = 144 + ((i * 37) % 96);
      const y = 30 + ((i * 23) % 30);
      if ((Math.floor(t / 400) + i) % 3) {
        ctx.fillStyle = '#f4f4fa';
        ctx.fillRect(x, y, 1, 1);
      }
    }
    // Planeta rojo amenazante (se acerca con el progreso)
    const dep = currentDepartment(state);
    const doom = Math.min(5, DEPARTMENTS.findIndex((d) => d.id === dep));
    ctx.fillStyle = '#c0392b';
    ctx.beginPath();
    ctx.arc(222, 46, 6 + doom * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.arc(220, 44, 3 + doom, 0, Math.PI * 2);
    ctx.fill();
    // Meteorito ocasional
    const m = (t / 1000) % 9;
    if (m < 1.2 && !isReducedMotion()) {
      const k = m / 1.2;
      ctx.fillStyle = '#ffd166';
      ctx.fillRect(150 + k * 80, 30 + k * 40, 2, 2);
      ctx.fillStyle = '#ff6b3588';
      ctx.fillRect(146 + k * 80, 28 + k * 40, 4, 1);
    }
    // Universos fabricados
    const universes = Math.min(5, state.buildings.universeFactory || 0);
    for (let i = 0; i < universes; i++) {
      const a = (t / 1000) * 0.6 + (i * Math.PI * 2) / Math.max(1, universes);
      drawPlanet(ctx, 180 + Math.cos(a) * 30, 60 + Math.sin(a) * 12, 3, a, ['#32f5c8', '#1e8f78', '#ffd166']);
    }
    // Ciudad en llamas
    ctx.fillStyle = '#0d0e17';
    [[142, 74, 12, 10], [156, 70, 8, 14], [166, 76, 14, 8], [182, 68, 10, 16], [194, 73, 16, 11], [212, 66, 8, 18], [222, 72, 20, 12]].forEach(([x, y, w, h]) => ctx.fillRect(x, y, w, h));
    // Marco en cruz
    ctx.fillStyle = '#5a6075';
    ctx.fillRect(190, 28, 3, 56);
    ctx.fillRect(142, 55, 100, 2);
  }

  function drawPrinters(state, t) {
    const n = state.buildings.printer || 0;
    const visible = Math.min(8, n);
    const vacation = state.temp.effects.some((e) => e.id === 'printerOff');
    for (let i = 0; i < visible; i++) {
      const row = i < 4 ? 1 : 0;
      const col = i % 4;
      const x = 12 + col * 25;
      const y = (row ? 132 : 106) - 12;
      const shake = printerShakeT > 0 ? Math.round(Math.sin(t / 30 + i) * 1) : 0;
      const anim = vacation ? 'printerIdle' : 'printerPrint';
      drawAnim(ctx, anim, isReducedMotion() ? 0 : t + i * 130, x + shake, y);
      if (vacation && i === 0) drawText('🌴', x + 4, y - 8, 8);
    }
    if (n > 8) drawLabel(`×${n}`, 60, 140);
  }

  function drawMachines(state, t) {
    const b = state.buildings;
    const reduced = isReducedMotion();
    const tt = reduced ? 0 : t;
    // Reactor burocrático (Kenney Industrial)
    if (b.bureaucracyReactor > 0) {
      drawFrame(ctx, 'industrial', 64 + (Math.floor(tt / 400) % 2), 264, 96);
      drawFrame(ctx, 'industrial', 65 - (Math.floor(tt / 400) % 2), 282, 96);
      drawFrame(ctx, 'industrial', 60, 264, 114);
      drawFrame(ctx, 'industrial', 61, 282, 114);
      drawFrame(ctx, 'industrial', 28, 264, 132);
      drawFrame(ctx, 'industrial', 44, 282, 132);
      if (b.bureaucracyReactor > 1) drawLabel(`×${b.bureaucracyReactor}`, 282, 92);
    }
    // Máquina de reuniones: cinta transportadora con documentos
    if (b.meetingMachine > 0) {
      drawFrame(ctx, 'industrial', 84, 304, 136);
      drawFrame(ctx, 'industrial', 85, 322, 136);
      drawFrame(ctx, 'industrial', 86, 340, 136);
      ctx.fillStyle = '#f4f4fa';
      for (let i = 0; i < 3; i++) {
        const x = 304 + ((tt / 40 + i * 18) % 54);
        ctx.fillRect(Math.round(x), 134, 5, 3);
      }
    }
    // Impresora dimensional con portal
    if (b.dimensionalPrinter > 0) {
      drawAnim(ctx, 'portal', tt, 330, 98, { scale: 2.5, alpha: 0.85 });
      drawAnim(ctx, 'dimPrinterPrint', tt, 334, 104, { scale: 1.5 });
    }
    // Servidor que contiene a Dios
    if (b.godServer > 0) {
      drawAnim(ctx, 'serverBlink', tt, 116, 120);
      drawAnim(ctx, 'serverBlink', tt + 250, 128, 120);
      ctx.fillStyle = '#ffd16655';
      ctx.fillRect(114, 118, 28, 2);
    }
  }

  function drawPlayerDesk(state, t) {
    const reduced = isReducedMotion();
    const bob = typingT > 0 && !reduced ? -1 - Math.round(Math.sin(t / 25)) : 0;
    // Becario protagonista (detrás de la mesa)
    drawFrame(ctx, 'dungeon', 88, 178, 152 + bob);
    // Ordenador y pantalla
    drawFrame(ctx, 'px:computer', 0, 196, 156);
    ctx.fillStyle = '#32f5c8';
    screenLines.forEach((w, i) => ctx.fillRect(200, 160 + i * 2, w, 1));
    if (Math.floor(t / 500) % 2 === 0) ctx.fillRect(200 + (screenLines[screenLines.length - 1] ?? 0), 160 + Math.max(0, screenLines.length - 1) * 2, 1, 1);
    drawFrame(ctx, 'px:desk', 0, 176, 168);
    // Taza de café y papeles
    ctx.fillStyle = '#f4f4fa';
    ctx.fillRect(180, 165, 6, 3);
    ctx.fillRect(181, 163, 6, 2);
    ctx.fillStyle = '#b07a4f';
    ctx.fillRect(214, 163, 4, 5);
  }

  function drawInternDesks(state) {
    const used = Math.min(INTERN_DESKS.length, counts.intern || 0);
    for (let i = 0; i < used; i++) {
      const d = INTERN_DESKS[i];
      drawFrame(ctx, 'px:desk', 0, d.x - 16, d.y);
      drawFrame(ctx, 'px:computer', 0, d.x - 2, d.y - 12, { scale: 0.85 });
    }
    void state;
  }

  function drawDecor(state) {
    drawFrame(ctx, 'px:plant', 0, 4, 140);
    if (state.unlockedDepartments.includes('exploitation')) {
      drawFrame(ctx, 'px:coffee', 0, 252, 137);
      drawFrame(ctx, 'px:cooler', 0, 238, 138);
    }
  }

  function actorSize(a) {
    if (a.draw?.anim) {
      const anim = a.draw.anim;
      const sheet = a.draw.px ? `px:${a.draw.px}` : (anim.startsWith('boss') ? 'px:boss' : null);
      if (sheet) return frameSize(sheet);
    }
    if (a.draw?.sheet) return frameSize(a.draw.sheet);
    const map = { minotaur: 'minotaur', ghost: 'ghost', wizard: 'wizard', lizard: 'lizard', skeleton: 'skeleton', alien: 'platformerChars', goblin: 'goblin',
      timeBot: 'platformerChars', quantumBot: 'platformerChars', spikeBot: 'platformerChars', shareholder: 'goblin' };
    return frameSize(map[a.type] ?? 'dungeon');
  }

  function drawShadow(x, y, w, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#05050a';
    ctx.beginPath();
    ctx.ellipse(x, y, Math.max(0.5, w), Math.max(0.5, w * 0.3), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawActor(a, t) {
    const reduced = isReducedMotion();
    const { w, h } = actorSize(a);
    const scale = a.scale ?? 1;
    // Aparición con rebote elástico.
    const pop = reduced || a.spawnT >= 1 ? 1 : Math.max(0.05, easeOutBack(a.spawnT));
    const jumpPhase = (celebrateT > 0 || a.jumpT > 0) && !reduced ? Math.abs(Math.sin(t / 110)) : 0;
    const jump = jumpPhase * 5;
    const walking = a.state === 'walk' && !reduced;
    const stepPhase = walking ? Math.abs(Math.sin(t / 110 + a.bob)) : 0;
    const hop = walking && a.draw?.sheet ? stepPhase * 2 : 0;
    const floatY = a.float && !reduced ? Math.sin(t / 600 + a.bob) * 3 : 0;
    // Respiración y estirar/encoger: más alto en el aire, achatado al tocar suelo.
    const breathe = !reduced && !walking ? Math.sin(t / 520 + a.bob) * 0.025 : 0;
    let sy = 1 + breathe;
    if (jumpPhase > 0) sy = jumpPhase > 0.15 ? 1 + jumpPhase * 0.12 : 0.85;
    else if (walking) sy = 1 + (stepPhase - 0.5) * 0.08;
    const sx = 1 / sy;
    // Sombra en el suelo (más pequeña cuanto más alto está).
    if (a.alpha > 0.05) {
      const lift = jump + hop + (a.float ? 18 : 0);
      drawShadow(a.x, a.y + (a.float ? 16 : 0), (w * scale * 0.42) * pop * Math.max(0.4, 1 - lift / 40), 0.35 * a.alpha);
    }
    ctx.save();
    ctx.translate(a.x, a.y - jump - hop + floatY);
    ctx.scale(sx, sy);
    // Parpadeo cuántico.
    const alpha = a.type === 'quantumBot' && !reduced ? a.alpha * (0.55 + 0.45 * Math.abs(Math.sin(t / 170 + a.bob))) : a.alpha;
    const opts = { flip: a.flip, scale: scale * pop, alpha };
    const dw = w * scale * pop;
    const dh = h * scale * pop;
    const animTime = reduced ? 0 : walking || a.float || a.type === 'boss' ? t + a.bob * 1000 : 0;
    if (a.draw?.anim) {
      if (a.draw.px) drawFrame(ctx, `px:${a.draw.px}`, getAnimFrame(a.draw.anim, animTime), -dw / 2, -dh, opts);
      else drawAnim(ctx, a.draw.anim, animTime, -dw / 2, -dh, opts);
    } else if (a.draw?.sheet) {
      drawFrame(ctx, a.draw.sheet, a.draw.index, -dw / 2, -dh, opts);
    }
    ctx.restore();
  }

  /** Lámpara con cono de luz, motas de polvo, brillo del monitor y vapor del café. */
  function drawAmbient(state, t) {
    const reduced = isReducedMotion();
    const flicker = reduced ? 1 : 0.85 + 0.15 * Math.sin(t / 90) * Math.sin(t / 37) + (Math.random() < 0.01 ? -0.4 : 0);
    // Lámpara colgante
    ctx.fillStyle = '#3a4163';
    ctx.fillRect(191, 18, 2, 12);
    ctx.fillStyle = '#5a6075';
    ctx.fillRect(186, 30, 12, 3);
    ctx.fillStyle = `rgba(255, 230, 160, ${0.9 * flicker})`;
    ctx.fillRect(189, 33, 6, 2);
    // Cono de luz
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createLinearGradient(0, 34, 0, 200);
    g.addColorStop(0, `rgba(255, 220, 150, ${0.16 * flicker})`);
    g.addColorStop(1, 'rgba(255, 220, 150, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(187, 34);
    ctx.lineTo(197, 34);
    ctx.lineTo(262, 205);
    ctx.lineTo(122, 205);
    ctx.closePath();
    ctx.fill();
    // Motas de polvo dentro del cono
    for (const m of motes) {
      const inCone = Math.abs(m.x - 192) < (m.y - 34) * 0.42 + 6;
      if (!inCone) continue;
      ctx.fillStyle = `rgba(255, 240, 200, ${0.25 + 0.25 * Math.sin(t / 400 + m.p)})`;
      ctx.fillRect(Math.round(m.x), Math.round(m.y), 1, 1);
    }
    // Brillo del monitor
    const mg = ctx.createRadialGradient(203, 162, 1, 203, 162, 18);
    mg.addColorStop(0, `rgba(50, 245, 200, ${0.18 + (typingT > 0 ? 0.12 : 0)})`);
    mg.addColorStop(1, 'rgba(50, 245, 200, 0)');
    ctx.fillStyle = mg;
    ctx.fillRect(185, 144, 36, 36);
    // Resplandor del cartel de neón (parpadeo ocasional)
    const st = DEPARTMENT_STYLE[currentDepartment(state)];
    const neon = reduced ? 1 : (Math.random() < 0.015 ? 0.15 : 0.75 + 0.25 * Math.sin(t / 300));
    const ng = ctx.createRadialGradient(318, 35, 2, 318, 35, 60);
    ng.addColorStop(0, `${st.signColor}${Math.round(40 * neon).toString(16).padStart(2, '0')}`);
    ng.addColorStop(1, `${st.signColor}00`);
    ctx.fillStyle = ng;
    ctx.fillRect(258, 0, 120, 80);
    ctx.restore();
    // Vapor de la taza y de la cafetera
    if (!reduced) {
      for (let i = 0; i < 3; i++) {
        const k2 = ((t / 1200) + i / 3) % 1;
        ctx.fillStyle = `rgba(244, 244, 250, ${0.35 * (1 - k2)})`;
        ctx.fillRect(Math.round(183 + Math.sin(k2 * 6 + i) * 1.5), Math.round(162 - k2 * 10), 1, 1);
        if (state.unlockedDepartments.includes('exploitation')) {
          ctx.fillRect(Math.round(257 + Math.sin(k2 * 6 + i) * 1.5), Math.round(146 - k2 * 12), 1, 1);
        }
      }
    }
  }

  /** Edificios de los niveles 7–12 que no son personajes. */
  function drawLateGame(state, t) {
    const b = state.buildings;
    const reduced = isReducedMotion();
    const tt = reduced ? 0 : t;
    // Imprenta de realidades: impresora dorada bajo la ventana.
    if (b.realityPrinter > 0) {
      drawAnim(ctx, 'printerPrint', tt * 1.5, 150, 112, { scale: 1.4 });
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.25 + 0.15 * Math.sin(tt / 250);
      drawFrame(ctx, 'px:goldPrinter', 1, 150, 112, { scale: 1.4 });
      ctx.restore();
    }
    // Cafetería del vacío: remolino oscuro con tazas en órbita.
    if (b.voidCafeteria > 0) {
      const cx = 64;
      const cy = 56;
      for (let r = 16; r > 0; r -= 3) {
        ctx.fillStyle = r % 2 ? '#05050a' : '#1a1030';
        ctx.beginPath();
        const rr = Math.max(0.5, r + Math.sin(tt / 300 + r) * 1.2);
        ctx.ellipse(cx, cy, rr, rr * 0.7, tt / 900, 0, Math.PI * 2);
        ctx.fill();
      }
      for (let i = 0; i < 3; i++) {
        const a = tt / 800 + (i * Math.PI * 2) / 3;
        drawFrame(ctx, 'px:coffee', 0, cx + Math.cos(a) * 24 - 5, cy + Math.sin(a) * 12 - 6, { scale: 0.6 });
      }
    }
    // Bandeja de la entropía: sobres cayendo por toda la oficina.
    if (b.entropyInbox > 0) {
      for (const e of envelopes) {
        if (e.y < 0) continue;
        ctx.fillStyle = '#f4f4fa';
        ctx.fillRect(Math.round(e.x), Math.round(e.y), 6, 4);
        ctx.fillStyle = '#ff6b35';
        ctx.fillRect(Math.round(e.x) + 1, Math.round(e.y) + 1, 4, 1);
      }
    }
    // Agencias de viaje en el tiempo: reloj que gira hacia atrás.
    if (b.timeTravelAgency > 0) {
      ctx.fillStyle = '#32f5c8';
      ctx.beginPath();
      ctx.arc(300, 70, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0b0c14';
      ctx.beginPath();
      ctx.arc(300, 70, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#32f5c8';
      ctx.lineWidth = 1;
      const ang = -tt / 400;
      ctx.beginPath();
      ctx.moveTo(300, 70);
      ctx.lineTo(300 + Math.cos(ang) * 7, 70 + Math.sin(ang) * 7);
      ctx.stroke();
    }
  }

  /** Ondas de los clics y folios volando a la pila. */
  function drawClickFx() {
    for (const r of ripples) {
      const k2 = r.t / 0.5;
      ctx.strokeStyle = `rgba(50, 245, 200, ${0.8 * (1 - k2)})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(r.x, r.y, 4 + k2 * 18, (4 + k2 * 18) * 0.6, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    // Pila de folios en el escritorio
    const stack = Math.floor(paperStack);
    for (let i = 0; i < stack; i++) {
      ctx.fillStyle = i % 2 ? '#e6e6f0' : '#f4f4fa';
      ctx.fillRect(222 + (i % 3 === 0 ? 1 : 0), 166 - i, 8, 1);
    }
    for (const f of flyingPapers) {
      const k2 = Math.min(1, f.t);
      const x = f.x0 + (224 - f.x0) * k2;
      const y = f.y0 + (165 - stack - f.y0) * k2 - Math.sin(k2 * Math.PI) * 20;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(k2 * 6 + f.r);
      ctx.fillStyle = '#f4f4fa';
      ctx.fillRect(-2, -3, 4, 5);
      ctx.restore();
    }
  }

  function drawPigeon(p, t) {
    const reduced = isReducedMotion();
    const pop = p.spawnT < 1 ? 0.5 + p.spawnT * 0.5 : 1;
    const anim = p.flying ? 'pigeonFly' : 'pigeonIdle';
    const jump = celebrateT > 0 && !reduced && !p.flying ? Math.abs(Math.sin(t / 80)) * 3 : 0;
    drawAnim(ctx, anim, reduced ? 0 : t + p.x * 10, p.x - 6, p.y - 10 - jump, { flip: p.flip, scale: pop, alpha: p.alpha });
  }

  function drawLabel(text, x, y) {
    ctx.font = "8px 'Kenney Pixel', monospace";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const w = Math.ceil(ctx.measureText(text).width) + 4;
    ctx.fillStyle = '#10111bcc';
    ctx.fillRect(Math.round(x - w / 2), y, w, 9);
    ctx.fillStyle = '#ffd166';
    ctx.fillText(text, x, y + 1);
  }

  function drawText(text, x, y, size = 8) {
    ctx.font = `${size}px sans-serif`;
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    ctx.fillText(text, x, y);
  }

  function drawBubbles() {
    ctx.font = "8px 'Kenney Pixel', monospace";
    ctx.textBaseline = 'top';
    ctx.textAlign = 'center';
    for (const b of bubbles) {
      const a = b.actor;
      const { h } = a.type === 'pigeon' ? { h: 10 } : actorSize(a);
      const w = Math.min(120, Math.ceil(ctx.measureText(b.text).width) + 8);
      let x = Math.round(a.x - w / 2);
      x = Math.max(2, Math.min(SCENE_W - w - 2, x));
      const y = Math.max(2, Math.round(a.y - h * (a.scale ?? 1) - 16));
      ctx.fillStyle = '#f4f4fa';
      ctx.fillRect(x, y, w, 11);
      ctx.fillRect(Math.round(a.x) - 1, y + 11, 3, 2);
      ctx.fillStyle = '#10111b';
      ctx.fillText(b.text, x + w / 2, y + 2, w - 4);
    }
  }

  function draw(state) {
    const dep = currentDepartment(state);
    if (dep !== backgroundKey) {
      renderBackground(dep);
      backgroundKey = dep;
    }
    const t = time;
    ctx.setTransform(k, 0, 0, k, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.save();
    if (shakeT > 0 && !isReducedMotion()) ctx.translate(Math.round(Math.sin(t / 20) * 2), 0);
    ctx.fillStyle = '#0b0c14';
    ctx.fillRect(-4, 0, SCENE_W + 8, SCENE_H);
    ctx.drawImage(background, 0, 0, SCENE_W, SCENE_H);
    drawWindow(state, t);
    drawLateGame(state, t);
    drawPrinters(state, t);
    drawMachines(state, t);
    drawDecor(state);
    drawInternDesks(state);
    // Actores ordenados por profundidad (y)
    const sorted = [...actors].sort((a, b) => a.y - b.y);
    const floorActors = sorted.filter((a) => a.type !== 'pigeon' && a.y >= 168);
    const backActors = sorted.filter((a) => a.type !== 'pigeon' && a.y < 168);
    backActors.forEach((a) => drawActor(a, t));
    drawPlayerDesk(state, t);
    floorActors.forEach((a) => drawActor(a, t));
    if ((state.buildings.apocalypseCallCenter || 0) > 0) {
      drawAnim(ctx, 'dragonIdle', isReducedMotion() ? 0 : t, 312, 140, { flip: true });
    }
    drawAmbient(state, t);
    drawClickFx();
    sorted.filter((a) => a.type === 'pigeon').forEach((p) => drawPigeon(p, t));
    for (const e of effects) drawAnim(ctx, e.anim, e.t, e.x, e.y, { scale: e.scale });
    drawBubbles();
    if (flashT > 0) {
      ctx.fillStyle = `rgba(255, 209, 102, ${flashT * 0.5})`;
      ctx.fillRect(0, 0, SCENE_W, SCENE_H);
    }
    ctx.restore();
  }

  function loop(now) {
    if (!running) return;
    const dt = Math.min(0.1, (now - lastTime) / 1000);
    lastTime = now;
    const state = getState();
    update(dt);
    draw(state);
    requestAnimationFrame(loop);
  }

  return {
    start() {
      resize();
      if (running) return;
      running = true;
      lastTime = performance.now();
      requestAnimationFrame(loop);
    },
    stop() {
      running = false;
    },
    /** Sincroniza los actores con el estado (llamar al comprar o cargar). */
    sync(state) {
      reconcile(state);
    },
    /** Reinicio completo (prestigio / carga de partida). */
    reset(state) {
      actors.length = 0;
      paperStack = 0;
      bubbles.length = 0;
      effects.length = 0;
      backgroundKey = '';
      reconcile(state);
    },
    /** Reacción a un clic del jugador. */
    onPlayerClick(sceneX, sceneY) {
      typingT = 0.15;
      if (!isReducedMotion()) {
        if (Number.isFinite(sceneX) && Number.isFinite(sceneY)) ripples.push({ x: sceneX, y: sceneY, t: 0 });
        if (flyingPapers.length < 8) flyingPapers.push({ x0: 205, y0: 158, t: 0, r: rand(0, 3) });
      }
      if (paperStack >= 14) paperStack = 6; // alguien se lleva la pila al archivo
      if (screenLines.length >= 5) screenLines.shift();
      screenLines.push(Math.floor(rand(3, 8)));
    },
    /** Convierte coordenadas de pantalla a coordenadas de la escena. */
    toSceneCoords(clientX, clientY) {
      const r = canvas.getBoundingClientRect();
      return { x: ((clientX - r.left) / r.width) * SCENE_W, y: ((clientY - r.top) / r.height) * SCENE_H };
    },
    toScreenCoords(x, y) {
      const r = canvas.getBoundingClientRect();
      return { x: r.left + (x / SCENE_W) * r.width, y: r.top + (y / SCENE_H) * r.height };
    },
    /** Paloma bajo el punto (para el secreto). */
    pokePigeon(x, y) {
      const p = actors.find((a) => a.type === 'pigeon' && !a.leaving && Math.abs(a.x - x) < 9 && y > a.y - 14 && y < a.y + 4);
      if (!p) return 0;
      p.pokes += 1;
      say(p, pick(['¡Cru!', '¡Eh!', 'Cruuu...', '¿Perdona?', 'Te denuncio']), 1.2);
      flyPigeon(p, pick(PIGEON_PERCHES));
      return p.pokes;
    },
    celebrate(seconds = 1.2) {
      celebrateT = Math.max(celebrateT, seconds);
    },
    flash(seconds = 0.6) {
      flashT = Math.max(flashT, seconds);
    },
    shake(seconds = 0.4) {
      shakeT = Math.max(shakeT, seconds);
    },
    /** Reacción visual a un edificio comprado. */
    onBuildingBought(id) {
      const state = getState();
      reconcile(state);
      const spots = { printer: [60, 100], intern: [192, 170], pigeon: [192, 60], bossClone: [192, 180], bureaucracyReactor: [282, 110],
        meetingMachine: [330, 130], inhumanResources: [192, 190], dimensionalPrinter: [346, 112], universeFactory: [192, 56],
        paradoxDept: [192, 120], godServer: [130, 128], lostTimeMinistry: [192, 190], apocalypseCallCenter: [340, 170] };
      const [x, y] = spots[id] ?? [192, 120];
      spawnEffect('explosion', x - 12, y - 12, 0.5);
      if (id === 'printer') printerShakeT = 0.4;
      const near = actors.filter((a) => a.type !== 'pigeon').slice(0, 2);
      near.forEach((a) => { a.jumpT = 0.5; });
    },
    /** Reacción a un evento aleatorio. */
    onRandomEvent(id) {
      const pool = actors.filter((a) => !a.leaving);
      for (let i = 0; i < Math.min(3, pool.length); i++) say(pool[Math.floor(Math.random() * pool.length)], '!', 2);
      if (id === 'audit') {
        for (let i = 0; i < 2; i++) {
          const g = makeWalker('goblin', { anim: 'goblinWalk' }, { speed: 30, lifetime: 14 });
          g.x = i === 0 ? -10 : SCENE_W + 10;
          g.state = 'idle';
          g.timer = 0;
          actors.push(g);
          say(g, 'Auditoría', 3);
        }
      }
      if (id === 'printerVacation') printerShakeT = 1.5;
      if (id === 'pigeonQuits') {
        const p = actors.find((a) => a.type === 'pigeon' && !a.leaving);
        if (p) {
          say(p, 'Me voy al parque', 2);
          p.leavingOffscreen = true;
          flyPigeon(p, { x: SCENE_W + 20, y: 30 });
        }
      }
      if (id === 'bossReplaced') {
        const b = actors.find((a) => a.type === 'boss');
        if (b) say(b, '¡Soy el original!', 3);
      }
      if (id === 'coffeeFreeWill') bubbles.push({ actor: { x: 257, y: 137, type: 'coffee', scale: 1 }, text: '¡SOY LIBRE!', t: 3, fixed: true });
      shakeT = 0.3;
    },
    setSmokeEmitter(fn) {
      onSmoke = fn;
    },
    getActorCount() {
      return actors.length;
    },
  };
}
