// Guardado en localStorage con esquema versionado, copia de seguridad,
// validación estricta y exportación/importación JSON.
//
// Claves de localStorage:
//   oficinaFinDelMundo.save     Partida principal.
//   oficinaFinDelMundo.backup   Último guardado válido conocido (≤ 1 min).
//   oficinaFinDelMundo.corrupt.<fecha>  Copia de una partida que no se pudo cargar.

import { createInitialState, createCycleTemp, createDefaultSettings, SAVE_VERSION } from '../core/state.js';
import { BUILDING_IDS } from '../config/buildings.data.js';
import { UPGRADE_IDS } from '../config/upgrades.data.js';
import { TALENTS_BY_ID } from '../config/talents.data.js';
import { ACHIEVEMENT_IDS } from '../config/achievements.data.js';
import { DEPARTMENT_IDS } from '../config/departments.data.js';
import { MISSION_IDS } from '../config/missions.data.js';
import { BOARD_PERKS_BY_ID } from '../config/board.data.js';
import { RANDOM_EVENTS_BY_ID } from '../config/randomEvents.data.js';
import { EFFECT_TYPES, MAX_SAFE_AMOUNT } from '../core/economy.js';
import { migrate } from './migrations.js';

export const STORAGE_KEYS = {
  main: 'oficinaFinDelMundo.save',
  backup: 'oficinaFinDelMundo.backup',
  corruptPrefix: 'oficinaFinDelMundo.corrupt.',
};

export const MAX_IMPORT_BYTES = 512 * 1024;
export const BACKUP_EVERY_N_SAVES = 6;
export const KNOWN_SECRETS = ['logo', 'form404', 'pigeonPoke'];
const MAX_BUILDING_COUNT = 1e6;

// ─── Acceso a localStorage ────────────────────────────────────────────────

/** Devuelve un adaptador de almacenamiento o null si localStorage no funciona. */
export function getBrowserStorage() {
  try {
    const ls = globalThis.localStorage;
    if (!ls) return null;
    const probe = '__ofdm_probe__';
    ls.setItem(probe, '1');
    ls.removeItem(probe);
    return ls;
  } catch {
    return null;
  }
}

/** Almacenamiento en memoria con la misma interfaz (pruebas y modo sin guardado). */
export function createMemoryStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => { map.set(k, String(v)); },
    removeItem: (k) => { map.delete(k); },
    key: (i) => [...map.keys()][i] ?? null,
    get length() { return map.size; },
    _map: map,
  };
}

// ─── Validación ───────────────────────────────────────────────────────────

const num = (v, fallback = 0, { min = 0, max = MAX_SAFE_AMOUNT } = {}) =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback;

const uniqueKnown = (arr, known) =>
  Array.isArray(arr) ? [...new Set(arr.filter((x) => typeof x === 'string' && known.includes(x)))] : [];

function sanitizeEffects(list) {
  if (!Array.isArray(list)) return [];
  return list.slice(0, 8).filter((e) => e && typeof e === 'object' && EFFECT_TYPES.includes(e.type)).map((e) => {
    const out = { type: e.type, value: num(e.value, 1, { min: 0, max: 1000 }) };
    if (typeof e.target === 'string' && (e.target === 'ALL' || BUILDING_IDS.includes(e.target))) out.target = e.target;
    if (typeof e.source === 'string' && (e.source === 'ALL' || BUILDING_IDS.includes(e.source))) out.source = e.source;
    if (typeof e.threshold === 'number') out.threshold = num(e.threshold, 1, { min: 1, max: 1e6 });
    return out;
  });
}

function sanitizeTemp(raw) {
  const temp = createCycleTemp();
  if (!raw || typeof raw !== 'object') return temp;
  if (Array.isArray(raw.effects)) {
    temp.effects = raw.effects.slice(0, 12)
      .filter((e) => e && typeof e.id === 'string' && e.id.length <= 40)
      .map((e) => ({
        id: e.id,
        label: typeof e.label === 'string' ? e.label.slice(0, 60) : 'Efecto',
        remaining: num(e.remaining, 0, { max: 3600 }),
        duration: num(e.duration, 1, { min: 1, max: 3600 }),
        effects: sanitizeEffects(e.effects),
      }))
      .filter((e) => e.remaining > 0 && e.effects.length > 0);
    // Ids únicos.
    const seen = new Set();
    temp.effects = temp.effects.filter((e) => (seen.has(e.id) ? false : seen.add(e.id)));
  }
  temp.nextEventIn = num(raw.nextEventIn, temp.nextEventIn, { max: 1e5 });
  temp.nextGoldenIn = num(raw.nextGoldenIn, temp.nextGoldenIn, { max: 1e5 });
  temp.secondsSinceClick = num(raw.secondsSinceClick, 0, { max: 1e9 });
  if (raw.activeEvent && RANDOM_EVENTS_BY_ID[raw.activeEvent.id]) {
    temp.activeEvent = { id: raw.activeEvent.id, remaining: num(raw.activeEvent.remaining, 30, { max: 600 }) };
  }
  return temp;
}

