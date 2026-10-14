// Segunda capa de prestigio: Fusión multiversal → Acciones (◆).
//
// Fórmula: Acciones = floor( cbrt(InfluenciaGanadaEnEstaFusión / MERGER_DIVISOR) )
// Se reinicia todo lo de la primera capa, incluida la Influencia y los talentos
// (salvo con la ventaja «Memoria institucional»). Se conservan las Acciones, las
// ventajas del Consejo, los logros, los departamentos y las estadísticas.

import { BOARD_PERKS, BOARD_PERKS_BY_ID, SHARE_GLOBAL_BONUS } from '../config/board.data.js';
import { createCycleTemp, createEmptyBuildings, cloneState } from '../core/state.js';
import { getModifiers, invalidateModifiers, finiteOr } from '../core/economy.js';
import { isFeatureUnlocked } from '../core/progression.js';
import { emit } from '../core/events.js';

export const MERGER_DIVISOR = 20000;

export function getMergerGain(state, totalInfluence = state.resources.totalInfluenceEarned) {
  const raw = Math.cbrt(Math.max(0, totalInfluence) / MERGER_DIVISOR);
  return Math.max(0, Math.floor(finiteOr(raw, 0) + 1e-9));
}

/** Influencia (de esta fusión) necesaria para ganar `n` Acciones. */
export function getInfluenceForShares(n) {
  return Math.pow(n, 3) * MERGER_DIVISOR;
}

export function canMerge(state) {
  return isFeatureUnlocked(state, 'merger') && getMergerGain(state) >= 1;
}

export function hasBoardSpecial(state, special) {
  return state.board.some((id) => BOARD_PERKS_BY_ID[id]?.special === special);
}

export const MERGER_RESETS = [
  'Todo lo que reinicia un ascenso (papeleo, edificios, mejoras, misiones)',
  'Influencia disponible y ganada (y su bonus)',
  'Talentos (salvo con «Memoria institucional»)',
];

export const MERGER_KEEPS = [
  'Acciones y su bonus (+50 % por acción ganada)',
  'Ventajas del Consejo',
  'Logros, departamentos y estadísticas',
];

export function getMergerPreview(state) {
  const gain = getMergerGain(state);
  return {
    gain,
    shares: state.resources.shares,
    totalShares: state.resources.totalSharesEarned,
    after: state.resources.shares + gain,
    bonusNow: SHARE_GLOBAL_BONUS * state.resources.totalSharesEarned,
    bonusAfter: SHARE_GLOBAL_BONUS * (state.resources.totalSharesEarned + gain),
    nextAt: getInfluenceForShares(gain + 1),
    keepTalents: hasBoardSpecial(state, 'keepTalents'),
    canMerge: canMerge(state),
    resets: MERGER_RESETS,
    keeps: MERGER_KEEPS,
  };
}

/** Fusión atómica: se construye sobre una copia y solo se vuelca si todo va bien. */
export function performMerger(state, { confirmed = false } = {}) {
  if (!confirmed) return { ok: false, reason: 'notConfirmed' };
  if (!canMerge(state)) return { ok: false, reason: 'notAvailable' };
  const gained = getMergerGain(state);
  let next;
  try {
    next = cloneState(state);
    const r = next.resources;
    const s = next.statistics;
    s.totalMergers += 1;
    s.bestCycleTotal = Math.max(s.bestCycleTotal, r.cycleTotal);
    s.cyclePlayTime = 0;
    r.shares += gained;
    r.totalSharesEarned += gained;
    r.influence = 0;
    r.totalInfluenceEarned = 0;
    r.paperwork = 0;
    r.cycleTotal = 0;
    next.buildings = createEmptyBuildings();
    next.upgrades = [];
    next.missions = { claimed: [] };
    next.temp = createCycleTemp();
    if (!hasBoardSpecial(next, 'keepTalents')) next.talents = [];
    invalidateModifiers();
    r.paperwork = Math.max(0, finiteOr(getModifiers(next, { includeTemp: false }).startingPaperwork, 0));
    for (const v of Object.values(r)) if (!Number.isFinite(v) || v < 0) throw new Error('Valor inválido tras la fusión');
  } catch (err) {
    invalidateModifiers();
    return { ok: false, reason: 'error', error: err };
  }
  for (const key of Object.keys(next)) state[key] = next[key];
  invalidateModifiers();
  emit('merger', { gained });
  emit('structureChanged', {});
  return { ok: true, gained };
}

// ─── Ventajas del Consejo ─────────────────────────────────────────────────

/** 'owned' | 'locked' | 'unaffordable' | 'available' */
export function getBoardPerkStatus(state, id) {
  const perk = BOARD_PERKS_BY_ID[id];
  if (!perk) return 'locked';
  if (state.board.includes(id)) return 'owned';
  if (!isFeatureUnlocked(state, 'merger')) return 'locked';
  if (!perk.requires.every((r) => state.board.includes(r))) return 'locked';
  if (state.resources.shares < perk.cost) return 'unaffordable';
  return 'available';
}

export function getBoardPerkBlockReason(state, id) {
  const perk = BOARD_PERKS_BY_ID[id];
  switch (getBoardPerkStatus(state, id)) {
    case 'owned': return 'Ya forma parte del Consejo.';
    case 'locked':
      if (!isFeatureUnlocked(state, 'merger')) return 'Desbloquea el Consejo de Administración (nivel 6).';
      return `Requiere ${perk.requires.filter((r) => !state.board.includes(r)).map((r) => `«${BOARD_PERKS_BY_ID[r].name}»`).join(' y ')}.`;
    case 'unaffordable': return `Necesitas ${perk.cost} ◆ (tienes ${Math.floor(state.resources.shares)}).`;
    default: return '';
  }
}

export function buyBoardPerk(state, id) {
  const status = getBoardPerkStatus(state, id);
  if (status !== 'available') return { ok: false, reason: status };
  state.resources.shares -= BOARD_PERKS_BY_ID[id].cost;
  state.board.push(id);
  emit('boardPerkBought', { id });
  emit('structureChanged', {});
  return { ok: true };
}

export function availableBoardPerks(state) {
  return BOARD_PERKS.filter((p) => getBoardPerkStatus(state, p.id) === 'available').length;
}
