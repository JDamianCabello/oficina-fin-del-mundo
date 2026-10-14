// Árbol de talentos (permanente, se paga con Influencia).

import { TALENTS, TALENTS_BY_ID, RESPEC_MAX_CYCLE_TOTAL } from '../config/talents.data.js';
import { isFeatureUnlocked } from '../core/progression.js';
import { emit } from '../core/events.js';

/**
 * Estado de un nodo:
 *   'owned'        comprado
 *   'excluded'     bloqueado por un talento excluyente ya comprado
 *   'locked'       faltan talentos previos o el árbol no está desbloqueado
 *   'unaffordable' disponible pero sin Influencia suficiente
 *   'available'    se puede comprar
 */
export function getTalentStatus(state, id) {
  const t = TALENTS_BY_ID[id];
  if (!t) return 'locked';
  if (state.talents.includes(id)) return 'owned';
  if (t.excludes.some((x) => state.talents.includes(x))) return 'excluded';
  if (!isFeatureUnlocked(state, 'talents')) return 'locked';
  if (!t.requires.every((r) => state.talents.includes(r))) return 'locked';
  if (t.requiresAny?.length && !t.requiresAny.some((r) => state.talents.includes(r))) return 'locked';
  if (state.resources.influence < t.cost) return 'unaffordable';
  return 'available';
}

/** Motivo legible de por qué no se puede comprar. */
export function getTalentBlockReason(state, id) {
  const t = TALENTS_BY_ID[id];
  const status = getTalentStatus(state, id);
  switch (status) {
    case 'owned': return 'Ya lo tienes.';
    case 'excluded': {
      const other = t.excludes.find((x) => state.talents.includes(x));
      return `Incompatible con «${TALENTS_BY_ID[other]?.name}».`;
    }
    case 'locked': {
      if (!isFeatureUnlocked(state, 'talents')) return 'Desbloquea Recursos Humanos del Infierno para usar el árbol.';
      const missing = t.requires.filter((r) => !state.talents.includes(r)).map((r) => `«${TALENTS_BY_ID[r]?.name}»`);
      if (missing.length) return `Requiere ${missing.join(' y ')}.`;
      return `Requiere ${t.requiresAny.map((r) => `«${TALENTS_BY_ID[r]?.name}»`).join(' o ')}.`;
    }
    case 'unaffordable': return `Necesitas ${t.cost} de Influencia (tienes ${Math.floor(state.resources.influence)}).`;
    default: return '';
  }
}

export function buyTalent(state, id) {
  const status = getTalentStatus(state, id);
  if (status !== 'available') return { ok: false, reason: status };
  const t = TALENTS_BY_ID[id];
  state.resources.influence -= t.cost;
  state.talents.push(id);
  emit('talentBought', { id });
  emit('structureChanged', {});
  return { ok: true };
}

export function getSpentInfluence(state) {
  return state.talents.reduce((sum, id) => sum + (TALENTS_BY_ID[id]?.cost ?? 0), 0);
}

/** La reasignación es gratuita pero solo al principio de un ciclo. */
export function canRespec(state) {
  return state.talents.length > 0 && state.resources.cycleTotal < RESPEC_MAX_CYCLE_TOTAL;
}

export function respecTalents(state) {
  if (!canRespec(state)) return { ok: false, reason: 'notAllowed' };
  const refund = getSpentInfluence(state);
  state.resources.influence += refund;
  state.talents = [];
  emit('structureChanged', {});
  return { ok: true, refund };
}

export function getTalentsByBranch(branchId) {
  return TALENTS.filter((t) => t.branch === branchId);
}
