// Segunda capa de prestigio: la «Fusión multiversal».
//
// Al fusionarse, la empresa lo pierde TODO lo de la primera capa (papeleo,
// edificios, mejoras, Influencia y talentos) a cambio de ACCIONES (◆).
// Cada acción ganada da un bonus permanente de producción y se puede invertir
// en ventajas del Consejo de Administración, que sobreviven a todo.
//
// Formato de una ventaja: id, name, description, cost (Acciones), requires
// (ids de otras ventajas), effects (formato de js/core/economy.js) y, de forma
// opcional, `special` para reglas que no son multiplicadores:
//   'keepTalents'  Los talentos se conservan al fusionarse.

export const BOARD_PERKS = [
  {
    id: 'boardSeedCapital', name: 'Capital semilla', cost: 1, requires: [],
    description: 'Cada ciclo empieza con 10 M de papeleo. Nadie pregunta de dónde sale.',
    effects: [{ type: 'startingPaperwork', value: 1e7 }],
  },
  {
    id: 'boardGoldenParachute', name: 'Paracaídas dorado', cost: 2, requires: [],
    description: 'Influencia obtenida al ascender ×2. Caer nunca fue tan rentable.',
    effects: [{ type: 'influenceMult', value: 2 }],
  },
  {
    id: 'boardLobby', name: 'Lobby interdimensional', cost: 3, requires: ['boardSeedCapital'],
    description: 'Los edificios cuestan un 25 % menos gracias a ciertas «conversaciones».',
    effects: [{ type: 'buildingCostMult', value: 0.75 }],
  },
  {
    id: 'boardLuck', name: 'Departamento de la Buena Suerte', cost: 3, requires: [],
    description: 'Recompensas de eventos y formularios dorados ×3 y formularios dorados un 40 % más frecuentes.',
    effects: [{ type: 'eventRewardMult', value: 3 }, { type: 'goldenFrequencyMult', value: 0.6 }],
  },
  {
    id: 'boardAutomation', name: 'Comité de Automatización', cost: 5, requires: ['boardSeedCapital'],
    description: '+20 clics automáticos por segundo y cada clic suma un 5 % de la producción.',
    effects: [{ type: 'autoClick', value: 20 }, { type: 'clickPps', value: 0.05 }],
  },
  {
    id: 'boardRemote', name: 'Teletrabajo eterno', cost: 4, requires: [],
    description: '+16 h de límite offline y +40 % de eficiencia offline.',
    effects: [{ type: 'offlineHours', value: 16 }, { type: 'offlineEfficiency', value: 0.4 }],
  },
  {
    id: 'boardMemory', name: 'Memoria institucional', cost: 8, requires: ['boardGoldenParachute'],
    description: 'Los talentos comprados se conservan en las fusiones (la Influencia no).',
    effects: [], special: 'keepTalents',
  },
  {
    id: 'boardSynergy', name: 'Fusión de todos los departamentos', cost: 13, requires: ['boardLobby', 'boardAutomation'],
    description: 'Todos los departamentos son uno solo. Producción total ×3.',
    effects: [{ type: 'globalMult', value: 3 }],
  },
];

export const BOARD_PERK_IDS = BOARD_PERKS.map((p) => p.id);

export const BOARD_PERKS_BY_ID = Object.fromEntries(BOARD_PERKS.map((p) => [p.id, p]));

/** Bonus permanente de producción por cada Acción ganada en total. */
export const SHARE_GLOBAL_BONUS = 0.5;
