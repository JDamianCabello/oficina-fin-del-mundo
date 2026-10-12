// Estado central de la partida. Es un objeto plano y serializable: no contiene
// referencias al DOM ni valores derivados (la producción, los multiplicadores o
// los costes se calculan a partir de él en js/core/economy.js).

import { BUILDING_IDS } from '../config/buildings.data.js';
import { EVENT_TIMING, GOLDEN_TIMING } from '../config/randomEvents.data.js';

export const SAVE_VERSION = 3;

export function createDefaultSettings() {
  return {
    particles: true,
    reducedMotion: false,
    sound: true,
    eventFrequency: 'normal', // 'normal' | 'low' | 'off'
    notation: 'short', // 'short' | 'scientific'
    buyAmount: 1, // 1 | 10 | 'max'
  };
}

export function createEmptyBuildings() {
  return Object.fromEntries(BUILDING_IDS.map((id) => [id, 0]));
}

/** Estado temporal del ciclo (se reinicia al ascender). */
export function createCycleTemp() {
  return {
    effects: [], // [{ id, label, remaining, duration, effects: [...] }]
    nextEventIn: EVENT_TIMING.firstDelay,
    nextGoldenIn: GOLDEN_TIMING.minInterval,
    secondsSinceClick: 0,
    activeEvent: null, // { id, remaining }
    golden: null, // { remaining, x, y }
  };
}

export function createInitialState(now = Date.now()) {
  return {
    version: SAVE_VERSION,
    resources: {
      paperwork: 0, // disponible para gastar
      cycleTotal: 0, // producido en el ciclo actual (base del prestigio)
      lifetimePaperwork: 0, // producido en toda la partida
      influence: 0, // Influencia disponible
      totalInfluenceEarned: 0, // Influencia ganada en total (da el bonus de prestigio)
      shares: 0, // Acciones disponibles (segunda capa)
      totalSharesEarned: 0, // Acciones ganadas en total (dan bonus permanente)
    },
    buildings: createEmptyBuildings(),
    upgrades: [], // ids comprados en este ciclo
    talents: [], // ids permanentes (se pierden al fusionarse)
    board: [], // ventajas del Consejo (permanentes)
    achievements: {}, // { id: marcaTemporal }
    secrets: [], // ids de secretos descubiertos
    unlockedDepartments: ['basement'],
    missions: { claimed: [] }, // ids reclamados en este ciclo
    temp: createCycleTemp(),
    statistics: {
      totalClicks: 0,
      manualPaperwork: 0,
      totalPrestiges: 0,
      totalMergers: 0,
      playTimeSeconds: 0,
      cyclePlayTime: 0,
      goldenFormsClicked: 0,
      eventsResolved: 0,
      missionsCompleted: 0,
      buildingsBought: 0,
      bestPps: 0,
      offlineSecondsTotal: 0,
      bestCycleTotal: 0,
      fastestPrestigeSeconds: 0,
      startedAt: now,
    },
    flags: {
      endingSeen: false,
    },
    settings: createDefaultSettings(),
    lastSavedAt: 0,
  };
}

/** Copia profunda de un estado (solo datos JSON). */
export function cloneState(state) {
  return structuredClone(state);
}

/** Total de edificios poseídos. */
export function totalBuildings(state) {
  let total = 0;
  for (const id of BUILDING_IDS) total += state.buildings[id] || 0;
  return total;
}
