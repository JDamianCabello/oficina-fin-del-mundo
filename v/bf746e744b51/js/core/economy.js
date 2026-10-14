// Economía central: TODAS las reglas de producción, costes y modificación de
// recursos viven aquí. La interfaz solo llama a estas funciones.
//
// ─── Formato de efectos ───────────────────────────────────────────────────
// Mejoras, talentos, logros, efectos temporales y eventos describen su efecto
// con objetos { type, ... } que se agregan en getModifiers():
//
//   globalMult        × producción total (edificios y la parte base del clic)
//   buildingMult      × producción de `target` (id de edificio o 'ALL')
//   synergy           `target` gana +value (fracción) por cada unidad de `source`
//                     (`source` = id de edificio o 'ALL' = el resto de edificios)
//   clickFlat         + papeleo base por clic
//   clickMult         × valor base del clic
//   clickPps          + fracción de la producción/s que se suma a cada clic
//   autoClick         + clics automáticos por segundo
//   critChance        + probabilidad de clic crítico (×CRIT_MULT)
//   buildingCostMult  × coste de los edificios
//   upgradeCostMult   × coste de las mejoras
//   offlineHours      + horas máximas de producción offline
//   offlineEfficiency + eficiencia offline (fracción)
//   influenceMult     × Influencia obtenida al ascender
//   influencePower    + bonus de producción por punto de Influencia ganado
//   tempDurationMult  × duración de las bonificaciones temporales positivas
//   eventRewardMult   × recompensas inmediatas de eventos y formularios dorados
//   goldenFrequencyMult × intervalo entre formularios dorados (<1 = más frecuentes)
//   missionRewardMult × recompensas de misiones
//   startingPaperwork + papeleo inicial tras ascender
//   globalPerBuildingTypeAbove  +value de producción total por cada tipo de
//                     edificio con al menos `threshold` unidades
//   idleGlobalMult    × producción si llevas IDLE_SECONDS sin clic manual
//
// ─── Fórmula de producción ────────────────────────────────────────────────
//   prodEdificio(b) = base(b) × cantidad(b) × multEdificio(b) × multTodos
//                     × (1 + Σ sinergias(b))
//   multGlobal      = Π globalMult × (1 + Σ (bonusTemporal − 1)) × (1 + 0,01 × logros)
//                     × multPrestigio(influenciaTotalGanada)  (ver getPrestigeMultiplier)
//                     × (1 + 0,5 × accionesTotalesGanadas)     (segunda capa)
//                     × (1 + Σ globalPerBuildingTypeAbove)
//                     × (idleGlobalMult si procede)
//   pps             = Σ prodEdificio(b) × multGlobal
//   clic            = (1 + clickFlat) × Π clickMult × multGlobal + pps × Σ clickPps
//
// Fuentes de efectos: mejoras, talentos, ventajas del Consejo, logros, efectos
// temporales, ventajas permanentes de los niveles desbloqueados y HITOS de los
// edificios (10/25/50/100 unidades, ver buildings.data.js).
// Cada fuente se recorre UNA vez por cálculo a partir del estado (ids y
// cantidades), así que recargar la partida no puede duplicar bonificaciones.

import { BUILDINGS, BUILDING_IDS, BUILDINGS_BY_ID } from '../config/buildings.data.js';
import { UPGRADES_BY_ID } from '../config/upgrades.data.js';
import { TALENTS_BY_ID } from '../config/talents.data.js';
import { ACHIEVEMENTS_BY_ID, ACHIEVEMENT_GLOBAL_BONUS } from '../config/achievements.data.js';
import { BOARD_PERKS_BY_ID, SHARE_GLOBAL_BONUS } from '../config/board.data.js';
import { DEPARTMENTS_BY_ID } from '../config/departments.data.js';
import { totalBuildings } from './state.js';

export const CRIT_MULT = 10;
export const BASE_OFFLINE_HOURS = 8;
export const BASE_OFFLINE_EFFICIENCY = 0.5;
export const MIN_OFFLINE_EFFICIENCY = 0.05;
export const BASE_INFLUENCE_POWER = 0.02;
export const IDLE_SECONDS = 30;
export const MAX_SAFE_AMOUNT = Number.MAX_VALUE;

/** Devuelve `n` si es un número finito; si no, `fallback`. */
export function finiteOr(n, fallback = 0) {
  return typeof n === 'number' && Number.isFinite(n) ? n : fallback;
}

