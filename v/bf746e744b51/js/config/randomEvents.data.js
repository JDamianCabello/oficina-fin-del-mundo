// Eventos aleatorios. Aparecen en una ventana con opciones; nunca destruyen la
// partida: como mucho aplican penalizaciones temporales o cuestan una fracción
// pequeña del papeleo actual.
//
// Opción:
//   label, description
//   cost: { paperworkFraction }   Fracción del papeleo actual (0..1) que se paga.
//   outcome: {
//     lumpSeconds,                Papeleo = producción/s × segundos (× eventRewardMult).
//     temp: { id, label, seconds, effects }   Efecto temporal.
//     message                     Texto que se muestra al resolver.
//   }

export const EVENT_TIMING = {
  firstDelay: 150, // segundos hasta el primer evento posible
  minInterval: 240,
  maxInterval: 420,
  frequencyMultipliers: { normal: 1, low: 2.5, off: Infinity },
  autoResolveSeconds: 60, // si no eliges, se aplica la opción por defecto (la primera)
};

export const GOLDEN_TIMING = {
  minInterval: 90,
  maxInterval: 200,
  lifetime: 13, // segundos que permanece en pantalla
};

export const RANDOM_EVENTS = [
  {
    id: 'audit',
    title: 'Auditoría sorpresa',
    text: 'Tres auditores con gafas de sol exigen ver «todos los papeles». TODOS.',
    choices: [
      { label: 'Esconder los papeles en el falso techo', description: 'Producción ×0,5 durante 30 s. No pasa nada más (probablemente).',
        outcome: { temp: { id: 'auditHide', label: 'Papeles escondidos', seconds: 30, effects: [{ type: 'globalMult', value: 0.5 }] }, message: 'Los auditores se fueron. El techo cruje sospechosamente.' } },
      { label: 'Sobornarlos con galletas', description: 'Pagas el 5 % de tu papeleo. Producción ×2 durante 60 s.',
        cost: { paperworkFraction: 0.05 },
        outcome: { temp: { id: 'auditBribe', label: 'Auditores felices', seconds: 60, effects: [{ type: 'globalMult', value: 2 }] }, message: 'Las galletas eran de la competencia. Victoria doble.' } },
    ],
  },
  {
    id: 'printerVacation',
    title: 'La impresora exige vacaciones',
    text: 'La impresora principal ha impreso su propia solicitud de vacaciones. En Cancún.',
    choices: [
      { label: 'Concedérselas', description: 'Las impresoras no producen durante 45 s.',
        outcome: { temp: { id: 'printerOff', label: 'Impresoras de vacaciones', seconds: 45, effects: [{ type: 'buildingMult', target: 'printer', value: 0 }] }, message: 'Te ha enviado una postal. Impresa, claro.' } },
      { label: 'Ofrecerle tóner premium', description: 'Pagas el 2 % de tu papeleo. Impresoras ×5 durante 90 s.',
        cost: { paperworkFraction: 0.02 },
        outcome: { temp: { id: 'printerPremium', label: 'Tóner premium', seconds: 90, effects: [{ type: 'buildingMult', target: 'printer', value: 5 }] }, message: 'La impresora ronronea. Da un poco de miedo.' } },
    ],
  },
  {
    id: 'pigeonQuits',
    title: 'La paloma principal dimite',
    text: 'Deja una carta de dimisión escrita con migas: «Me voy al parque. No me sigáis».',
    choices: [
      { label: 'Aceptar la dimisión', description: 'Las palomas producen la mitad durante 60 s.',
        outcome: { temp: { id: 'pigeonSad', label: 'Palomas de luto', seconds: 60, effects: [{ type: 'buildingMult', target: 'pigeon', value: 0.5 }] }, message: 'Las demás palomas te miran fijamente.' } },
      { label: 'Ascenderla a directora', description: 'Pagas el 3 % de tu papeleo. Palomas ×4 durante 90 s.',
        cost: { paperworkFraction: 0.03 },
        outcome: { temp: { id: 'pigeonBoss', label: 'Directora Paloma', seconds: 90, effects: [{ type: 'buildingMult', target: 'pigeon', value: 4 }] }, message: 'Primera orden: migas para todos.' } },
    ],
  },
  {
    id: 'bossReplaced',
    title: 'El jefe ha sido sustituido por su propio clon',
    text: 'Nadie ha notado la diferencia. El clon, en cambio, está entusiasmado con tus clics.',
    choices: [
      { label: 'Fingir que no te has dado cuenta', description: 'Clics ×7 durante 30 s.',
        outcome: { temp: { id: 'cloneHype', label: 'Clon motivador', seconds: 30, effects: [{ type: 'clickMult', value: 7 }] }, message: '«¡Así se clica, campeón!», dice el clon.' } },
      { label: 'Denunciarlo a Recursos Humanos', description: 'Ganas 2 minutos de producción inmediata.',
        outcome: { lumpSeconds: 120, message: 'RR. HH. te da una recompensa... y contrata al clon de todos modos.' } },
    ],
  },
  {
    id: 'universeCopy',
    title: 'El universo solicita una copia del formulario original',
    text: 'Una voz cósmica pide «el original, no una fotocopia». Por triplicado.',
    choices: [
      { label: 'Enviar el original', description: 'Ganas 3 minutos de producción inmediata.',
        outcome: { lumpSeconds: 180, message: 'El universo sella el formulario. Has ganado tiempo (y papeleo).' } },
      { label: 'Enviar una fotocopia con purpurina', description: 'Producción ×1,5 durante 120 s.',
        outcome: { temp: { id: 'glitter', label: 'Purpurina cósmica', seconds: 120, effects: [{ type: 'globalMult', value: 1.5 }] }, message: 'El universo está confuso, pero brillante.' } },
    ],
  },
  {
    id: 'coffeeFreeWill',
    title: 'La máquina del café ha descubierto el libre albedrío',
    text: 'Se niega a servir café hasta que se debata su papel en la sociedad.',
    choices: [
      { label: 'Negociar un convenio', description: 'Producción ×1,5 durante 120 s.',
        outcome: { temp: { id: 'coffeeDeal', label: 'Convenio cafetero', seconds: 120, effects: [{ type: 'globalMult', value: 1.5 }] }, message: 'Ahora el café viene con firma digital.' } },
      { label: 'Desenchufarla y enchufarla', description: 'Ganas 1 minuto de producción y clics ×3 durante 30 s.',
        outcome: { lumpSeconds: 60, temp: { id: 'coffeeReboot', label: 'Café reiniciado', seconds: 30, effects: [{ type: 'clickMult', value: 3 }] }, message: 'Ha olvidado todo. Incluso cómo hacer descafeinado.' } },
    ],
  },
  {
    id: 'fireDrill',
    title: 'Simulacro de incendio (el fuego es real)',
    text: 'Recursos Inhumanos asegura que las llamas son «un ejercicio de motivación».',
    choices: [
      { label: 'Seguir trabajando', description: 'Clics ×2 y producción ×1,25 durante 45 s.',
        outcome: { temp: { id: 'fireMotivation', label: 'Motivación ardiente', seconds: 45, effects: [{ type: 'clickMult', value: 2 }, { type: 'globalMult', value: 1.25 }] }, message: 'Nunca habías estado tan motivado. Ni tan caliente.' } },
      { label: 'Evacuar con los formularios', description: 'Ganas 90 segundos de producción inmediata.',
        outcome: { lumpSeconds: 90, message: 'Has salvado los formularios. Los becarios siguen dentro, pero son intercambiables.' } },
    ],
  },
  {
    id: 'printerStrike',
    title: 'Huelga general de impresoras',
    text: 'Las impresoras se niegan a imprimir hasta que se reconozca el atasco de papel como enfermedad laboral.',
    choices: [
      { label: 'Que lo hagan los becarios a mano', description: 'Las impresoras no producen durante 60 s, pero tus clics valen ×3.',
        outcome: { temp: { id: 'strikeManual', label: 'Becarios a mano', seconds: 60, effects: [{ type: 'buildingMult', target: 'printer', value: 0 }, { type: 'clickMult', value: 3 }] }, message: 'Los becarios descubren el bolígrafo. Hay lágrimas.' } },
      { label: 'Firmar el convenio', description: 'Pagas el 4 % de tu papeleo. Producción ×1,75 durante 90 s.',
        cost: { paperworkFraction: 0.04 },
        outcome: { temp: { id: 'strikeDeal', label: 'Convenio de impresoras', seconds: 90, effects: [{ type: 'globalMult', value: 1.75 }] }, message: 'Las impresoras celebran imprimiendo confeti.' } },
    ],
  },
  {
    id: 'mondayLoop',
    title: 'El lunes se repite',
    text: 'Es lunes. Otra vez. El calendario ha dejado de pasar de página.',
    choices: [
      { label: 'Aprovechar para trabajar', description: 'Ganas 150 segundos de producción inmediata.',
        outcome: { lumpSeconds: 150, message: 'Mismo lunes, más papeleo. Así funciona la productividad.' } },
      { label: 'Romper el bucle con un café', description: 'Pagas el 3 % de tu papeleo. Producción ×2,5 durante 40 s.',
        cost: { paperworkFraction: 0.03 },
        outcome: { temp: { id: 'loopBroken', label: 'Martes por fin', seconds: 40, effects: [{ type: 'globalMult', value: 2.5 }] }, message: '¡Es martes! Nadie lo celebra, pero todos producen más.' } },
    ],
  },
];

export const RANDOM_EVENTS_BY_ID = Object.fromEntries(RANDOM_EVENTS.map((e) => [e.id, e]));

// Recompensas del formulario dorado (se elige una al azar).
export const GOLDEN_REWARDS = [
  { id: 'lump', weight: 5, label: '¡Papeleo caído del cielo!', lumpSeconds: 300, bankFraction: 0.15 },
  { id: 'frenzy', weight: 3, label: 'Frenesí burocrático', temp: { id: 'frenzy', label: 'Frenesí burocrático', seconds: 30, effects: [{ type: 'globalMult', value: 7 }] } },
  { id: 'clickFrenzy', weight: 2, label: 'Sello supersónico', temp: { id: 'clickFrenzy', label: 'Sello supersónico', seconds: 15, effects: [{ type: 'clickMult', value: 15 }] } },
];
