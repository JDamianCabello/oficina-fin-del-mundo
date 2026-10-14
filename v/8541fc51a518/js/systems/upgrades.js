// Mejoras de compra única.

import { UPGRADES, UPGRADES_BY_ID } from '../config/upgrades.data.js';
import { getModifiers, spendPaperwork, canAfford } from '../core/economy.js';
import { checkAll } from '../core/progression.js';
import { emit } from '../core/events.js';

export function getUpgradeCost(state, id) {
  const def = UPGRADES_BY_ID[id];
  if (!def) return Infinity;
  return Math.max(1, Math.floor(def.cost * getModifiers(state).upgradeCostMult));
}

export function isUpgradeOwned(state, id) {
  return state.upgrades.includes(id);
}

/** Una mejora es visible cuando se cumplen sus requisitos. */
export function isUpgradeUnlocked(state, id, ctx) {
  const def = UPGRADES_BY_ID[id];
  return Boolean(def) && checkAll(state, def.requirements, ctx);
}

/** Mejoras visibles y no compradas, ordenadas por coste. */
export function getAvailableUpgrades(state, ctx) {
  return UPGRADES
    .filter((u) => !state.upgrades.includes(u.id) && checkAll(state, u.requirements, ctx))
    .sort((a, b) => a.cost - b.cost);
}

/** Mejoras compradas en este ciclo (definiciones). */
export function getOwnedUpgrades(state) {
  return state.upgrades.map((id) => UPGRADES_BY_ID[id]).filter(Boolean);
}

export function buyUpgrade(state, id, ctx) {
  const def = UPGRADES_BY_ID[id];
  if (!def) return { ok: false, reason: 'unknown' };
  if (state.upgrades.includes(id)) return { ok: false, reason: 'owned' };
  if (!checkAll(state, def.requirements, ctx)) return { ok: false, reason: 'locked' };
  const cost = getUpgradeCost(state, id);
  if (!canAfford(state, cost) || !spendPaperwork(state, cost)) return { ok: false, reason: 'funds', cost };
  state.upgrades.push(id);
  emit('upgradeBought', { id, cost });
  emit('structureChanged', {});
  return { ok: true, cost };
}
