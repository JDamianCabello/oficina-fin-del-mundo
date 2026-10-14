// Árbol de talentos (permanentes; se pagan con Influencia y sobreviven al prestigio).
//
// Campos: id, branch, name, description, cost (Influencia), requires (todos),
// requiresAny (al menos uno), excludes (no se puede tener a la vez),
// effects (formato de js/core/economy.js), pos { row, col } para dibujar el árbol
// (col: 0 = izquierda, 1 = centro, 2 = derecha dentro de la rama).

export const TALENT_BRANCHES = [
  { id: 'lazy', name: 'El vago profesional', description: 'Clics y automatización: que trabaje el ratón.', icon: '☝' },
  { id: 'exploiter', name: 'El explotador', description: 'Edificios más baratos y más productivos.', icon: '⚙' },
  { id: 'scientist', name: 'El científico', description: 'Glitches, bonificaciones temporales y offline.', icon: '⚗' },
  { id: 'villain', name: 'El villano', description: 'Riesgo y recompensa. Grandes multiplicadores con letra pequeña.', icon: '☠' },
];

export const TALENTS = [
  // ── El vago profesional ────────────────────────────────────────────
  {
    id: 'lazyIronFinger', branch: 'lazy', name: 'Dedo de hierro', cost: 1,
    description: 'Años de práctica con el botón del ascensor. Clics ×2.',
    requires: [], excludes: [], pos: { row: 0, col: 1 },
    effects: [{ type: 'clickMult', value: 2 }],
  },
  {
    id: 'lazyExcelScript', branch: 'lazy', name: 'Macro de Excel que hace clic', cost: 3,
    description: 'Nadie sabe cómo funciona. +2 clics automáticos por segundo.',
    requires: ['lazyIronFinger'], excludes: [], pos: { row: 1, col: 1 },
    effects: [{ type: 'autoClick', value: 2 }],
  },
  {
    id: 'lazyTendinitis', branch: 'lazy', name: 'Tendinitis productiva', cost: 6,
    description: 'Duele, pero rinde. Cada clic suma un 2 % de tu producción por segundo.',
    requires: ['lazyExcelScript'], excludes: [], pos: { row: 2, col: 1 },
    effects: [{ type: 'clickPps', value: 0.02 }],
  },
  {
    id: 'lazyCritical', branch: 'lazy', name: 'Clic crítico', cost: 12,
    description: '10 % de probabilidad de que un clic valga ×10. Excluye «Ratón perpetuo».',
    requires: ['lazyTendinitis'], excludes: ['lazyPerpetualMouse'], pos: { row: 3, col: 0 },
    effects: [{ type: 'critChance', value: 0.1 }],
  },
  {
    id: 'lazyPerpetualMouse', branch: 'lazy', name: 'Ratón perpetuo', cost: 12,
    description: 'Un hámster dentro del ratón. +8 clics automáticos por segundo. Excluye «Clic crítico».',
    requires: ['lazyTendinitis'], excludes: ['lazyCritical'], pos: { row: 3, col: 2 },
    effects: [{ type: 'autoClick', value: 8 }],
  },
  {
    id: 'lazyGodThumb', branch: 'lazy', name: 'Pulgar del Dios administrativo', cost: 40,
    description: 'Un solo dedo para gobernarlos a todos. Clics ×3 y +3 clics automáticos/s.',
    requires: [], requiresAny: ['lazyCritical', 'lazyPerpetualMouse'], excludes: [], pos: { row: 4, col: 1 },
    effects: [{ type: 'clickMult', value: 3 }, { type: 'autoClick', value: 3 }],
  },

  // ── El explotador ──────────────────────────────────────────────────
  {
    id: 'exploit25Hours', branch: 'exploiter', name: 'Jornada de 25 horas', cost: 1,
    description: 'Hemos encontrado una hora extra detrás del radiador. Edificios ×1,3.',
    requires: [], excludes: [], pos: { row: 0, col: 1 },
    effects: [{ type: 'buildingMult', target: 'ALL', value: 1.3 }],
  },
  {
    id: 'exploitSeverance', branch: 'exploiter', name: 'Indemnización creativa', cost: 3,
    description: 'Edificios un 10 % más baratos y empiezas cada ciclo con 5.000 de papeleo.',
    requires: ['exploit25Hours'], excludes: [], pos: { row: 1, col: 1 },
    effects: [{ type: 'buildingCostMult', value: 0.9 }, { type: 'startingPaperwork', value: 5000 }],
  },
  {
    id: 'exploitScale', branch: 'exploiter', name: 'Economía de escala', cost: 6,
    description: '+5 % de producción total por cada tipo de edificio con 25 unidades o más.',
    requires: ['exploitSeverance'], excludes: [], pos: { row: 2, col: 1 },
    effects: [{ type: 'globalPerBuildingTypeAbove', threshold: 25, value: 0.05 }],
  },
  {
    id: 'exploitOutsourcing', branch: 'exploiter', name: 'Externalización a palomas', cost: 12,
    description: 'Lo barato sale barato. Impresoras, becarios y palomas ×3. Excluye «Rascacielos de clones».',
    requires: ['exploitScale'], excludes: ['exploitCloneTower'], pos: { row: 3, col: 0 },
    effects: [
      { type: 'buildingMult', target: 'printer', value: 3 },
      { type: 'buildingMult', target: 'intern', value: 3 },
      { type: 'buildingMult', target: 'pigeon', value: 3 },
    ],
  },
  {
    id: 'exploitCloneTower', branch: 'exploiter', name: 'Rascacielos de clones', cost: 12,
    description: 'Apuesta por lo caro. Clones, reactores y máquinas de reuniones ×2. Excluye «Externalización a palomas».',
    requires: ['exploitScale'], excludes: ['exploitOutsourcing'], pos: { row: 3, col: 2 },
    effects: [
      { type: 'buildingMult', target: 'bossClone', value: 2 },
      { type: 'buildingMult', target: 'bureaucracyReactor', value: 2 },
      { type: 'buildingMult', target: 'meetingMachine', value: 2 },
    ],
  },
  {
    id: 'exploitEmpire', branch: 'exploiter', name: 'Imperio de la explotación', cost: 40,
    description: 'Todo el organigrama trabaja el doble. Edificios ×2.',
    requires: [], requiresAny: ['exploitOutsourcing', 'exploitCloneTower'], excludes: [], pos: { row: 4, col: 1 },
    effects: [{ type: 'buildingMult', target: 'ALL', value: 2 }],
  },

  // ── El científico ──────────────────────────────────────────────────
  {
    id: 'sciQuantumCoffee', branch: 'scientist', name: 'Café cuántico', cost: 1,
    description: 'Está frío y caliente hasta que lo pruebas. Bonificaciones temporales un 50 % más largas.',
    requires: [], excludes: [], pos: { row: 0, col: 1 },
    effects: [{ type: 'tempDurationMult', value: 1.5 }],
  },
  {
    id: 'sciRemoteWork', branch: 'scientist', name: 'Teletrabajo interdimensional', cost: 3,
    description: '+25 % de eficiencia offline y +4 h de límite offline.',
    requires: ['sciQuantumCoffee'], excludes: [], pos: { row: 1, col: 1 },
    effects: [{ type: 'offlineEfficiency', value: 0.25 }, { type: 'offlineHours', value: 4 }],
  },
  {
    id: 'sciCopierGlitch', branch: 'scientist', name: 'Glitch de fotocopiadora', cost: 6,
    description: 'Formularios dorados un 30 % más frecuentes y recompensas de eventos ×1,5.',
    requires: ['sciRemoteWork'], excludes: [], pos: { row: 2, col: 1 },
    effects: [{ type: 'goldenFrequencyMult', value: 0.7 }, { type: 'eventRewardMult', value: 1.5 }],
  },
  {
    id: 'sciTimeLoop', branch: 'scientist', name: 'Bucle temporal', cost: 12,
    description: 'El lunes se repite, pero cobras dos veces. +12 h de límite offline y +25 % de eficiencia offline. Excluye «Anomalía estable».',
    requires: ['sciCopierGlitch'], excludes: ['sciStableAnomaly'], pos: { row: 3, col: 0 },
    effects: [{ type: 'offlineHours', value: 12 }, { type: 'offlineEfficiency', value: 0.25 }],
  },
  {
    id: 'sciStableAnomaly', branch: 'scientist', name: 'Anomalía estable', cost: 12,
    description: 'Recompensas de eventos y formularios dorados ×2 y bonificaciones temporales ×1,5 más largas. Excluye «Bucle temporal».',
    requires: ['sciCopierGlitch'], excludes: ['sciTimeLoop'], pos: { row: 3, col: 2 },
    effects: [{ type: 'eventRewardMult', value: 2 }, { type: 'tempDurationMult', value: 1.5 }],
  },
  {
    id: 'sciRewritePhysics', branch: 'scientist', name: 'Reescribir la física', cost: 40,
    description: 'Cada punto de Influencia ganado da un +3 % de producción en lugar de +2 %.',
    requires: [], requiresAny: ['sciTimeLoop', 'sciStableAnomaly'], excludes: [], pos: { row: 4, col: 1 },
    effects: [{ type: 'influencePower', value: 0.01 }],
  },

  // ── El villano ─────────────────────────────────────────────────────
  {
    id: 'villainUnpaidOvertime', branch: 'villain', name: 'Horas extra no pagadas', cost: 2,
    description: 'Producción total ×1,5, pero tus clics rinden la mitad (estás agotado).',
    requires: [], excludes: [], pos: { row: 0, col: 1 },
    effects: [{ type: 'globalMult', value: 1.5 }, { type: 'clickMult', value: 0.5 }],
  },
  {
    id: 'villainAbusiveClause', branch: 'villain', name: 'Cláusula abusiva', cost: 4,
    description: 'Letra pequeña, ganancias grandes. Influencia obtenida al ascender ×1,25.',
    requires: ['villainUnpaidOvertime'], excludes: [], pos: { row: 1, col: 1 },
    effects: [{ type: 'influenceMult', value: 1.25 }],
  },
  {
    id: 'villainNobodyTouches', branch: 'villain', name: 'Que nadie toque nada', cost: 8,
    description: 'Producción ×2 mientras lleves 30 segundos sin hacer clic manual. Los clics automáticos no cuentan.',
    requires: ['villainAbusiveClause'], excludes: [], pos: { row: 2, col: 1 },
    effects: [{ type: 'idleGlobalMult', value: 2 }],
  },
  {
    id: 'villainDevilContract', branch: 'villain', name: 'Contrato con el diablo', cost: 15,
    description: 'Producción total ×2,5, pero la eficiencia offline baja un 30 %. Excluye «Monopolio».',
    requires: ['villainNobodyTouches'], excludes: ['villainMonopoly'], pos: { row: 3, col: 0 },
    effects: [{ type: 'globalMult', value: 2.5 }, { type: 'offlineEfficiency', value: -0.3 }],
  },
  {
    id: 'villainMonopoly', branch: 'villain', name: 'Monopolio', cost: 15,
    description: '+15 % de producción total por cada tipo de edificio con 50 unidades o más. Excluye «Contrato con el diablo».',
    requires: ['villainNobodyTouches'], excludes: ['villainDevilContract'], pos: { row: 3, col: 2 },
    effects: [{ type: 'globalPerBuildingTypeAbove', threshold: 50, value: 0.15 }],
  },
  {
    id: 'villainHostileTakeover', branch: 'villain', name: 'OPA hostil al multiverso', cost: 50,
    description: 'Compras la competencia. Y la realidad. Influencia ×1,5 y producción total ×1,5.',
    requires: [], requiresAny: ['villainDevilContract', 'villainMonopoly'], excludes: [], pos: { row: 4, col: 1 },
    effects: [{ type: 'influenceMult', value: 1.5 }, { type: 'globalMult', value: 1.5 }],
  },
];

export const TALENT_IDS = TALENTS.map((t) => t.id);

export const TALENTS_BY_ID = Object.fromEntries(TALENTS.map((t) => [t.id, t]));

// Reasignar talentos: gratis, pero solo al principio de un ciclo (papeleo del
// ciclo por debajo de este umbral) para que no se pueda abusar a mitad de partida.
export const RESPEC_MAX_CYCLE_TOTAL = 1000;
