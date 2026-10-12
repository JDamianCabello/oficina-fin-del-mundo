// Escena de la oficina: canvas de 384×216 escalado con píxeles nítidos.
// Representa visualmente el estado del juego: cada edificio comprado añade
// personajes o máquinas, cada departamento cambia la decoración y los eventos
// provocan reacciones. Solo LEE el estado; nunca lo modifica.

import { drawFrame, drawAnim, frameSize, drawPlanet, getAnimFrame } from './sprites.js';

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
  adminGod: { wall: '#2a1747', wall2: '#22123b', floor: '#170f27', floor2: '#211638', sign: 'DESPACHO DEL DIOS ADMINISTRATIVO', signColor: '#ffd166', light: '#ffd16626' },
};

const CHATTER = [
  '¿Esto lo firmo yo?', 'Reunión a las 5', '¿Dónde está el 404-B?', 'Mi contrato es un pósit',
  'Las palomas me miran raro', '¿Quién ha clonado al jefe?', 'Ctrl+C, Ctrl+V, Ctrl+fin del mundo',
  'Esto es un trámite', 'Vuelva usted mañana', 'Falta un sello', 'Por triplicado, por favor',
  'Hoy no hay café', '¿El apocalipsis entra en mis horas?', 'Cuadra. No sé cómo, pero cuadra',
];

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

  // ─── Fondo (se regenera solo al cambiar de departamento) ──────────────
  function currentDepartment(state) {
    const order = ['basement', 'exploitation', 'hellHR', 'multinational', 'adminGod'];
    let dep = 'basement';
    for (const id of order) if (state.unlockedDepartments.includes(id)) dep = id;
    return dep;
  }

  function renderBackground(dep) {
    const b = background.getContext('2d');
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
    if (dep === 'adminGod') {
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
    const doom = ['basement', 'exploitation', 'hellHR', 'multinational', 'adminGod'].indexOf(dep);
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
    const map = { minotaur: 'minotaur', ghost: 'ghost', wizard: 'wizard', lizard: 'lizard', skeleton: 'skeleton', alien: 'platformerChars', goblin: 'goblin' };
    return frameSize(map[a.type] ?? 'dungeon');
  }

  function drawActor(a, t) {
    const reduced = isReducedMotion();
    const { w, h } = actorSize(a);
    const scale = a.scale ?? 1;
    const pop = a.spawnT < 1 ? 0.5 + a.spawnT * 0.5 : 1;
    const jump = (celebrateT > 0 || a.jumpT > 0) && !reduced ? Math.abs(Math.sin(t / 90)) * 4 : 0;
    const walking = a.state === 'walk' && !reduced;
    const breathe = !reduced && !walking ? Math.round(Math.sin(t / 500 + a.bob) * 0.6) : 0;
    const hop = walking && a.draw?.sheet ? Math.abs(Math.sin(t / 110 + a.bob)) * 2 : 0;
    const floatY = a.float && !reduced ? Math.sin(t / 600 + a.bob) * 3 : 0;
    const dw = w * scale * pop;
    const dh = h * scale * pop;
    const x = a.x - dw / 2;
    const y = a.y - dh - jump - hop + breathe + floatY;
    const opts = { flip: a.flip, scale: scale * pop, alpha: a.alpha };
    const animTime = reduced ? 0 : walking || a.float || a.type === 'boss' ? t + a.bob * 1000 : 0;
    if (a.draw?.anim) {
      if (a.draw.px) drawFrame(ctx, `px:${a.draw.px}`, getAnimFrame(a.draw.anim, animTime), x, y, opts);
      else drawAnim(ctx, a.draw.anim, animTime, x, y, opts);
    } else if (a.draw?.sheet) {
      drawFrame(ctx, a.draw.sheet, a.draw.index, x, y, opts);
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
    ctx.save();
    if (shakeT > 0 && !isReducedMotion()) ctx.translate(Math.round(Math.sin(t / 20) * 2), 0);
    ctx.fillStyle = '#0b0c14';
    ctx.fillRect(-4, 0, SCENE_W + 8, SCENE_H);
    ctx.drawImage(background, 0, 0);
    drawWindow(state, t);
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
      bubbles.length = 0;
      effects.length = 0;
      backgroundKey = '';
      reconcile(state);
    },
    /** Reacción a un clic del jugador. */
    onPlayerClick() {
      typingT = 0.15;
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