/** Elimina talentos huérfanos o en conflicto (excluyentes) conservando el orden. */
function sanitizeTalents(list) {
  const out = [];
  for (const id of uniqueKnown(list, Object.keys(TALENTS_BY_ID))) {
    const t = TALENTS_BY_ID[id];
    if (t.excludes.some((x) => out.includes(x))) continue;
    out.push(id);
  }
  // Quitar los que han perdido requisitos (iterar hasta estabilizar).
  let changed = true;
  while (changed) {
    changed = false;
    for (const id of [...out]) {
      const t = TALENTS_BY_ID[id];
      const okAll = t.requires.every((r) => out.includes(r));
      const okAny = !t.requiresAny?.length || t.requiresAny.some((r) => out.includes(r));
      if (!okAll || !okAny) {
        out.splice(out.indexOf(id), 1);
        changed = true;
      }
    }
  }
  return out;
}

/** Ventajas del Consejo conocidas y con sus requisitos presentes. */
function sanitizeBoard(list) {
  const out = uniqueKnown(list, Object.keys(BOARD_PERKS_BY_ID));
  let changed = true;
  while (changed) {
    changed = false;
    for (const id of [...out]) {
      if (!BOARD_PERKS_BY_ID[id].requires.every((r) => out.includes(r))) {
        out.splice(out.indexOf(id), 1);
        changed = true;
      }
    }
  }
  return out;
}

/**
 * Construye un estado válido a partir de datos no confiables (ya migrados).
 * Ignora claves desconocidas, descarta ids desconocidos y sustituye cualquier
 * número no finito o negativo por su valor por defecto.
 */
export function sanitizeState(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Formato de partida no válido.');
  if (!raw.resources || typeof raw.resources !== 'object') throw new Error('La partida no contiene recursos.');
  const state = createInitialState();
  const r = raw.resources;

  state.resources.paperwork = num(r.paperwork);
  state.resources.cycleTotal = num(r.cycleTotal);
  state.resources.lifetimePaperwork = num(r.lifetimePaperwork);
  state.resources.influence = num(r.influence);
  state.resources.totalInfluenceEarned = num(r.totalInfluenceEarned);
  state.resources.shares = num(r.shares);
  state.resources.totalSharesEarned = Math.max(num(r.totalSharesEarned), state.resources.shares);
  // Coherencia: lo producido nunca es menor que lo disponible.
  state.resources.lifetimePaperwork = Math.max(state.resources.lifetimePaperwork, state.resources.cycleTotal);

  if (raw.buildings && typeof raw.buildings === 'object') {
    for (const id of BUILDING_IDS) state.buildings[id] = Math.floor(num(raw.buildings[id], 0, { max: MAX_BUILDING_COUNT }));
  }
  state.upgrades = uniqueKnown(raw.upgrades, UPGRADE_IDS);
  state.talents = sanitizeTalents(raw.talents);
  state.board = sanitizeBoard(raw.board);

  if (raw.achievements && typeof raw.achievements === 'object' && !Array.isArray(raw.achievements)) {
    for (const id of ACHIEVEMENT_IDS) {
      if (id in raw.achievements) state.achievements[id] = num(raw.achievements[id], Date.now(), { max: 8.64e15 });
    }
  }
  state.secrets = uniqueKnown(raw.secrets, KNOWN_SECRETS);

  const deps = uniqueKnown(raw.unlockedDepartments, DEPARTMENT_IDS);
  state.unlockedDepartments = DEPARTMENT_IDS.filter((id) => id === 'basement' || deps.includes(id));

  state.missions.claimed = uniqueKnown(raw.missions?.claimed, MISSION_IDS);
  state.temp = sanitizeTemp(raw.temp);

  if (raw.statistics && typeof raw.statistics === 'object') {
    for (const key of Object.keys(state.statistics)) {
      if (key === 'startedAt') state.statistics.startedAt = num(raw.statistics.startedAt, state.statistics.startedAt, { max: 8.64e15 });
      else state.statistics[key] = num(raw.statistics[key], 0);
    }
  }
  state.flags.endingSeen = raw.flags?.endingSeen === true;

  const defaults = createDefaultSettings();
  const s = raw.settings ?? {};
  state.settings = {
    particles: typeof s.particles === 'boolean' ? s.particles : defaults.particles,
    reducedMotion: typeof s.reducedMotion === 'boolean' ? s.reducedMotion : defaults.reducedMotion,
    sound: typeof s.sound === 'boolean' ? s.sound : defaults.sound,
    eventFrequency: ['normal', 'low', 'off'].includes(s.eventFrequency) ? s.eventFrequency : defaults.eventFrequency,
    notation: ['short', 'scientific'].includes(s.notation) ? s.notation : defaults.notation,
    buyAmount: [1, 10, 'max'].includes(s.buyAmount) ? s.buyAmount : defaults.buyAmount,
  };
  state.lastSavedAt = num(raw.lastSavedAt, 0, { max: 8.64e15 });
  state.version = SAVE_VERSION;
  return state;
}

