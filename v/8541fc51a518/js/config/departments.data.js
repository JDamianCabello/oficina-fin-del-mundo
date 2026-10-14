// Niveles corporativos / departamentos.
// Un departamento se desbloquea cuando se cumplen TODOS sus requisitos y se
// conserva para siempre (sobrevive al prestigio).
// `features` enumera las mecánicas que el departamento activa; el resto del
// código pregunta por ellas con isFeatureUnlocked(state, 'nombre').
//
// Formato de requisitos (compartido con mejoras, misiones y logros):
//   { type: 'building', id, count }      Poseer N unidades de un edificio.
//   { type: 'buildingsTotal', value }    Poseer N edificios en total.
//   { type: 'cycleTotal', value }        Papeleo producido en el ciclo actual.
//   { type: 'lifetime', value }          Papeleo producido en toda la partida.
//   { type: 'pps', value }               Producción por segundo actual.
//   { type: 'clicks', value }            Clics manuales totales.
//   { type: 'upgrade', id }              Haber comprado una mejora.
//   { type: 'upgradesOwned', value }     Número de mejoras compradas en el ciclo.
//   { type: 'achievement', id }          Haber desbloqueado un logro.
//   { type: 'department', id }           Tener un departamento.
//   { type: 'prestiges', value }         Número de ascensos realizados.
//   { type: 'talent', id }               Tener un talento.
//   { type: 'mergers', value }           Número de fusiones realizadas.
//   (ver js/core/progression.js para la lista completa)

export const DEPARTMENTS = [
  {
    id: 'basement',
    level: 1,
    name: 'El Sótano',
    title: 'Nivel 1 · El becario',
    description: 'Una mesa, un ordenador de 1997 y una impresora con traumas.',
    unlockText: 'Bienvenido. Tu silla es un cubo. Tu mesa, otro cubo.',
    requirements: [],
    features: ['clicking', 'buildings', 'upgrades'],
  },
  {
    id: 'exploitation',
    level: 2,
    name: 'Planta de Explotación Laboral',
    title: 'Nivel 2 · La explotación laboral',
    description: 'Llegan las palomas contables, las misiones y los imprevistos.',
    unlockText: 'Nuevo departamento: palomas contables, misiones y eventos aleatorios.',
    requirements: [
      { type: 'building', id: 'intern', count: 5 },
      { type: 'cycleTotal', value: 1500 },
    ],
    features: ['missions', 'events'],
  },
  {
    id: 'hellHR',
    level: 3,
    name: 'Recursos Humanos del Infierno',
    title: 'Nivel 3 · Recursos Humanos del infierno',
    description: 'Clones del jefe, reactores, sinergias entre departamentos y el árbol de talentos.',
    unlockText: 'Nuevo departamento: clones, reactores burocráticos, sinergias y talentos.',
    requirements: [
      { type: 'building', id: 'pigeon', count: 20 },
      { type: 'cycleTotal', value: 500000 },
    ],
    features: ['synergies', 'talents'],
  },
  {
    id: 'multinational',
    level: 4,
    name: 'Multinacional Interdimensional',
    title: 'Nivel 4 · La multinacional interdimensional',
    description: 'Ascensos (prestigio), formularios dorados y maquinaria de otra dimensión.',
    unlockText: 'Nuevo departamento: ¡ya puedes ASCENDER y aparecen formularios dorados!',
    requirements: [
      { type: 'building', id: 'bureaucracyReactor', count: 15 },
      { type: 'cycleTotal', value: 200000000 },
    ],
    features: ['prestige', 'golden'],
  },
  {
    id: 'adminGod',
    level: 5,
    name: 'Despacho del Dios Administrativo',
    title: 'Nivel 5 · Dios administrativo',
    description: 'Edificios cósmicos, leyes físicas negociables y el formulario 404-B.',
    unlockText: 'Has llegado a la cima. El universo espera tu firma.',
    requirements: [
      { type: 'prestiges', value: 2 },
      { type: 'building', id: 'dimensionalPrinter', count: 10 },
    ],
    features: ['cosmic', 'endgame'],
  },
  {
    id: 'board',
    level: 6,
    name: 'Consejo de Administración del Multiverso',
    title: 'Nivel 6 · Consejo de Administración',
    description: 'Fusión multiversal (segunda capa de prestigio): Acciones y ventajas del Consejo.',
    unlockText: 'El Consejo te recibe. Ya puedes FUSIONAR la empresa con el multiverso a cambio de Acciones.',
    requirements: [
      { type: 'upgrade', id: 'form404B' },
    ],
    features: ['merger'],
  },
];

export const DEPARTMENT_IDS = DEPARTMENTS.map((d) => d.id);

export const DEPARTMENTS_BY_ID = Object.fromEntries(DEPARTMENTS.map((d) => [d.id, d]));
