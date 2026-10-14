// Datos de los edificios (productores automáticos).
// Añadir un edificio nuevo = añadir un objeto aquí. La economía, la interfaz,
// la escena y el guardado lo recogen automáticamente.
//
// Campos:
//   id              Identificador estable (se usa en las partidas guardadas).
//   name            Nombre visible.
//   description     Texto humorístico.
//   baseCost        Coste de la primera unidad.
//   costGrowth      Factor de crecimiento del coste por unidad poseída.
//   baseProduction  Papeleo por segundo de cada unidad sin multiplicadores.
//   department      Departamento que lo desbloquea (ver departments.data.js).
//   icon            Clave del icono (ver js/ui/sprites.js).

export const BUILDINGS = [
  {
    id: 'printer',
    name: 'Impresora de segunda mano',
    description: 'Funciona cuando quiere. Hoy quiere poco.',
    baseCost: 15,
    costGrowth: 1.15,
    baseProduction: 0.2,
    department: 'basement',
    icon: 'printer',
  },
  {
    id: 'intern',
    name: 'Becario sin contrato',
    description: 'Cobra en experiencia y en galletas caducadas.',
    baseCost: 100,
    costGrowth: 1.15,
    baseProduction: 1,
    department: 'basement',
    icon: 'intern',
  },
  {
    id: 'pigeon',
    name: 'Paloma contable',
    description: 'Cuadra balances a picotazos. Nadie se atreve a auditarla.',
    baseCost: 1100,
    costGrowth: 1.15,
    baseProduction: 8,
    department: 'exploitation',
    icon: 'pigeon',
  },
  {
    id: 'bossClone',
    name: 'Clon del jefe',
    description: 'Igual de inútil que el original, pero en paralelo.',
    baseCost: 12000,
    costGrowth: 1.15,
    baseProduction: 50,
    department: 'hellHR',
    icon: 'boss',
  },
  {
    id: 'bureaucracyReactor',
    name: 'Reactor burocrático',
    description: 'Fisión de expedientes. Cada sello libera energía y formularios.',
    baseCost: 150000,
    costGrowth: 1.15,
    baseProduction: 400,
    department: 'hellHR',
    icon: 'reactor',
  },
  {
    id: 'meetingMachine',
    name: 'Máquina de hacer reuniones',
    description: 'Convoca reuniones para decidir cuándo convocar reuniones.',
    baseCost: 2000000,
    costGrowth: 1.15,
    baseProduction: 2600,
    department: 'multinational',
    icon: 'meeting',
  },
  {
    id: 'inhumanResources',
    name: 'Departamento de Recursos Inhumanos',
    description: 'Contratan minotauros. Despiden por correo certificado en llamas.',
    baseCost: 30000000,
    costGrowth: 1.15,
    baseProduction: 16000,
    department: 'multinational',
    icon: 'minotaur',
  },
  {
    id: 'dimensionalPrinter',
    name: 'Impresora dimensional',
    description: 'Imprime a doble cara: esta realidad y la de al lado.',
    baseCost: 450000000,
    costGrowth: 1.15,
    baseProduction: 100000,
    department: 'multinational',
    icon: 'dimPrinter',
  },
  {
    id: 'universeFactory',
    name: 'Fábrica de universos',
    description: 'Universos en serie. Algunos salen con el Big Bang torcido.',
    baseCost: 20000000000,
    costGrowth: 1.15,
    baseProduction: 700000,
    department: 'adminGod',
    icon: 'universe',
  },
  {
    id: 'paradoxDept',
    name: 'Departamento de paradojas',
    description: 'Archivan informes antes de que se escriban. Y viceversa.',
    baseCost: 800000000000,
    costGrowth: 1.15,
    baseProduction: 5000000,
    department: 'adminGod',
    icon: 'ghost',
  },
  {
    id: 'godServer',
    name: 'Servidor que contiene a Dios',
    description: 'Tiene el 99,9 % de disponibilidad. El 0,1 % restante es misterio.',
    baseCost: 40000000000000,
    costGrowth: 1.15,
    baseProduction: 40000000,
    department: 'adminGod',
    icon: 'wizard',
  },
  {
    id: 'lostTimeMinistry',
    name: 'Ministerio del Tiempo Perdido',
    description: 'Recuperan las horas de reuniones inútiles y las revenden.',
    baseCost: 2500000000000000,
    costGrowth: 1.15,
    baseProduction: 300000000,
    department: 'adminGod',
    icon: 'lizard',
  },
  {
    id: 'apocalypseCallCenter',
    name: 'Centro de Atención al Apocalipsis',
    description: 'Su llamada es importante para nosotros. Fin del mundo en espera.',
    baseCost: 200000000000000000,
    costGrowth: 1.15,
    baseProduction: 2500000000,
    department: 'adminGod',
    icon: 'dragon',
  },
  // ── Niveles 7–12 (tras la primera fusión) ─────────────────────────────
  {
    id: 'timeTravelAgency',
    name: 'Agencia de Viajes en el Tiempo (Gastos)',
    description: 'Viaja al pasado a justificar facturas que todavía no existen.',
    baseCost: 20000000000000000000,
    costGrowth: 1.15,
    baseProduction: 20000000000,
    department: 'timeOffice',
    icon: 'timeRobot',
  },
  {
    id: 'quantumNotary',
    name: 'Notaría cuántica',
    description: 'Da fe de documentos que están firmados y sin firmar a la vez.',
    baseCost: 2e21,
    costGrowth: 1.15,
    baseProduction: 150000000000,
    department: 'quantumBureau',
    icon: 'quantum',
  },
  {
    id: 'realityPrinter',
    name: 'Imprenta de realidades alternativas',
    description: 'Imprime universos donde el papeleo ya está hecho. Se los vende al nuestro.',
    baseCost: 2e23,
    costGrowth: 1.15,
    baseProduction: 1100000000000,
    department: 'altReality',
    icon: 'goldPrinter',
  },
  {
    id: 'voidCafeteria',
    name: 'Cafetería del Vacío Absoluto',
    description: 'Sirve café a la nada. La nada trabaja horas extra a cambio.',
    baseCost: 2e25,
    costGrowth: 1.15,
    baseProduction: 8000000000000,
    department: 'voidHQ',
    icon: 'voidCoffee',
  },
  {
    id: 'primordialShareholders',
    name: 'Accionistas primordiales',
    description: 'Entes anteriores al Big Bang que exigen dividendos trimestrales.',
    baseCost: 2e27,
    costGrowth: 1.15,
    baseProduction: 60000000000000,
    department: 'primordialBoard',
    icon: 'shareholder',
  },
  {
    id: 'entropyInbox',
    name: 'Bandeja de entrada de la entropía',
    description: 'Todo acaba aquí. Literalmente todo. Y hay que contestarlo.',
    baseCost: 2e29,
    costGrowth: 1.15,
    baseProduction: 450000000000000,
    department: 'endOfTime',
    icon: 'entropy',
  },
];