/** Tipos de efecto válidos (se usan también para validar partidas importadas). */
export const EFFECT_TYPES = [
  'globalMult', 'buildingMult', 'synergy', 'clickFlat', 'clickMult', 'clickPps', 'autoClick',
  'critChance', 'buildingCostMult', 'upgradeCostMult', 'offlineHours', 'offlineEfficiency',
  'influenceMult', 'influencePower', 'tempDurationMult', 'eventRewardMult', 'goldenFrequencyMult',
  'missionRewardMult', 'startingPaperwork', 'globalPerBuildingTypeAbove', 'idleGlobalMult',
];

function createEmptyModifiers() {
  return {
    global: 1,
    allBuildings: 1,
    building: Object.fromEntries(BUILDING_IDS.map((id) => [id, 1])),
    synergies: [],
    clickFlat: 0,
    clickMult: 1,
    clickPps: 0,
    autoClick: 0,
    critChance: 0,
    buildingCostMult: 1,
    upgradeCostMult: 1,
    offlineHours: BASE_OFFLINE_HOURS,
    offlineEfficiency: BASE_OFFLINE_EFFICIENCY,
    influenceMult: 1,
    influencePower: BASE_INFLUENCE_POWER,
    tempDurationMult: 1,
    eventRewardMult: 1,
    goldenFrequencyMult: 1,
    missionRewardMult: 1,
    startingPaperwork: 0,
    perBuildingType: [], // [{ threshold, value }]
    idleGlobalMult: 1,
    achievementCount: 0,
  };
}

/** Aplica un efecto al acumulador de modificadores. Exportada para pruebas. */
export function applyEffect(mods, effect) {
  const v = finiteOr(effect.value, 0);
  switch (effect.type) {
    case 'globalMult': mods.global *= v; break;
    case 'buildingMult':
      if (effect.target === 'ALL') mods.allBuildings *= v;
      else if (effect.target in mods.building) mods.building[effect.target] *= v;
      break;
    case 'synergy': mods.synergies.push({ target: effect.target, source: effect.source, value: v }); break;
    case 'clickFlat': mods.clickFlat += v; break;
    case 'clickMult': mods.clickMult *= v; break;
    case 'clickPps': mods.clickPps += v; break;
    case 'autoClick': mods.autoClick += v; break;
    case 'critChance': mods.critChance += v; break;
    case 'buildingCostMult': mods.buildingCostMult *= v; break;
    case 'upgradeCostMult': mods.upgradeCostMult *= v; break;
    case 'offlineHours': mods.offlineHours += v; break;
    case 'offlineEfficiency': mods.offlineEfficiency += v; break;
    case 'influenceMult': mods.influenceMult *= v; break;
    case 'influencePower': mods.influencePower += v; break;
    case 'tempDurationMult': mods.tempDurationMult *= v; break;
    case 'eventRewardMult': mods.eventRewardMult *= v; break;
    case 'goldenFrequencyMult': mods.goldenFrequencyMult *= v; break;
    case 'missionRewardMult': mods.missionRewardMult *= v; break;
    case 'startingPaperwork': mods.startingPaperwork += v; break;
    case 'globalPerBuildingTypeAbove': mods.perBuildingType.push({ threshold: finiteOr(effect.threshold, Infinity), value: v }); break;
    case 'idleGlobalMult': mods.idleGlobalMult *= v; break;
    default:
      // Tipo desconocido: se ignora para no romper partidas con datos antiguos.
      break;
  }
}

/** Hitos alcanzados por un edificio (según su cantidad actual). */
export function getReachedMilestones(state, id) {
  const def = BUILDINGS_BY_ID[id];
  const count = state.buildings[id] || 0;
  return def?.milestones?.filter((m) => count >= m.count) ?? [];
}

/** Siguiente hito de un edificio (o null si los tiene todos). */
export function getNextMilestone(state, id) {
  const def = BUILDINGS_BY_ID[id];
  const count = state.buildings[id] || 0;
  return def?.milestones?.find((m) => count < m.count) ?? null;
}

/** Firma compacta de los hitos alcanzados (para la caché de modificadores). */
function milestoneSignature(state) {
  let sig = '';
  for (const b of BUILDINGS) {
    const count = state.buildings[b.id] || 0;
    let reached = 0;
    for (const m of b.milestones ?? []) if (count >= m.count) reached += 1;
    sig += reached;
  }
  return sig;
}

