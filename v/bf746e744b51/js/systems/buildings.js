// Compra y visibilidad de edificios. Las fórmulas de coste están en economy.js.

import { BUILDINGS, BUILDINGS_BY_ID } from '../config/buildings.data.js';
import { quoteBuilding, spendPaperwork } from '../core/economy.js';
import { isDepartmentUnlocked } from '../core/progression.js';
import { emit } from '../core/events.js';

export function isBuildingUnlocked(state, id) {
  const def = BUILDINGS_BY_ID[id];
  return Boolean(def) && isDepartmentUnlocked(state, def.department);
}

export function getUnlockedBuildings(state) {
  return BUILDINGS.filter((b) => isDepartmentUnlocked(state, b.department));
}

/** Primer edificio todavía bloqueado (se muestra como «próximamente»). */
export function getNextLockedBuilding(state) {
  return BUILDINGS.find((b) => !isDepartmentUnlocked(state, b.department)) ?? null;
}

/**
 * Compra `amount` (1, 10 o 'max') unidades. Nunca deja saldo negativo:
 * si no alcanza para la cantidad pedida no compra nada.
 */
export function buyBuilding(state, id, amount = 1) {
  if (!isBuildingUnlocked(state, id)) return { ok: false, reason: 'locked' };
  const quote = quoteBuilding(state, id, amount);
  if (!quote.affordable || quote.count <= 0) return { ok: false, reason: 'funds', ...quote };
  if (!spendPaperwork(state, quote.cost)) return { ok: false, reason: 'funds', ...quote };
  state.buildings[id] = (state.buildings[id] || 0) + quote.count;
  state.statistics.buildingsBought += quote.count;
  emit('buildingBought', { id, amount: quote.count, cost: quote.cost });
  return { ok: true, count: quote.count, cost: quote.cost };
}
