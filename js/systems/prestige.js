// Prestigio («Ascender»): reinicia el ciclo a cambio de Influencia permanente.
//
// Fórmula: Influencia = floor( (papeleoDelCiclo / PRESTIGE_DIVISOR) ^ PRESTIGE_EXPONENT × influenceMult )
//
// El diseño proponía sqrt(ciclo / 1e6). La simulación de balance
// (npm run balance) demostró que, combinada con +2 % de producción por punto,
// la raíz cuadrada se dispara: cada ascenso multiplicaba la Influencia por
// ~1000 y a los 30 minutos se llegaba a cifras de 1e10. Con raíz cúbica el
// primer ascenso (~1e9–1e10 de papeleo) da ~10–21 puntos y los siguientes
// crecen de forma sostenida. Ver PLAN.md («Balance»).

import { createCycleTemp, createEmptyBuildings, cloneState } from '../core/state.js';
import { getModifiers, invalidateModifiers, finiteOr } from '../core/economy.js';
import { isFeatureUnlocked } from '../core/progression.js';
import { grantInfluence } from './achievements.js';
import { emit } from '../core/events.js';

export const PRESTIGE_DIVISOR = 1e6;
export const PRESTIGE_EXPONENT = 1 / 3;

export function getPrestigeGain(state, cycleTotal = state.resources.cycleTotal) {
  const mods = getModifiers(state, { includeTemp: false });
  const x = Math.max(0, cycleTotal) / PRESTIGE_DIVISOR;
  // Math.cbrt es exacto en cubos perfectos (Math.pow(1000, 1/3) = 9,999…).
  const root = PRESTIGE_EXPONENT === 1 / 3 ? Math.cbrt(x) : Math.pow(x, PRESTIGE_EXPONENT);
  const raw = root * mods.influenceMult;
  return Math.max(0, Math.floor(finiteOr(raw, 0) + 1e-9));
}

/** Papeleo del ciclo necesario para ganar `n` puntos de Influencia. */
export function getCycleTotalForGain(state, n) {
  const mods = getModifiers(state, { includeTemp: false });
  return Math.pow(n / mods.influenceMult, 1 / PRESTIGE_EXPONENT) * PRESTIGE_DIVISOR;
}

export function canPrestige(state) {
  return isFeatureUnlocked(state, 'prestige') && getPrestigeGain(state) >= 1;
}

export const RESET_LIST = [
  'Papeleo disponible y papeleo del ciclo',
  'Todos los edificios',
  'Todas las mejoras',
  'Misiones reclamadas y efectos temporales',
];

export const KEEP_LIST = [
  'Influencia y su bonificación de producción',
  'Talentos comprados',
  'Logros y sus recompensas',
  'Departamentos desbloqueados',
  'Estadísticas históricas y ajustes',
];

export function getPrestigePreview(state) {
  const gain = getPrestigeGain(state);
  const mods = getModifiers(state, { includeTemp: false });
  return {
    current: state.resources.influence,
    totalEarned: state.resources.totalInfluenceEarned,
    gain,
    after: state.resources.influence + gain,
    bonusNow: mods.influencePower * state.resources.totalInfluenceEarned,
    bonusAfter: mods.influencePower * (state.resources.totalInfluenceEarned + gain),
    nextAt: getCycleTotalForGain(state, gain + 1),
    canPrestige: canPrestige(state),
    resets: RESET_LIST,
    keeps: KEEP_LIST,
  };
}

/**
 * Ejecuta el ascenso. Requiere `confirmed: true` (la interfaz lo pide con un
 * diálogo). Es atómico: el nuevo estado se construye sobre una copia, se valida
 * y solo entonces se vuelca sobre el estado real; si algo falla, el estado
 * original queda intacto.
 */
export function performPrestige(state, { confirmed = false, now = Date.now() } = {}) {
  if (!confirmed) return { ok: false, reason: 'notConfirmed' };
  if (!canPrestige(state)) return { ok: false, reason: 'notAvailable' };
  const gained = getPrestigeGain(state);
  let next;
  try {
    next = cloneState(state);
    const s = next.statistics;
    s.totalPrestiges += 1;
    s.bestCycleTotal = Math.max(s.bestCycleTotal, next.resources.cycleTotal);
    if (s.fastestPrestigeSeconds === 0 || s.cyclePlayTime < s.fastestPrestigeSeconds) {
      s.fastestPrestigeSeconds = Math.max(1, Math.round(s.cyclePlayTime));
    }
    s.cyclePlayTime = 0;

    grantInfluence(next, gained);

    next.resources.paperwork = 0;
    next.resources.cycleTotal = 0;
    next.buildings = createEmptyBuildings();
    next.upgrades = [];
    next.missions = { claimed: [] };
    next.temp = createCycleTemp();

    // Papeleo inicial de talentos/logros (se calcula sobre el estado nuevo).
    invalidateModifiers();
    const start = finiteOr(getModifiers(next, { includeTemp: false }).startingPaperwork, 0);
    next.resources.paperwork = Math.max(0, start);

    validateNumbers(next);
  } catch (err) {
    invalidateModifiers();
    return { ok: false, reason: 'error', error: err };
  }

  // Volcado atómico (sin operaciones que puedan lanzar excepciones).
  for (const key of Object.keys(next)) state[key] = next[key];
  invalidateModifiers();
  emit('prestige', { gained, now });
  emit('structureChanged', {});
  return { ok: true, gained };
}

function validateNumbers(state) {
  const check = (obj, path) => {
    for (const [k, v] of Object.entries(obj)) {
      if (typeof v === 'number' && (!Number.isFinite(v) || v < 0)) throw new Error(`Valor inválido en ${path}.${k}`);
    }
  };
  check(state.resources, 'resources');
  check(state.buildings, 'buildings');
}
