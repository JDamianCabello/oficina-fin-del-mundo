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
//   { type: 'boardPerks', value }        Ventajas del Consejo compradas.
//   (ver js/core/progression.js para la lista completa)
//
// `howToUnlock` explica en lenguaje claro QUÉ hay que hacer para llegar a ese
// nivel (se muestra en la tarjeta «Objetivo» y en la lista de departamentos).
// `effects` (opcional) son ventajas permanentes que da el nivel al desbloquearse
// (formato de js/core/economy.js; se derivan de los niveles desbloqueados).

export const DEPARTMENTS = [
  {
    id: 'basement',
    level: 1,
    name: 'El Sótano',
    title: 'Nivel 1 · El becario',
    description: 'Una mesa, un ordenador de 1997 y una impresora con traumas.',
    unlockText: 'Bienvenido. Tu silla es un cubo. Tu mesa, otro cubo.',
    howToUnlock: 'Es el nivel inicial.',
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
    howToUnlock: 'Contrata 5 becarios (pestaña Edificios) y produce 1.500 de papeleo en este ciclo. Al principio, clica la oficina y compra impresoras.',
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
    howToUnlock: 'Reúne 20 palomas contables y produce 500 mil de papeleo en este ciclo. Compra las mejoras de palomas y becarios y reclama las misiones.',
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
    howToUnlock: 'Construye 15 reactores burocráticos y produce 200 M de papeleo en este ciclo. Las mejoras de sinergia (pestaña Mejoras) aceleran mucho.',
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
    howToUnlock: 'ASCIENDE 2 veces (pestaña Prestigio) y, dentro de un mismo ciclo, ten 10 impresoras dimensionales. Gasta la Influencia en talentos para ir más rápido.',
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
    howToUnlock: 'Necesitas comprar LA MEJORA «Formulario 404-B (sellado y firmado)» en la pestaña Mejoras. Aparece cuando tienes 10 Centros de Atención al Apocalipsis y cuesta 1 Sx de papeleo.',
    requirements: [
      { type: 'upgrade', id: 'form404B' },
    ],
    features: ['merger'],
  },
  {
    id: 'timeOffice',
    level: 7,
    name: 'Oficina de Gastos Temporales',
    title: 'Nivel 7 · Gastos de viaje en el tiempo',
    description: 'Agencias de viajes en el tiempo y +8 h de producción offline permanentes.',
    unlockText: 'Nuevo edificio: Agencia de Viajes en el Tiempo. Ventaja permanente: +8 h de límite offline.',
    howToUnlock: 'FUSIÓNATE una vez (pestaña Prestigio → Fusión multiversal) y, después, vuelve a reunir 10 Centros de Atención al Apocalipsis en un mismo ciclo.',
    requirements: [
      { type: 'mergers', value: 1 },
      { type: 'building', id: 'apocalypseCallCenter', count: 10 },
    ],
    features: ['timeTravel'],
    effects: [{ type: 'offlineHours', value: 8 }],
  },
  {
    id: 'quantumBureau',
    level: 8,
    name: 'Burocracia Cuántica',
    title: 'Nivel 8 · Burocracia cuántica',
    description: 'Notarías cuánticas y clics críticos de serie.',
    unlockText: 'Nuevo edificio: Notaría cuántica. Ventaja permanente: +5 % de clics críticos.',
    howToUnlock: 'Ten 25 Agencias de Viajes en el Tiempo y produce 10 Sp (diez cuatrillones) de papeleo en este ciclo.',
    requirements: [
      { type: 'building', id: 'timeTravelAgency', count: 25 },
      { type: 'cycleTotal', value: 1e25 },
    ],
    features: ['quantum'],
    effects: [{ type: 'critChance', value: 0.05 }],
  },
  {
    id: 'altReality',
    level: 9,
    name: 'Ministerio de Realidades Alternativas',
    title: 'Nivel 9 · Realidades alternativas',
    description: 'Imprentas de realidades y formularios dorados mucho más frecuentes.',
    unlockText: 'Nuevo edificio: Imprenta de realidades. Ventaja permanente: formularios dorados un 25 % más frecuentes.',
    howToUnlock: 'Ten 25 Notarías cuánticas, produce 1 Oc (un sextillón) de papeleo en este ciclo y llega a 3 fusiones en total (pestaña Prestigio).',
    requirements: [
      { type: 'building', id: 'quantumNotary', count: 25 },
      { type: 'cycleTotal', value: 1e27 },
      { type: 'mergers', value: 3 },
    ],
    features: ['altReality'],
    effects: [{ type: 'goldenFrequencyMult', value: 0.75 }],
  },
  {
    id: 'voidHQ',
    level: 10,
    name: 'Sede Central en el Vacío Absoluto',
    title: 'Nivel 10 · La sede en el vacío',
    description: 'Cafeterías del Vacío y un ejército de clics automáticos.',
    unlockText: 'Nuevo edificio: Cafetería del Vacío. Ventaja permanente: +25 clics automáticos por segundo.',
    howToUnlock: 'Ten 25 Imprentas de realidades, produce 100 Oc (cien sextillones) de papeleo en este ciclo y compra 6 ventajas del Consejo de Administración (pestaña Prestigio).',
    requirements: [
      { type: 'building', id: 'realityPrinter', count: 25 },
      { type: 'cycleTotal', value: 1e29 },
      { type: 'boardPerks', value: 6 },
    ],
    features: ['void'],
    effects: [{ type: 'autoClick', value: 25 }],
  },
  {
    id: 'primordialBoard',
    level: 11,
    name: 'Junta de Accionistas Primordiales',
    title: 'Nivel 11 · Accionistas primordiales',
    description: 'Accionistas anteriores al Big Bang e Influencia ×1,5 al ascender.',
    unlockText: 'Nuevo edificio: Accionistas primordiales. Ventaja permanente: Influencia ×1,5 al ascender.',
    howToUnlock: 'Ten 25 Cafeterías del Vacío y produce 100 No (cien quintillones) de papeleo en este ciclo.',
    requirements: [
      { type: 'building', id: 'voidCafeteria', count: 25 },
      { type: 'cycleTotal', value: 1e32 },
    ],
    features: ['primordial'],
    effects: [{ type: 'influenceMult', value: 1.5 }],
  },
  {
    id: 'endOfTime',
    level: 12,
    name: 'El Despacho al Final del Tiempo',
    title: 'Nivel 12 · Al final del tiempo',
    description: 'La bandeja de entrada de la entropía y la apelación definitiva.',
    unlockText: 'Has llegado al final del tiempo. Producción total ×2 para siempre. Queda una última firma…',
    howToUnlock: 'Ten 25 Accionistas primordiales, produce 1 Dc de papeleo en este ciclo y llega a 6 fusiones en total (pestaña Prestigio).',
    finalGoal: 'Meta final: compra LA MEJORA «Formulario 405-C: Apelación del fin del mundo» en la pestaña Mejoras. Aparece con 10 Bandejas de entrada de la entropía y cuesta 10 Dc de papeleo.',
    requirements: [
      { type: 'building', id: 'primordialShareholders', count: 25 },
      { type: 'cycleTotal', value: 1e33 },
      { type: 'mergers', value: 6 },
    ],
    features: ['endOfTime'],
    effects: [{ type: 'globalMult', value: 2 }],
  },
];

export const DEPARTMENT_IDS = DEPARTMENTS.map((d) => d.id);

export const DEPARTMENTS_BY_ID = Object.fromEntries(DEPARTMENTS.map((d) => [d.id, d]));
