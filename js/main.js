// Punto de entrada: carga la partida, conecta la lógica con la interfaz y
// arranca los tres bucles (simulación, interfaz y animación).

import { createInitialState } from './core/state.js';
import { performClick, invalidateModifiers } from './core/economy.js';
import { on } from './core/events.js';
import { createGameLoop, simulateStep, runChecks } from './core/gameLoop.js';
import { DEPARTMENTS_BY_ID } from './config/departments.data.js';
import { ACHIEVEMENTS_BY_ID } from './config/achievements.data.js';
import { UPGRADES_BY_ID } from './config/upgrades.data.js';
import { TALENTS_BY_ID } from './config/talents.data.js';
import { MISSIONS_BY_ID } from './config/missions.data.js';
import { buyBuilding as buyBuildingSystem } from './systems/buildings.js';
import { buyUpgrade as buyUpgradeSystem } from './systems/upgrades.js';
import { buyTalent as buyTalentSystem, respecTalents as respecSystem } from './systems/talents.js';
import { claimMission as claimMissionSystem } from './systems/missions.js';
import { performPrestige } from './systems/prestige.js';
import { performMerger, buyBoardPerk as buyBoardPerkSystem } from './systems/merger.js';
import { BOARD_PERKS_BY_ID } from './config/board.data.js';
import { resolveEvent, clickGolden } from './systems/randomEvents.js';
import { applyOfflineProgress } from './systems/offlineProgress.js';
import { discoverSecret, checkAchievements } from './systems/achievements.js';
import { getBrowserStorage, loadGame, saveGame, deleteSave } from './storage/save.js';
import { setNotation, formatNumber, formatDuration } from './utils/format.js';
import { $, el, replayAnimation } from './ui/dom.js';
import { initNavigation, setView } from './ui/navigation.js';
import { initModal, isModalOpen, openModal, toast, news } from './ui/notifications.js';
import { loadSprites } from './ui/sprites.js';
import { initParticles, emit as emitParticles, emitText, setParticlesEnabled, setReducedMotion } from './ui/particles.js';
import { createScene } from './ui/scene.js';
import { createRenderer } from './ui/render.js';
import { play, setSoundEnabled, initAudioUnlock } from './ui/audio.js';
import {
  openSettings, openRandomEvent, openPrestigeConfirm, openMergerConfirm, openOfflineSummary, openEnding,
} from './ui/views/dialogs.js';

const AUTOSAVE_MS = 10_000;
const CHECKS_MS = 500;
const RENDER_MS = 100;

let state = createInitialState();
const storage = getBrowserStorage();
const getState = () => state;
const pendingTopics = new Set();
let scene = null;
let renderer = null;
let loop = null;
let eventModalOpen = false;
let lastPointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
let saveErrorShown = false;
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)');

function isReducedMotion() {
  return state.settings.reducedMotion || prefersReduced.matches;
}

// ─── Ajustes ──────────────────────────────────────────────────────────────

function applySettings() {
  const s = state.settings;
  document.documentElement.classList.toggle('reduced-motion', s.reducedMotion);
  setParticlesEnabled(s.particles);
  setReducedMotion(isReducedMotion());
  setSoundEnabled(s.sound);
  setNotation(s.notation);
  const soundBtn = $('#btn-sound');
  soundBtn.setAttribute('aria-pressed', String(s.sound));
  soundBtn.setAttribute('aria-label', s.sound ? 'Sonido activado (pulsa para silenciar)' : 'Sonido desactivado (pulsa para activar)');
}

// ─── Guardado ─────────────────────────────────────────────────────────────

