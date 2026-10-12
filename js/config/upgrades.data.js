// Mejoras de compra única. Se pierden al ascender (prestigio).
//
// Campos: id (estable), name, description, category ('click' | 'building' |
// 'global' | 'special' | 'synergy' | 'endgame'), cost, requirements (formato de
// departments.data.js), effects (formato documentado en js/core/economy.js),
// tags (para logros: p. ej. 'coffee').

const tier = (id, name, description, target, count, cost, value, extra = {}) => ({
  id,
  name,
  description,
  category: 'building',
  cost,
  requirements: [{ type: 'building', id: target, count }],
  effects: [{ type: 'buildingMult', target, value }],
  tags: [],
  ...extra,
});

const synergy = (id, name, description, cost, requirements, target, source, value) => ({
  id,
  name,
  description,
  category: 'synergy',
  cost,
  requirements: [{ type: 'department', id: 'hellHR' }, ...requirements],
  effects: [{ type: 'synergy', target, source, value }],
  tags: [],
});

export const UPGRADES = [
  // ── Clics ────────────────────────────────────────────────────────────
  {
    id: 'coffeeDubious',
    name: 'Café de dudosa procedencia',
    description: 'Sabe a tinta y a decisiones equivocadas. Clics ×2.',
    category: 'click',
    cost: 50,
    requirements: [{ type: 'clicks', value: 10 }],
    effects: [{ type: 'clickMult', value: 2 }],
    tags: ['coffee'],
  },
  {
    id: 'keyboardPrehistoric',
    name: 'Teclado mecánico de la prehistoria',
    description: 'Cada tecla suena como un dinosaurio cayendo. Clics ×2.',
    category: 'click',
    cost: 400,
    requirements: [{ type: 'upgrade', id: 'coffeeDubious' }, { type: 'clicks', value: 40 }],
    effects: [{ type: 'clickMult', value: 2 }],
    tags: [],
  },
  {
    id: 'anxiousMouse',
    name: 'Ratón con ansiedad',
    description: 'Hace clic solo, por nervios. 1 clic automático por segundo.',
    category: 'click',
    cost: 4000,
    requirements: [{ type: 'upgrade', id: 'keyboardPrehistoric' }, { type: 'department', id: 'exploitation' }],
    effects: [{ type: 'autoClick', value: 1 }],
    tags: [],
  },
  {
    id: 'buttonTraining',
    name: 'Formación en pulsar botones',
    description: 'Un curso de 40 horas con diploma. Cada clic suma un 1 % de tu producción por segundo.',
    category: 'click',
    cost: 40000,
    requirements: [{ type: 'upgrade', id: 'anxiousMouse' }, { type: 'clicks', value: 300 }],
    effects: [{ type: 'clickPps', value: 0.01 }],
    tags: [],
  },
  {
    id: 'tripleCoffee',
    name: 'Café triple sin receta médica',
    description: 'Ves sonidos y oyes colores. Clics ×3 y +1 % de la producción por clic.',
    category: 'click',
    cost: 800000,
    requirements: [{ type: 'upgrade', id: 'buttonTraining' }, { type: 'clicks', value: 800 }],
    effects: [{ type: 'clickMult', value: 3 }, { type: 'clickPps', value: 0.01 }],
    tags: ['coffee'],
  },
  {
    id: 'coffeeUnion',
    name: 'La cafetera se ha sindicado',
    description: 'Exige descansos, pero trabaja por ti: +2 clics automáticos/s y +2 % de producción por clic.',
    category: 'click',
    cost: 40000000,
    requirements: [{ type: 'upgrade', id: 'tripleCoffee' }, { type: 'clicks', value: 2000 }],
    effects: [{ type: 'autoClick', value: 2 }, { type: 'clickPps', value: 0.02 }],
    tags: ['coffee'],
  },
  {
    id: 'coffeeIV',
    name: 'Café intravenoso',
    description: 'Recomendado por cero de cada diez médicos. Clics ×5 y +2 % de producción por clic.',
    category: 'click',
    cost: 4000000000,
    requirements: [{ type: 'upgrade', id: 'coffeeUnion' }, { type: 'clicks', value: 4000 }],
    effects: [{ type: 'clickMult', value: 5 }, { type: 'clickPps', value: 0.02 }],
    tags: ['coffee'],
  },
  {
    id: 'coffeeSingularity',
    name: 'Singularidad cafeínica',
    description: 'El café se bebe a ti. +3 % de producción por clic y 5 % de clics críticos.',
    category: 'click',
    cost: 4000000000000,
    requirements: [{ type: 'upgrade', id: 'coffeeIV' }, { type: 'clicks', value: 8000 }],
    effects: [{ type: 'clickPps', value: 0.03 }, { type: 'critChance', value: 0.05 }],
    tags: ['coffee'],
  },

  // ── Edificios ────────────────────────────────────────────────────────
  tier('printerThreat', 'Impresora que amenaza al usuario', '«Imprime o te atasco». Funciona. Impresoras ×2.', 'printer', 1, 100, 2),
  tier('otherDimInk', 'Tinta procedente de otra dimensión', 'Huele a azufre y a lunes. Impresoras ×2.', 'printer', 10, 1500, 2),
  tier('printerImpostor', 'Impresora con síndrome del impostor', 'Imprime el triple para demostrar que vale. Impresoras ×3.', 'printer', 25, 100000, 3),
  tier('printerLawyer', 'La impresora ha pedido un abogado', 'Ahora cobra por página. Y produce más. Impresoras ×3.', 'printer', 50, 10000000, 3),

  tier('internsSwappable', 'Becarios intercambiables', 'Si uno se rompe, nadie lo nota. Becarios ×2.', 'intern', 1, 1000, 2),
  tier('internsVending', 'Becarios alimentados con café de máquina', 'Un vaso de plástico es un sueldo. Becarios ×2.', 'intern', 10, 10000, 2, { tags: ['coffee'] }),
  tier('internCloner', 'Clonadora de becarios', 'Más barato que contratar. Más ético que... no, tampoco. Becarios ×3.', 'intern', 25, 500000, 3),
  tier('internContract', 'Becario con contrato (es broma)', 'La ilusión dispara la productividad. Becarios ×3.', 'intern', 50, 50000000, 3),

  tier('pigeonsUnion', 'Palomas sindicalizadas', 'Exigen migas de calidad y cumplen plazos. Palomas ×2.', 'pigeon', 1, 11000, 2),
  tier('pigeonsExcel', 'Palomas con máster en Excel', 'Dominan las tablas dinámicas a picotazos. Palomas ×2.', 'pigeon', 10, 110000, 2),
  tier('pigeonsMafia', 'La paloma sabe dónde vives', 'Nadie discute sus balances. Palomas ×3.', 'pigeon', 25, 5500000, 3),

  tier('clonesLessPersonality', 'Clones con menos personalidad', 'Sin carisma, sin opiniones, sin descansos. Clones ×2.', 'bossClone', 1, 120000, 2),
  tier('bossHologram', 'El jefe ahora es un holograma', 'Supervisa a todos a la vez sin pagar alquiler. Clones ×2 y clics ×1,5.', 'bossClone', 10, 1200000, 2, {
    category: 'special',
    effects: [
      { type: 'buildingMult', target: 'bossClone', value: 2 },
      { type: 'clickMult', value: 1.5 },
    ],
  }),
  tier('clonesSync', 'Clones en sincronía perfecta', 'Asienten al unísono. Da miedo. Clones ×3.', 'bossClone', 25, 60000000, 3),

  tier('reactorStaples', 'Barras de combustible de grapas', 'Enriquecidas al 3 %. Reactores ×2.', 'bureaucracyReactor', 1, 1500000, 2),
  tier('reactorMeltdown', 'Fusión del núcleo administrativo', 'Un pequeño desastre controlado. Reactores ×2.', 'bureaucracyReactor', 10, 15000000, 2),
  tier('reactorWaste', 'Residuos radiactivos archivados', 'En una carpeta que pone «NO ABRIR». Reactores ×3.', 'bureaucracyReactor', 25, 750000000, 3),

  tier('meetingEmptyAgenda', 'Reuniones con orden del día vacío', 'Más rápidas, igual de inútiles. Máquinas de reuniones ×2.', 'meetingMachine', 1, 20000000, 2),
  tier('meetingPrep', 'Reunión para preparar la reunión', 'Metarreuniones de alto rendimiento. Máquinas de reuniones ×2.', 'meetingMachine', 10, 200000000, 2),

  tier('irSacrifice', 'Entrevistas con sacrificio incluido', 'Dinámica de grupo con pentagrama. Recursos Inhumanos ×2.', 'inhumanResources', 1, 300000000, 2),
  tier('irFlames', 'Despidos en llamas', 'Literalmente. Recursos Inhumanos ×2.', 'inhumanResources', 10, 3000000000, 2),

  tier('dpAntimatter', 'Tóner de antimateria', 'No tocar con las manos. Ni con nada. Impresoras dimensionales ×2.', 'dimensionalPrinter', 1, 4500000000, 2),
  tier('dpJam', 'Atasco de papel en el espacio-tiempo', 'Ahora imprime ayer. Impresoras dimensionales ×2.', 'dimensionalPrinter', 10, 45000000000, 2),

  tier('ufWarranty', 'Universos con garantía de dos años', 'No cubre agujeros negros. Fábricas de universos ×2.', 'universeFactory', 1, 200000000000, 2),
  tier('pdTomorrow', 'Este informe ya lo leíste mañana', 'Ahorra tiempo que todavía no tienes. Paradojas ×2.', 'paradoxDept', 1, 8000000000000, 2),
  tier('gsDarkMode', 'Dios en modo oscuro', 'Cansa menos la vista divina. Servidores divinos ×2.', 'godServer', 1, 400000000000000, 2),
  tier('ltBackwards', 'Relojes que cuentan hacia atrás', 'Todas las reuniones acaban antes de empezar. Ministerios ×2.', 'lostTimeMinistry', 1, 25000000000000000, 2),
  tier('ufAirplaneMode', 'Universos con modo avión', 'Sin cobertura, sin quejas. Fábricas de universos ×2.', 'universeFactory', 10, 2000000000000, 2),
  tier('pdGrandfather', 'La paradoja del abuelo becario', 'Despidió a su abuelo y sigue cobrando. Paradojas ×2.', 'paradoxDept', 10, 80000000000000, 2),
  tier('gs2FA', 'Dios con doble factor de autenticación', 'Para rezar te llega un código por SMS. Servidores divinos ×2.', 'godServer', 10, 4000000000000000, 2),
  tier('ltPastOvertime', 'Horas extra del pasado', 'Las cobras en 1987, con intereses. Ministerios ×2.', 'lostTimeMinistry', 10, 250000000000000000, 2),
  tier('acHoldMusic', 'Música de espera apocalíptica', 'Cuatro jinetes en versión flauta dulce. Centros de atención ×2.', 'apocalypseCallCenter', 1, 2000000000000000000, 2),
  tier('acImportant', 'Su apocalipsis es importante para nosotros', 'Le atenderemos en cuanto acabe el mundo. Centros de atención ×2.', 'apocalypseCallCenter', 10, 20000000000000000000, 2),

  // ── Producción global ───────────────────────────────────────────────
  {
    id: 'meetingsBreed',
    name: 'Reuniones que generan reuniones',
    description: 'Se reproducen por esporas en la sala B. Producción total ×1,2.',
    category: 'global',
    cost: 15000,
    requirements: [{ type: 'department', id: 'exploitation' }, { type: 'buildingsTotal', value: 20 }],
    effects: [{ type: 'globalMult', value: 1.2 }],
    tags: [],
  },
  {
    id: 'productivityHallucination',
    name: 'La productividad es una alucinación colectiva',
    description: 'Si todos creen que trabajan, trabajan. Producción total ×1,25.',
    category: 'global',
    cost: 400000,
    requirements: [{ type: 'department', id: 'hellHR' }],
    effects: [{ type: 'globalMult', value: 1.25 }],
    tags: [],
  },
  {
    id: 'mondayFired',
    name: 'El lunes ha sido despedido',
    description: 'La semana empieza el martes por decreto. Producción total ×1,3.',
    category: 'global',
    cost: 15000000,
    requirements: [{ type: 'buildingsTotal', value: 150 }],
    effects: [{ type: 'globalMult', value: 1.3 }],
    tags: [],
  },
  {
    id: 'selfPrinting',
    name: 'El papeleo se imprime solo',
    description: 'Los formularios se rellenan entre ellos. Producción total ×1,5 y +2 clics automáticos/s.',
    category: 'global',
    cost: 800000000,
    requirements: [{ type: 'department', id: 'multinational' }],
    effects: [{ type: 'globalMult', value: 1.5 }, { type: 'autoClick', value: 2 }],
    tags: [],
  },
  {
    id: 'accountingIllegal',
    name: 'La contabilidad es ilegal',
    description: 'Sin cuentas no hay pérdidas. Producción total ×1,5.',
    category: 'global',
    cost: 50000000000,
    requirements: [{ type: 'cycleTotal', value: 10000000000 }],
    effects: [{ type: 'globalMult', value: 1.5 }],
    tags: [],
  },
  {
    id: 'eternalFriday',
    name: 'Viernes eterno por decreto cósmico',
    description: 'Nadie trabaja, todo se produce. Producción total ×2.',
    category: 'global',
    cost: 50000000000000,
    requirements: [{ type: 'department', id: 'adminGod' }],
    effects: [{ type: 'globalMult', value: 2 }],
    tags: [],
  },

  // ── Especiales ──────────────────────────────────────────────────────
  {
    id: 'metaphoricMoney',
    name: 'La impresora imprime dinero, pero solo en sentido metafórico',
    description: 'Las impresoras ganan +5 % por cada otro edificio que poseas. Metafóricamente rentable.',
    category: 'special',
    cost: 200000,
    requirements: [{ type: 'building', id: 'printer', count: 15 }, { type: 'department', id: 'hellHR' }],
    effects: [{ type: 'synergy', target: 'printer', source: 'ALL', value: 0.05 }],
    tags: [],
  },
  {
    id: 'deferredPayments',
    name: 'El universo acepta pagos aplazados',
    description: 'Compra ahora, paga en otra vida. Edificios un 10 % más baratos.',
    category: 'special',
    cost: 3000000,
    requirements: [{ type: 'department', id: 'hellHR' }, { type: 'buildingsTotal', value: 75 }],
    effects: [{ type: 'buildingCostMult', value: 0.9 }],
    tags: [],
  },
  {
    id: 'physicsContract',
    name: 'Las leyes físicas han firmado un contrato',
    description: 'La gravedad trabaja a media jornada. +4 h de producción offline y +10 % de eficiencia offline.',
    category: 'special',
    cost: 100000000,
    requirements: [{ type: 'department', id: 'multinational' }],
    effects: [{ type: 'offlineHours', value: 4 }, { type: 'offlineEfficiency', value: 0.1 }],
    tags: [],
  },
  {
    id: 'timeInForms',
    name: 'El tiempo se mide en formularios',
    description: 'Un minuto = 3 sellos. Bonificaciones temporales un 50 % más largas y formularios dorados más frecuentes.',
    category: 'special',
    cost: 500000000,
    requirements: [{ type: 'upgrade', id: 'physicsContract' }],
    effects: [{ type: 'tempDurationMult', value: 1.5 }, { type: 'goldenFrequencyMult', value: 0.8 }],
    tags: [],
  },

  // ── Sinergias (Recursos Humanos del infierno) ───────────────────────
  synergy('synPigeonIntern', 'Palomas mensajeras para becarios', 'Los becarios ganan +3 % por cada paloma. Nadie sabe qué dicen los mensajes.', 300000,
    [{ type: 'building', id: 'pigeon', count: 15 }, { type: 'building', id: 'intern', count: 15 }], 'intern', 'pigeon', 0.03),
  synergy('synBossPigeon', 'Los clones dan de comer a las palomas', 'Las palomas ganan +2 % por cada clon del jefe.', 5000000,
    [{ type: 'building', id: 'bossClone', count: 10 }, { type: 'building', id: 'pigeon', count: 25 }], 'pigeon', 'bossClone', 0.02),
  synergy('synReactorClone', 'Reactor refrigerado con sudor de clon', 'Los reactores ganan +2 % por cada clon del jefe.', 50000000,
    [{ type: 'building', id: 'bureaucracyReactor', count: 10 }, { type: 'building', id: 'bossClone', count: 20 }], 'bureaucracyReactor', 'bossClone', 0.02),
  synergy('synMeetingIntern', 'Becarios como público de reuniones', 'Las máquinas de reuniones ganan +1 % por cada becario.', 500000000,
    [{ type: 'building', id: 'meetingMachine', count: 10 }, { type: 'building', id: 'intern', count: 50 }], 'meetingMachine', 'intern', 0.01),

  // ── Final ───────────────────────────────────────────────────────────
  {
    id: 'form404B',
    name: 'Formulario 404-B (sellado y firmado)',
    description: 'Autoriza oficialmente el fin del mundo. Producción total ×3 y... bueno, el fin del mundo.',
    category: 'endgame',
    cost: 1e21,
    requirements: [{ type: 'department', id: 'adminGod' }, { type: 'building', id: 'apocalypseCallCenter', count: 10 }],
    effects: [{ type: 'globalMult', value: 3 }],
    tags: ['ending'],
  },
];

export const UPGRADE_IDS = UPGRADES.map((u) => u.id);

export const UPGRADES_BY_ID = Object.fromEntries(UPGRADES.map((u) => [u.id, u]));

export const UPGRADE_CATEGORIES = {
  click: 'Clics',
  building: 'Edificios',
  global: 'Producción global',
  special: 'Especial',
  synergy: 'Sinergia',
  endgame: 'Final',
};