// ─── Hitos por cantidad ───────────────────────────────────────────────────
// Al poseer 10, 25, 50 y 100 unidades de un edificio se activan, sin comprar
// nada, bonificaciones a OTRAS partes de la oficina:
//   10  → el edificio anterior de la cadena produce +15 % (los nuevos ayudan a
//         los veteranos; las impresoras mejoran los clics)
//   25  → el edificio siguiente produce +10 % (los veteranos forman a los nuevos)
//   50  → una ventaja especial propia de cada edificio (ver SPECIALS)
//   100 → +3 % de producción total
// Se calculan a partir de las cantidades (nunca se guardan), así que no pueden
// duplicarse al cargar la partida.

export const MILESTONE_COUNTS = [10, 25, 50, 100];

const SPECIALS = {
  printer: { effects: [{ type: 'clickFlat', value: 5 }], text: '+5 de papeleo base por clic (imprimen sellos de goma)' },
  intern: { effects: [{ type: 'autoClick', value: 1 }], text: '+1 clic automático por segundo (un becario pulsa por ti)' },
  pigeon: { effects: [{ type: 'goldenFrequencyMult', value: 0.9 }], text: 'formularios dorados un 10 % más frecuentes (las palomas los traen)' },
  bossClone: { effects: [{ type: 'eventRewardMult', value: 1.25 }], text: 'recompensas de eventos ×1,25' },
  bureaucracyReactor: { effects: [{ type: 'offlineEfficiency', value: 0.05 }], text: '+5 % de eficiencia offline' },
  meetingMachine: { effects: [{ type: 'tempDurationMult', value: 1.1 }], text: 'bonificaciones temporales un 10 % más largas' },
  inhumanResources: { effects: [{ type: 'buildingCostMult', value: 0.97 }], text: 'todos los edificios un 3 % más baratos' },
  dimensionalPrinter: { effects: [{ type: 'critChance', value: 0.02 }], text: '+2 % de probabilidad de clic crítico' },
  universeFactory: { effects: [{ type: 'influenceMult', value: 1.05 }], text: 'Influencia al ascender ×1,05' },
  paradoxDept: { effects: [{ type: 'offlineHours', value: 2 }], text: '+2 h de límite offline' },
  godServer: { effects: [{ type: 'missionRewardMult', value: 1.5 }], text: 'recompensas de misiones ×1,5' },
  lostTimeMinistry: { effects: [{ type: 'tempDurationMult', value: 1.15 }], text: 'bonificaciones temporales un 15 % más largas' },
  apocalypseCallCenter: { effects: [{ type: 'eventRewardMult', value: 1.25 }], text: 'recompensas de eventos y formularios dorados ×1,25' },
  timeTravelAgency: { effects: [{ type: 'offlineHours', value: 4 }], text: '+4 h de límite offline (viajas al momento en que volviste)' },
  quantumNotary: { effects: [{ type: 'critChance', value: 0.03 }], text: '+3 % de clic crítico (el clic es y no es crítico)' },
  realityPrinter: { effects: [{ type: 'influenceMult', value: 1.1 }], text: 'Influencia al ascender ×1,1' },
  voidCafeteria: { effects: [{ type: 'autoClick', value: 10 }], text: '+10 clics automáticos por segundo' },
  primordialShareholders: { effects: [{ type: 'buildingCostMult', value: 0.95 }], text: 'todos los edificios un 5 % más baratos' },
  entropyInbox: { effects: [{ type: 'globalMult', value: 1.25 }], text: 'producción total ×1,25' },
};

function buildMilestones(index) {
  const self = BUILDINGS[index];
  const prev = BUILDINGS[index - 1];
  const next = BUILDINGS[index + 1];
  return [
    prev
      ? { count: 10, effects: [{ type: 'buildingMult', target: prev.id, value: 1.15 }], text: `${prev.name}: +15 % de producción` }
      : { count: 10, effects: [{ type: 'clickMult', value: 1.25 }], text: 'clics +25 %' },
    next
      ? { count: 25, effects: [{ type: 'buildingMult', target: next.id, value: 1.1 }], text: `${next.name}: +10 % de producción` }
      : { count: 25, effects: [{ type: 'globalMult', value: 1.1 }], text: 'producción total +10 %' },
    { count: 50, effects: SPECIALS[self.id].effects, text: SPECIALS[self.id].text },
    { count: 100, effects: [{ type: 'globalMult', value: 1.03 }], text: 'producción total +3 %' },
  ];
}

BUILDINGS.forEach((b, i) => { b.milestones = buildMilestones(i); });

export const BUILDING_IDS = BUILDINGS.map((b) => b.id);

export const BUILDINGS_BY_ID = Object.fromEntries(BUILDINGS.map((b) => [b.id, b]));