function saveNow(manual = false) {
  const status = $('#save-status');
  const result = saveGame(state, storage);
  if (result.ok) {
    status.dataset.state = 'ok';
    status.textContent = `Guardado ${new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
    saveErrorShown = false;
    if (manual) toast({ title: 'Partida guardada', icon: '💾' });
  } else {
    status.dataset.state = 'error';
    status.textContent = 'No guardado';
    status.title = result.error;
    if (!saveErrorShown || manual) {
      toast({ title: 'No se pudo guardar', text: `${result.error} Exporta tu partida desde Ajustes para no perderla.`, icon: '⚠', type: 'warning', duration: 8000 });
      saveErrorShown = true;
    }
  }
  return result.ok;
}

// ─── Acciones del jugador ─────────────────────────────────────────────────

function markTopics(...topics) {
  topics.forEach((t) => pendingTopics.add(t));
}

function doClick(x, y) {
  const { amount, crit } = performClick(state);
  scene.onPlayerClick();
  play(crit ? 'crit' : 'click');
  emitParticles('paper', x, y, crit ? 8 : 3);
  emitText(`+${formatNumber(amount)}${crit ? '!' : ''}`, x, y - 10, { color: crit ? '#FFD166' : '#32F5C8', size: crit ? 30 : 22 });
  if (crit) emitParticles('star', x, y, 8);
  replayAnimation($('#res-paperwork'), 'is-bumped', 220);
  markTopics('clicks', 'stats', 'paperwork');
}

const actions = {
  buyBuilding(id) {
    const r = buyBuildingSystem(state, id, state.settings.buyAmount);
    if (!r.ok) {
      play('error');
      return;
    }
    play('buy');
    emitParticles('coin', lastPointer.x, lastPointer.y, 8);
    scene.onBuildingBought(id);
    markTopics('buildings');
    renderer.frame(true);
  },
  buyUpgrade(id) {
    const r = buyUpgradeSystem(state, id);
    if (!r.ok) {
      play('error');
      return;
    }
    const up = UPGRADES_BY_ID[id];
    play('upgrade');
    emitParticles('star', lastPointer.x, lastPointer.y, 14);
    emitParticles('glow', lastPointer.x, lastPointer.y, 4);
    scene.celebrate(0.6);
    news(`Mejora comprada: ${up.name}`);
    markTopics('upgrades');
    renderer.frame(true);
    if (id === 'form404B' && !state.flags.endingSeen) {
      state.flags.endingSeen = true;
      emitParticles('confetti', window.innerWidth / 2, window.innerHeight / 3, 120);
      scene.flash(1.5);
      openEnding();
    }
  },
  buyTalent(id) {
    const r = buyTalentSystem(state, id);
    if (!r.ok) {
      play('error');
      return;
    }
    play('upgrade');
    emitParticles('star', lastPointer.x, lastPointer.y, 16);
    news(`Talento adquirido: ${TALENTS_BY_ID[id].name}`);
    markTopics('talents');
    renderer.frame(true);
    saveNow();
  },
  respecTalents() {
    const r = respecSystem(state);
    if (r.ok) {
      toast({ title: 'Talentos reasignados', text: `Recuperas ${r.refund} de Influencia.`, icon: '↺', type: 'magenta' });
      renderer.frame(true);
      saveNow();
    }
  },
  claimMission(id) {
    const r = claimMissionSystem(state, id);
    if (!r.ok) {
      play('error');
      return;
    }
    play('buy');
    emitParticles('coin', lastPointer.x, lastPointer.y, 16);
    const m = MISSIONS_BY_ID[id];
    toast({ title: `Misión completada: ${m.name}`, text: r.amount > 0 ? `+${formatNumber(r.amount)} de papeleo` : m.reward.temp?.label, icon: '📋' });
    news(`Misión completada: ${m.name}`);
    markTopics('stats');
    renderer.frame(true);
  },
  setBuyAmount(amount) {
    state.settings.buyAmount = amount;
    renderer.frame(true);
  },
  setSetting(key, value) {
    state.settings[key] = value;
    applySettings();
    renderer.invalidate();
    renderer.frame(true);
    saveNow();
  },
  async requestPrestige() {
    const ok = await openPrestigeConfirm({ getState });
    if (!ok) return;
    const r = performPrestige(state, { confirmed: true });
    if (!r.ok) {
      toast({ title: 'No se pudo ascender', text: r.reason === 'error' ? 'Error inesperado: la partida no se ha modificado.' : 'Todavía no cumples los requisitos.', icon: '⚠', type: 'warning' });
      return;
    }
    document.body.classList.add('is-ascending');
    setTimeout(() => document.body.classList.remove('is-ascending'), 1500);
    play('prestige');
    emitParticles('ascend', 0, 0, 90);
    scene.reset(state);
    scene.flash(1.2);
    renderer.invalidate();
    markTopics('prestige', 'stats');
    runChecksNow();
    toast({ title: `¡Has ascendido! +${formatNumber(r.gained)} ✦`, text: 'La oficina vuelve a empezar, pero tú ya no eres el mismo becario.', icon: '⇪', type: 'magenta', duration: 6000 });
    news(`Ascenso n.º ${state.statistics.totalPrestiges}: +${formatNumber(r.gained)} de Influencia`);
    saveNow();
    setView('talents');
  },
  async requestMerger() {
    const ok = await openMergerConfirm({ getState });
    if (!ok) return;
    const r = performMerger(state, { confirmed: true });
    if (!r.ok) {
      toast({ title: 'No se pudo fusionar', text: r.reason === 'error' ? 'Error inesperado: la partida no se ha modificado.' : 'Todavía no cumples los requisitos.', icon: '⚠', type: 'warning' });
      return;
    }
    document.body.classList.add('is-ascending');
    setTimeout(() => document.body.classList.remove('is-ascending'), 1500);
    play('prestige');
    emitParticles('ascend', 0, 0, 140);
    emitParticles('confetti', window.innerWidth / 2, window.innerHeight / 3, 80);
    scene.reset(state);
    scene.flash(1.5);
    renderer.invalidate();
    markTopics('prestige', 'stats', 'talents');
    runChecksNow();
    toast({ title: `¡Fusión completada! +${formatNumber(r.gained)} ◆`, text: 'La empresa y el multiverso ya son lo mismo. Empiezas de cero con Acciones.', icon: '⚭', type: 'achievement', duration: 7000 });
    news(`Fusión n.º ${state.statistics.totalMergers}: +${formatNumber(r.gained)} Acciones`);
    saveNow();
  },
  buyBoardPerk(id) {
    const r = buyBoardPerkSystem(state, id);
    if (!r.ok) {
      play('error');
      return;
    }
    play('upgrade');
    emitParticles('star', lastPointer.x, lastPointer.y, 20);
    news(`Ventaja del Consejo: ${BOARD_PERKS_BY_ID[id].name}`);
    markTopics('prestige');
    renderer.invalidate();
    renderer.frame(true);
    saveNow();
  },
  saveNow,
  replaceState(newState, message) {
    state = newState;
    state.lastSavedAt = Date.now(); // sin recompensa offline por importar
    invalidateModifiers();
    applySettings();
    scene.reset(state);
    renderer.invalidate();
    renderer.resetAchievementBadge();
    runChecksNow();
    saveNow();
    toast({ title: message, icon: '✓' });
  },
  hardReset() {
    deleteSave(storage);
    const settings = { ...state.settings };
    state = createInitialState();
    state.settings = settings;
    invalidateModifiers();
    scene.reset(state);
    renderer.invalidate();
    renderer.resetAchievementBadge();
    saveNow();
    toast({ title: 'Partida borrada', text: 'Bienvenido de nuevo al sótano.', icon: '🗑' });
  },
};

// ─── Comprobaciones periódicas ────────────────────────────────────────────

function runChecksNow() {
  const topics = [...pendingTopics];
  pendingTopics.clear();
  runChecks(state, topics);
}

// ─── Reacciones a los hechos del juego (bus de eventos) ──────────────────

function wireGameEvents() {
  on('achievementUnlocked', ({ id }) => {
    const a = ACHIEVEMENTS_BY_ID[id];
    play('achievement');
    toast({ title: `🏆 ${a.name}`, text: `${a.description}${a.reward?.text ? ` · ${a.reward.text}` : ''}`, icon: '🏆', type: 'achievement', duration: 5000 });
    emitParticles('confetti', window.innerWidth / 2, window.innerHeight * 0.25, 40);
    scene?.celebrate(1.2);
    news(`Logro: ${a.name}`);
    if (id === 'secretLogo') {
      openModal({ title: 'No deberías estar viendo esto', body: [el('p', { text: 'Has encontrado el memorando 0: «Si alguien lee esto, el apocalipsis ya está en marcha. Firma: Dirección». Por las molestias, +1 de Influencia.' })] });
    }
  });
  on('departmentUnlocked', ({ id }) => {
    const d = DEPARTMENTS_BY_ID[id];
    play('department');
    toast({ title: `Nuevo departamento: ${d.name}`, text: d.unlockText, icon: '🏢', type: 'magenta', duration: 7000 });
    news(`Desbloqueado ${d.title}`);
    scene?.flash(0.8);
    scene?.celebrate(1.5);
    emitParticles('confetti', window.innerWidth / 2, window.innerHeight * 0.3, 60);
    renderer?.invalidate();
  });
  on('randomEvent', ({ id }) => {
    play('event');
    scene?.onRandomEvent(id);
  });
  on('randomEventResolved', ({ message, amount, auto }) => {
    toast({ title: auto ? 'Evento resuelto automáticamente' : 'Evento resuelto', text: `${message}${amount > 0 ? ` (+${formatNumber(amount)})` : ''}`, icon: '⚠' });
    news(message);
    markTopics('stats');
  });
  on('goldenSpawn', () => {
    play('golden');
    news('¡Ha aparecido un formulario dorado en la oficina!');
  });
  on('goldenClicked', ({ label, amount }) => {
    toast({ title: label, text: amount > 0 ? `+${formatNumber(amount)} de papeleo` : 'Bonificación temporal activada', icon: '📜', type: 'achievement' });
    markTopics('stats');
  });
  on('tempEffectStarted', ({ label }) => news(`Efecto activo: ${label}`));
  on('tempEffectEnded', ({ label }) => news(`Fin del efecto: ${label}`));
  on('secretFound', () => play('achievement'));
}

/** Abre la ventana del evento pendiente cuando no hay otra modal abierta. */
async function maybeOpenEvent() {
  if (eventModalOpen || !state.temp.activeEvent || isModalOpen()) return;
  eventModalOpen = true;
  const eventId = state.temp.activeEvent.id;
  const choice = await openRandomEvent({ getState, eventId });
  eventModalOpen = false;
  if (state.temp.activeEvent?.id === eventId) {
    const r = resolveEvent(state, choice);
    if (!r.ok && r.reason === 'funds') resolveEvent(state, 0);
  }
}

// ─── Entrada del jugador ──────────────────────────────────────────────────

function wireInput() {
  document.addEventListener('pointerdown', (e) => { lastPointer = { x: e.clientX, y: e.clientY }; }, { passive: true });

  const sceneNode = $('#scene');
  sceneNode.addEventListener('pointerdown', (e) => {
    if (e.target.closest('#golden-form')) return;
    if (e.button !== undefined && e.button !== 0) return;
    const { x, y } = scene.toSceneCoords(e.clientX, e.clientY);
    const pokes = scene.pokePigeon(x, y);
    if (pokes >= 20) discoverSecret(state, 'pigeonPoke');
    doClick(e.clientX, e.clientY);
  });

  $('#btn-stamp').addEventListener('click', (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    // Con teclado no hay coordenadas: usar el centro del botón.
    const x = e.clientX || r.left + r.width / 2;
    const y = e.clientY || r.top;
    replayAnimation(e.currentTarget, 'is-pressed', 160);
    doClick(x, y);
  });

  $('#golden-form').addEventListener('click', (e) => {
    const r = clickGolden(state);
    if (r.ok) {
      play('golden');
      emitParticles('star', e.clientX || lastPointer.x, e.clientY || lastPointer.y, 24);
      emitParticles('coin', e.clientX || lastPointer.x, e.clientY || lastPointer.y, 16);
      renderer.frame(true);
    }
  });

  $('#btn-settings').addEventListener('click', () => openSettings({ getState, actions }));
  $('#btn-sound').addEventListener('click', () => actions.setSetting('sound', !state.settings.sound));

  // Secreto 1: pulsar el logo 5 veces seguidas.
  let logoClicks = [];
  $('#logo').addEventListener('click', () => {
    const now = Date.now();
    logoClicks = logoClicks.filter((t) => now - t < 3000).concat(now);
    if (logoClicks.length >= 5) {
      logoClicks = [];
      discoverSecret(state, 'logo');
    }
  });

  // Secreto 2: teclear «404b» en cualquier parte.
  let typed = '';
  document.addEventListener('keydown', (e) => {
    if (e.target.closest?.('input, textarea, select')) return;
    if (e.key.length !== 1) return;
    typed = (typed + e.key.toLowerCase()).slice(-4);
    if (typed === '404b') discoverSecret(state, 'form404');
  });
}

// ─── Ciclo de vida ────────────────────────────────────────────────────────

function handleGap(seconds) {
  // La pestaña estuvo congelada o el equipo suspendido: tratarlo como offline.
  const previous = state.lastSavedAt;
  state.lastSavedAt = Date.now() - seconds * 1000;
  const summary = applyOfflineProgress(state, Date.now());
  state.lastSavedAt = previous;
  if (summary.gain > 0) {
    markTopics('stats', 'paperwork');
    toast({ title: 'Has vuelto', text: `En ${formatDuration(summary.seconds)} la oficina produjo +${formatNumber(summary.gain)}.`, icon: '⏰', duration: 6000 });
  }
}

function wireLifecycle() {
  setInterval(() => saveNow(), AUTOSAVE_MS);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      saveNow();
      scene.stop();
    } else {
      scene.start();
      loop.resync();
    }
  });
  window.addEventListener('pagehide', () => saveNow());
  window.addEventListener('beforeunload', () => saveNow());
  prefersReduced.addEventListener?.('change', applySettings);
}

function showWelcome() {
  return openModal({
    title: 'Bienvenido, becario',
    body: [
      el('p', { text: 'El universo no puede terminar: alguien olvidó tramitar el formulario 404-B que autoriza el apocalipsis. Y ese alguien, desde hoy, eres tú.' }),
      el('p', { text: 'Haz clic en la oficina (o pulsa SELLAR FORMULARIO) para producir papeleo. Compra impresoras, contrata becarios y deja que la burocracia trabaje por ti.' }),
      el('p', { class: 'modal-note', text: 'La partida se guarda sola. Puedes exportarla desde Ajustes (⚙).' }),
    ],
    actions: [{ label: 'Firmar el contrato (sin leerlo)', value: null, class: 'btn--primary', autofocus: true }],
  });
}

async function init() {
  initModal();
  const loaded = loadGame(storage);
  state = loaded.state;
  applySettings();
  initNavigation();

  // Fuentes y sprites (si algo falla, el juego sigue con marcadores).
  try {
    await Promise.race([document.fonts?.load("10px 'Kenney Pixel'") ?? Promise.resolve(), new Promise((r) => setTimeout(r, 1500))]);
  } catch { /* fuente opcional */ }
  await loadSprites();

  initParticles($('#fx-canvas'));
  scene = createScene($('#scene-canvas'), { getState, isReducedMotion });
  scene.setSmokeEmitter((x, y) => {
    const p = scene.toScreenCoords(x, y);
    emitParticles('smoke', p.x, p.y, 1);
  });
  scene.reset(state);
  renderer = createRenderer({ getState, actions });
  wireGameEvents();
  wireInput();
  initAudioUnlock();

  // Progreso offline (solo con un guardado previo válido).
  let offline = null;
  if (loaded.source !== 'new') offline = applyOfflineProgress(state, Date.now());
  checkAchievements(state);
  runChecks(state);

  loop = createGameLoop({
    onStep: (dt) => simulateStep(state, dt),
    onGap: handleGap,
  });
  loop.start();
  setInterval(() => {
    runChecksNow();
    scene.sync(state);
    maybeOpenEvent();
  }, CHECKS_MS);
  setInterval(() => renderer.frame(), RENDER_MS);
  renderer.frame(true);
  scene.start();
  wireLifecycle();
  saveNow();
  // Gancho para pruebas automatizadas y depuración.
  window.__ofdm = { getState, actions, saveNow };

  if (loaded.warning) {
    toast({ title: 'Aviso sobre la partida', text: loaded.warning, icon: '⚠', type: 'warning', duration: 12000 });
    news(loaded.warning);
  }
  if (loaded.source === 'new' && !loaded.warning) await showWelcome();
  if (offline && offline.gain > 0) await openOfflineSummary(offline);
  news('Empieza la jornada laboral. Nadie sabe cuándo termina.');

}

init().catch((err) => {
  console.error('[main] Error al iniciar el juego', err);
  const p = document.createElement('p');
  p.className = 'noscript';
  p.textContent = `No se pudo iniciar el juego: ${err.message}. Recarga la página; tu partida guardada no se ha tocado.`;
  document.body.prepend(p);
});
