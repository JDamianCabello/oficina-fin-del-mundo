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
];

export const BUILDING_IDS = BUILDINGS.map((b) => b.id);

export const BUILDINGS_BY_ID = Object.fromEntries(BUILDINGS.map((b) => [b.id, b]));