function modifiersKey(state, includeTemp) {
  const temp = includeTemp ? state.temp.effects.map((e) => e.id).join(',') : '-';
  return [
    state.upgrades.join(','),
    state.talents.join(','),
    state.board.join(','),
    state.unlockedDepartments.length,
    milestoneSignature(state),
    state.resources.totalSharesEarned,
    Object.keys(state.achievements).length,
    state.resources.totalInfluenceEarned,
    temp,
  ].join('|');
}

const cache = { state: null, key: '', includeTemp: true, mods: null };

/**
 * Agrega todos los modificadores activos. El resultado se cachea por estado y
 * por una clave derivada de los ids comprados, así que es barato llamarla en
 * cada tick y nunca acumula efectos dos veces.
 */
export function getModifiers(state, { includeTemp = true } = {}) {
  const key = modifiersKey(state, includeTemp);
  if (cache.state === state && cache.key === key && cache.includeTemp === includeTemp) return cache.mods;

  const mods = createEmptyModifiers();
  for (const id of state.upgrades) {
    const up = UPGRADES_BY_ID[id];
    if (up) up.effects.forEach((e) => applyEffect(mods, e));
  }
  for (const id of state.talents) {
    const t = TALENTS_BY_ID[id];
    if (t) t.effects.forEach((e) => applyEffect(mods, e));
  }
  // Ventajas permanentes de los niveles desbloqueados.
  for (const id of state.unlockedDepartments) {
    DEPARTMENTS_BY_ID[id]?.effects?.forEach((e) => applyEffect(mods, e));
  }
  // Hitos por cantidad de cada edificio.
  for (const b of BUILDINGS) {
    const count = state.buildings[b.id] || 0;
    for (const m of b.milestones ?? []) if (count >= m.count) m.effects.forEach((e) => applyEffect(mods, e));
  }
  for (const id of state.board) {
    const perk = BOARD_PERKS_BY_ID[id];
    if (perk) perk.effects.forEach((e) => applyEffect(mods, e));
  }
  for (const id of Object.keys(state.achievements)) {
    const a = ACHIEVEMENTS_BY_ID[id];
    if (!a) continue;
    mods.achievementCount += 1;
    a.reward?.effects?.forEach((e) => applyEffect(mods, e));
  }
  if (includeTemp) {
    // Las bonificaciones temporales de producción y de clic se SUMAN entre sí
    // (×3 y ×7 a la vez = ×9, no ×21) para que coincidir varias no dispare la
    // economía. Las penalizaciones (<1) y los efectos de otro tipo se aplican
    // normalmente.
    let tempGlobal = 0;
    let tempClick = 0;
    for (const t of state.temp.effects) {
      for (const e of t.effects) {
        if (e.type === 'globalMult' && e.value > 1) tempGlobal += e.value - 1;
        else if (e.type === 'clickMult' && e.value > 1) tempClick += e.value - 1;
        else applyEffect(mods, e);
      }
    }
    mods.global *= 1 + tempGlobal;
    mods.clickMult *= 1 + tempClick;
  }
  mods.offlineEfficiency = Math.max(MIN_OFFLINE_EFFICIENCY, mods.offlineEfficiency);
  mods.critChance = Math.min(1, Math.max(0, mods.critChance));

  cache.state = state;
  cache.key = key;
  cache.includeTemp = includeTemp;
  cache.mods = mods;
  return mods;
}

/** Fuerza el recálculo de modificadores (p. ej. tras sustituir el estado). */
export function invalidateModifiers() {
  cache.state = null;
}

/** Puntos de Influencia a partir de los cuales el bonus crece con raíz cuadrada. */
export const INFLUENCE_SOFTCAP = 100;

/**
 * Multiplicador permanente por Influencia ganada (I):
 *   I ≤ 100 → 1 + poder × I                    (+2 % por punto)
 *   I > 100 → (1 + poder × 100) × sqrt(I / 100) (rendimientos decrecientes)
 * El tramo decreciente evita que ascensos muy seguidos se realimenten sin fin
 * (ver PLAN.md, sección Balance).
 */
export function getPrestigeMultiplier(state, mods = getModifiers(state)) {
  const earned = Math.max(0, state.resources.totalInfluenceEarned);
  if (earned <= INFLUENCE_SOFTCAP) return 1 + mods.influencePower * earned;
  return (1 + mods.influencePower * INFLUENCE_SOFTCAP) * Math.sqrt(earned / INFLUENCE_SOFTCAP);
}