/** Texto JSON → estado válido. Lanza un Error con mensaje legible si falla. */
export function parseSave(text) {
  if (typeof text !== 'string' || text.length === 0) throw new Error('No hay datos.');
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('El texto no es JSON válido.');
  }
  // Aceptar tanto el formato de exportación { game, save } como el estado directo.
  if (data && typeof data === 'object' && data.game === 'oficina-fin-del-mundo' && data.save) data = data.save;
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Formato de partida no válido.');
  if (!data.resources || typeof data.resources !== 'object' || Array.isArray(data.resources)) {
    throw new Error('La partida no contiene recursos.');
  }
  return sanitizeState(migrate(data));
}

// ─── Guardar / cargar ─────────────────────────────────────────────────────

export function serializeState(state) {
  return JSON.stringify(state);
}

let savesSinceBackup = 0;

/**
 * Guarda la partida. Solo actualiza lastSavedAt si la escritura tiene éxito,
 * para que el progreso offline nunca se calcule desde un guardado fallido.
 */
export function saveGame(state, storage, now = Date.now()) {
  if (!storage) return { ok: false, error: 'El almacenamiento local no está disponible.' };
  const previous = state.lastSavedAt;
  state.lastSavedAt = now;
  try {
    const json = serializeState(state);
    storage.setItem(STORAGE_KEYS.main, json);
    savesSinceBackup += 1;
    if (savesSinceBackup >= BACKUP_EVERY_N_SAVES) {
      storage.setItem(STORAGE_KEYS.backup, json);
      savesSinceBackup = 0;
    }
    return { ok: true };
  } catch (err) {
    state.lastSavedAt = previous;
    const quota = err && (err.name === 'QuotaExceededError' || err.code === 22);
    return { ok: false, error: quota ? 'Sin espacio en el almacenamiento local.' : `No se pudo guardar: ${err?.message ?? err}` };
  }
}

function preserveCorrupt(storage, raw, now) {
  try {
    storage.setItem(`${STORAGE_KEYS.corruptPrefix}${new Date(now).toISOString()}`, raw);
    return true;
  } catch {
    return false;
  }
}

/**
 * Carga segura:
 *   1. Partida principal válida → se usa y se refresca la copia de seguridad.
 *   2. Si falla, se conserva una copia del texto dañado y se prueba el backup.
 *   3. Si también falla, partida nueva + aviso (los datos dañados se conservan).
 */
export function loadGame(storage, now = Date.now()) {
  if (!storage) return { state: createInitialState(now), source: 'new', warning: 'El almacenamiento local no está disponible: la partida no se guardará.' };
  const main = storage.getItem(STORAGE_KEYS.main);
  const backup = storage.getItem(STORAGE_KEYS.backup);

  if (main) {
    try {
      const state = parseSave(main);
      try { storage.setItem(STORAGE_KEYS.backup, main); } catch { /* sin espacio: no crítico */ }
      return { state, source: 'main' };
    } catch (err) {
      const kept = preserveCorrupt(storage, main, now);
      if (backup) {
        try {
          const state = parseSave(backup);
          return { state, source: 'backup', warning: `La partida principal estaba dañada (${err.message}). Se ha recuperado la copia de seguridad.${kept ? ' Se conservó una copia de los datos dañados.' : ''}` };
        } catch { /* sigue abajo */ }
      }
      return { state: createInitialState(now), source: 'new', warning: `No se pudo cargar la partida (${err.message}).${kept ? ' Los datos dañados se conservaron en el almacenamiento local por si quieres recuperarlos.' : ''} Se ha empezado una partida nueva.` };
    }
  }
  if (backup) {
    try {
      return { state: parseSave(backup), source: 'backup', warning: 'No había partida principal; se ha cargado la copia de seguridad.' };
    } catch { /* partida nueva */ }
  }
  return { state: createInitialState(now), source: 'new' };
}

/** Borra la partida y su copia (reinicio total pedido por el jugador). */
export function deleteSave(storage) {
  if (!storage) return;
  storage.removeItem(STORAGE_KEYS.main);
  storage.removeItem(STORAGE_KEYS.backup);
  savesSinceBackup = 0;
}

// ─── Exportar / importar ──────────────────────────────────────────────────

export function exportSave(state, now = Date.now()) {
  return JSON.stringify({ game: 'oficina-fin-del-mundo', exportedAt: new Date(now).toISOString(), save: state }, null, 2);
}

/** Valida un texto importado. No modifica nada: devuelve el estado para aplicarlo. */
export function importSave(text) {
  if (typeof text !== 'string') return { ok: false, error: 'No hay texto que importar.' };
  if (text.length > MAX_IMPORT_BYTES) return { ok: false, error: `El archivo es demasiado grande (máximo ${MAX_IMPORT_BYTES / 1024} KB).` };
  try {
    return { ok: true, state: parseSave(text.trim()) };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}
