// Progresión: evaluación de requisitos (compartida por departamentos, mejoras,
// misiones y logros) y desbloqueo de departamentos/mecánicas.

import { BUILDINGS_BY_ID } from '../config/buildings.data.js';
import { UPGRADES_BY_ID } from '../config/upgrades.data.js';
import { TALENTS_BY_ID } from '../config/talents.data.js';
import { ACHIEVEMENTS_BY_ID } from '../config/achievements.data.js';
import { DEPARTMENTS, DEPARTMENTS_BY_ID } from '../config/departments.data.js';
import { totalBuildings } from './state.js';
import { BUILDINGS } from '../config/buildings.data.js';
import { getPps } from './economy.js';
import { formatNumber } from '../utils/format.js';
import { emit } from './events.js';

/** Total de hitos de edificios alcanzados (10/25/50/100 unidades). */
export function countMilestones(state) {
  let total = 0;
  for (const b of BUILDINGS) {
    const count = state.buildings[b.id] || 0;
    for (const m of b.milestones ?? []) if (count >= m.count) total += 1;
  }
  return total;
}

/** Valor actual de la magnitud que mide un requisito. */
export function getRequirementProgress(state, req, ctx = {}) {
  switch (req.type) {
    case 'building': return state.buildings[req.id] || 0;
    case 'buildingsTotal': return totalBuildings(state);
    case 'cycleTotal': return state.resources.cycleTotal;
    case 'lifetime': return state.resources.lifetimePaperwork;
    case 'pps': return ctx.pps ?? getPps(state);
    case 'clicks': return state.statistics.totalClicks;
    case 'upgrade': return state.upgrades.includes(req.id) ? 1 : 0;
    case 'upgradesOwned': return state.upgrades.length;
    case 'upgradeTagCount':
      return state.upgrades.filter((id) => UPGRADES_BY_ID[id]?.tags?.includes(req.tag)).length;
    case 'achievement': return req.id in state.achievements ? 1 : 0;
    case 'department': return state.unlockedDepartments.includes(req.id) ? 1 : 0;
    case 'prestiges': return state.statistics.totalPrestiges;
    case 'mergers': return state.statistics.totalMergers;
    case 'boardPerks': return state.board.length;
    case 'milestones': return countMilestones(state);
    case 'talent': return state.talents.includes(req.id) ? 1 : 0;
    case 'talentsOwned': return state.talents.length;
    case 'talentBranches': return new Set(state.talents.map((id) => TALENTS_BY_ID[id]?.branch).filter(Boolean)).size;
    case 'stat': return state.statistics[req.key] || 0;
    case 'secret': return state.secrets.includes(req.id) ? 1 : 0;
    default: return 0;
  }
}

/** Objetivo numérico de un requisito. */
export function getRequirementTarget(req) {
  if ('count' in req) return req.count;
  if ('value' in req) return req.value;
  return 1;
}

export function checkRequirement(state, req, ctx) {
  return getRequirementProgress(state, req, ctx) >= getRequirementTarget(req);
}

export function checkAll(state, reqs = [], ctx) {
  return reqs.every((r) => checkRequirement(state, r, ctx));
}