/** Multiplicador permanente por Acciones ganadas (segunda capa): +50 % por acción. */
export function getSharesMultiplier(state) {
  return 1 + SHARE_GLOBAL_BONUS * Math.max(0, state.resources.totalSharesEarned);
}

export function isIdleBonusActive(state, mods = getModifiers(state)) {
  return mods.idleGlobalMult !== 1 && state.temp.secondsSinceClick >= IDLE_SECONDS;
}

/** Multiplicador global completo (ver fórmula arriba). */
export function getGlobalMultiplier(state, mods = getModifiers(state), { forceIdle = false } = {}) {
  let mult = mods.global;
  mult *= 1 + ACHIEVEMENT_GLOBAL_BONUS * mods.achievementCount;
  mult *= getPrestigeMultiplier(state, mods);
  mult *= getSharesMultiplier(state);
  if (mods.perBuildingType.length) {
    let bonus = 0;
    for (const { threshold, value } of mods.perBuildingType) {
      for (const id of BUILDING_IDS) if ((state.buildings[id] || 0) >= threshold) bonus += value;
    }
    mult *= 1 + bonus;
  }
  if (mods.idleGlobalMult !== 1 && (forceIdle || state.temp.secondsSinceClick >= IDLE_SECONDS)) {
    mult *= mods.idleGlobalMult;
  }
  return mult;
}

/** Multiplicador propio de un edificio (sin el global). */
export function getBuildingMultiplier(state, id, mods = getModifiers(state)) {
  const mult = (mods.building[id] ?? 1) * mods.allBuildings;
  let synergy = 0;
  for (const s of mods.synergies) {
    if (s.target !== id) continue;
    const count = s.source === 'ALL' ? totalBuildings(state) - (state.buildings[id] || 0) : state.buildings[s.source] || 0;
    synergy += s.value * count;
  }
  return mult * (1 + synergy);
}

/** Producción/s de TODAS las unidades de un edificio, sin el multiplicador global. */
export function getBuildingRawProduction(state, id, mods = getModifiers(state)) {
  const def = BUILDINGS_BY_ID[id];
  const count = state.buildings[id] || 0;
  if (!def || count <= 0) return 0;
  return def.baseProduction * count * getBuildingMultiplier(state, id, mods);
}

/** Producción/s de un edificio incluyendo el multiplicador global. */
export function getBuildingProduction(state, id, mods = getModifiers(state)) {
  return finiteOr(getBuildingRawProduction(state, id, mods) * getGlobalMultiplier(state, mods));
}

/** Producción por unidad (útil para mostrar en las tarjetas). */
export function getBuildingUnitProduction(state, id, mods = getModifiers(state)) {
  const def = BUILDINGS_BY_ID[id];
  if (!def) return 0;
  return finiteOr(def.baseProduction * getBuildingMultiplier(state, id, mods) * getGlobalMultiplier(state, mods));
}

/** Producción total por segundo de los edificios. */
export function getPps(state, { includeTemp = true, forceIdle = false } = {}) {
  const mods = getModifiers(state, { includeTemp });
  let raw = 0;
  for (const b of BUILDINGS) raw += getBuildingRawProduction(state, b.id, mods);
  return finiteOr(raw * getGlobalMultiplier(state, mods, { forceIdle }), 0);
}

/** Valor de un clic normal (sin crítico). */
export function getClickValue(state, { includeTemp = true } = {}) {
  const mods = getModifiers(state, { includeTemp });
  const base = (1 + mods.clickFlat) * mods.clickMult * getGlobalMultiplier(state, mods);
  return finiteOr(base + getPps(state, { includeTemp }) * mods.clickPps, 0);
}

/** Valor medio de un clic contando críticos (para los clics automáticos). */
export function getExpectedClickValue(state, opts) {
  const mods = getModifiers(state, opts);
  return getClickValue(state, opts) * (1 + mods.critChance * (CRIT_MULT - 1));
}

/** Clics automáticos por segundo. */
export function getAutoClickRate(state) {
  return Math.max(0, getModifiers(state).autoClick);
}

// ─── Recursos ─────────────────────────────────────────────────────────────

/**
 * Único punto por el que entra papeleo en la partida.
 * source: 'production' | 'click' | 'reward' | 'offline'
 */
