import { createInitialState } from '../../js/core/state.js';
import { invalidateModifiers } from '../../js/core/economy.js';
import { DEPARTMENT_IDS } from '../../js/config/departments.data.js';

/** Estado nuevo con opciones rápidas para las pruebas. */
export function makeState({ paperwork = 0, buildings = {}, departments = null, upgrades = [], talents = [], influence = 0 } = {}) {
  invalidateModifiers();
  const s = createInitialState(1_000_000);
  s.resources.paperwork = paperwork;
  Object.assign(s.buildings, buildings);
  if (departments === 'all') s.unlockedDepartments = [...DEPARTMENT_IDS];
  else if (departments) s.unlockedDepartments = ['basement', ...departments];
  s.upgrades = [...upgrades];
  s.talents = [...talents];
  s.resources.influence = influence;
  return s;
}

/** Generador pseudoaleatorio determinista. */
export function seededRng(seed = 42) {
  let x = seed >>> 0;
  return () => {
    x = (x * 1664525 + 1013904223) >>> 0;
    return x / 4294967296;
  };
}

export const approx = (a, b, eps = 1e-9) => Math.abs(a - b) <= eps * Math.max(1, Math.abs(a), Math.abs(b));