/** Texto legible de un requisito (sin progreso). */
export function describeRequirement(req) {
  const n = (v) => formatNumber(v);
  switch (req.type) {
    case 'building': return `Tener ${n(req.count)} × ${BUILDINGS_BY_ID[req.id]?.name ?? req.id}`;
    case 'buildingsTotal': return `Tener ${n(req.value)} edificios en total`;
    case 'cycleTotal': return `Producir ${n(req.value)} de papeleo en este ciclo`;
    case 'lifetime': return `Producir ${n(req.value)} de papeleo en total`;
    case 'pps': return `Alcanzar ${n(req.value)} de papeleo/s`;
    case 'clicks': return `Hacer ${n(req.value)} clics manuales`;
    case 'upgrade': return `Comprar LA MEJORA «${UPGRADES_BY_ID[req.id]?.name ?? req.id}» (pestaña Mejoras)`;
    case 'upgradesOwned': return `Tener ${n(req.value)} mejoras compradas`;
    case 'upgradeTagCount': return `Comprar ${n(req.value)} mejoras de ${req.tag === 'coffee' ? 'café' : req.tag}`;
    case 'achievement': return `Conseguir el logro «${ACHIEVEMENTS_BY_ID[req.id]?.name ?? req.id}»`;
    case 'department': return `Desbloquear ${DEPARTMENTS_BY_ID[req.id]?.name ?? req.id}`;
    case 'prestiges': return req.value === 1 ? 'Ascender al menos una vez (pestaña Prestigio)' : `Ascender ${n(req.value)} veces (pestaña Prestigio)`;
    case 'mergers': return req.value === 1 ? 'Fusionarse al menos una vez (pestaña Prestigio)' : `Fusionarse ${n(req.value)} veces en total (pestaña Prestigio)`;
    case 'boardPerks': return `Tener ${n(req.value)} ventajas del Consejo (pestaña Prestigio)`;
    case 'milestones': return `Alcanzar ${n(req.value)} hitos de edificios`;
    case 'talent': return `Tener el talento «${TALENTS_BY_ID[req.id]?.name ?? req.id}»`;
    case 'talentsOwned': return `Tener ${n(req.value)} talentos`;
    case 'talentBranches': return `Tener talentos en ${n(req.value)} ramas`;
    case 'stat': return `Estadística ${req.key} ≥ ${n(req.value)}`;
    case 'secret': return 'Secreto';
    default: return 'Requisito desconocido';
  }
}

/** Texto con progreso: «Tener 10 × Becario (3/10)». */
export function describeRequirementWithProgress(state, req, ctx) {
  const target = getRequirementTarget(req);
  const binary = ['upgrade', 'achievement', 'department', 'talent', 'secret'].includes(req.type);
  if (binary) return describeRequirement(req);
  const progress = Math.min(getRequirementProgress(state, req, ctx), target);
  return `${describeRequirement(req)} (${formatNumber(progress)}/${formatNumber(target)})`;
}

/** Fracción 0..1 de progreso de un requisito. */
export function requirementRatio(state, req, ctx) {
  const target = getRequirementTarget(req);
  if (target <= 0) return 1;
  return Math.max(0, Math.min(1, getRequirementProgress(state, req, ctx) / target));
}

// ─── Departamentos ────────────────────────────────────────────────────────

export function isDepartmentUnlocked(state, id) {
  return state.unlockedDepartments.includes(id);
}

export function isFeatureUnlocked(state, feature) {
  return DEPARTMENTS.some((d) => d.features.includes(feature) && state.unlockedDepartments.includes(d.id));
}

/** Siguiente departamento bloqueado (objetivo principal visible). */
export function getNextDepartment(state) {
  return DEPARTMENTS.find((d) => !state.unlockedDepartments.includes(d.id)) ?? null;
}

export function getCurrentDepartment(state) {
  let current = DEPARTMENTS[0];
  for (const d of DEPARTMENTS) if (state.unlockedDepartments.includes(d.id)) current = d;
  return current;
}

/**
 * Desbloquea los departamentos cuyos requisitos se cumplan, en orden.
 * Devuelve la lista de ids recién desbloqueados.
 */
export function checkDepartments(state, ctx) {
  const unlocked = [];
  for (const d of DEPARTMENTS) {
    if (state.unlockedDepartments.includes(d.id)) continue;
    // Los niveles se desbloquean en orden: no se puede saltar uno.
    const previous = DEPARTMENTS.filter((x) => x.level < d.level);
    if (!previous.every((p) => state.unlockedDepartments.includes(p.id))) break;
    if (!checkAll(state, d.requirements, ctx)) break;
    state.unlockedDepartments.push(d.id);
    unlocked.push(d.id);
    emit('departmentUnlocked', { id: d.id });
  }
  if (unlocked.length) emit('structureChanged', {});
  return unlocked;
}