export function addPaperwork(state, amount, source = 'production') {
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) return 0;
  const r = state.resources;
  r.paperwork = Math.min(MAX_SAFE_AMOUNT, r.paperwork + amount);
  r.cycleTotal = Math.min(MAX_SAFE_AMOUNT, r.cycleTotal + amount);
  r.lifetimePaperwork = Math.min(MAX_SAFE_AMOUNT, r.lifetimePaperwork + amount);
  if (source === 'click') {
    state.statistics.manualPaperwork = Math.min(MAX_SAFE_AMOUNT, state.statistics.manualPaperwork + amount);
  }
  return amount;
}

/** Único punto por el que sale papeleo. Devuelve false si no alcanza. */
export function spendPaperwork(state, amount) {
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount < 0) return false;
  if (amount > state.resources.paperwork) return false;
  state.resources.paperwork = Math.max(0, state.resources.paperwork - amount);
  return true;
}

export function canAfford(state, amount) {
  return Number.isFinite(amount) && amount >= 0 && state.resources.paperwork >= amount;
}

// ─── Clics ────────────────────────────────────────────────────────────────

/** Clic manual del jugador. `rng` se inyecta en las pruebas. */
export function performClick(state, rng = Math.random) {
  const mods = getModifiers(state);
  const crit = mods.critChance > 0 && rng() < mods.critChance;
  const amount = getClickValue(state) * (crit ? CRIT_MULT : 1);
  addPaperwork(state, amount, 'click');
  state.statistics.totalClicks += 1;
  state.temp.secondsSinceClick = 0;
  return { amount, crit };
}

// ─── Costes de edificios ──────────────────────────────────────────────────

/** Coste de la unidad número `index` (0 = primera) de un edificio. */
export function getUnitCost(state, id, index, mods = getModifiers(state)) {
  const def = BUILDINGS_BY_ID[id];
  if (!def) return Infinity;
  const cost = Math.floor(def.baseCost * mods.buildingCostMult * Math.pow(def.costGrowth, index));
  return Math.max(1, finiteOr(cost, Infinity));
}

/** Coste total de comprar `amount` unidades a partir de las que ya se poseen. */
export function getBulkCost(state, id, amount) {
  const mods = getModifiers(state);
  const owned = state.buildings[id] || 0;
  let total = 0;
  for (let i = 0; i < amount; i++) total += getUnitCost(state, id, owned + i, mods);
  return total;
}

/** Máximo de unidades comprables con el papeleo actual y su coste total. */
export function getMaxAffordable(state, id, limit = 10000) {
  const mods = getModifiers(state);
  const owned = state.buildings[id] || 0;
  let budget = state.resources.paperwork;
  let count = 0;
  let cost = 0;
  while (count < limit) {
    const next = getUnitCost(state, id, owned + count, mods);
    if (next > budget) break;
    budget -= next;
    cost += next;
    count += 1;
  }
  return { count, cost };
}

/**
 * Resuelve una petición de compra (1, 10 o 'max') en cantidad y coste.
 * Para 'max' con 0 asequibles devuelve el coste de 1 para poder mostrarlo.
 */
export function quoteBuilding(state, id, amount) {
  if (amount === 'max') {
    const { count, cost } = getMaxAffordable(state, id);
    if (count === 0) return { count: 0, cost: getBulkCost(state, id, 1), affordable: false };
    return { count, cost, affordable: true };
  }
  const n = Math.max(1, Math.floor(finiteOr(amount, 1)));
  const cost = getBulkCost(state, id, n);
  return { count: n, cost, affordable: canAfford(state, cost) };
}

// ─── Simulación ───────────────────────────────────────────────────────────

/** Produce papeleo durante `dt` segundos (edificios + clics automáticos). */
export function produce(state, dt) {
  if (!(dt > 0)) return 0;
  const fromBuildings = getPps(state) * dt;
  const autoRate = getAutoClickRate(state);
  const fromAuto = autoRate > 0 ? getExpectedClickValue(state) * autoRate * dt : 0;
  addPaperwork(state, fromBuildings, 'production');
  addPaperwork(state, fromAuto, 'click');
  return fromBuildings + fromAuto;
}

/** Producción total por segundo incluyendo clics automáticos (para mostrar). */
export function getTotalRate(state) {
  return getPps(state) + getExpectedClickValue(state) * getAutoClickRate(state);
}
