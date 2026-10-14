// Logros permanentes (sobreviven al prestigio).
//
// `condition` usa el formato de requisitos de departments.data.js, más:
//   { type: 'stat', key, value }            Estadística >= valor.
//   { type: 'upgradeTagCount', tag, value }  Mejoras compradas con esa etiqueta.
//   { type: 'secret', id }                   Secreto descubierto.
//   { type: 'talentsOwned', value }          Talentos comprados.
//   { type: 'talentBranches', value }        Ramas con al menos un talento.
//
// Todo logro desbloqueado da +1 % de producción total (derivado, no se guarda).
// `reward.effects` son bonificaciones permanentes adicionales (derivadas del
// conjunto de logros desbloqueados, así que no pueden duplicarse).
// `reward.influence` es un pago único que se entrega en el instante del desbloqueo.

export const ACHIEVEMENTS = [
  { id: 'paper1k', name: 'El papeleo es mi pasión', description: 'Produce 1.000 documentos en total.', condition: { type: 'lifetime', value: 1e3 } },
  { id: 'paper1M', name: 'Un millón de folios y ni uno útil', description: 'Produce 1 M de documentos en total.', condition: { type: 'lifetime', value: 1e6 } },
  { id: 'paper1B', name: 'Deforestación administrativa', description: 'Produce 1 B de documentos en total.', condition: { type: 'lifetime', value: 1e9 } },
  { id: 'paper1T', name: 'El Amazonas pide explicaciones', description: 'Produce 1 T de documentos en total.', condition: { type: 'lifetime', value: 1e12 } },
  { id: 'paper1Qa', name: 'Papel infinito, paciencia finita', description: 'Produce 1 Qa de documentos en total.', condition: { type: 'lifetime', value: 1e15 } },

  { id: 'click1', name: 'Primer sello', description: 'Sella tu primer formulario a mano.', condition: { type: 'clicks', value: 1 } },
  { id: 'click100', name: 'Dedo calentito', description: 'Haz 100 clics manuales.', condition: { type: 'clicks', value: 100 } },
  { id: 'click1000', name: 'Síndrome del túnel carpiano', description: 'Haz 1.000 clics manuales.', condition: { type: 'clicks', value: 1000 },
    reward: { effects: [{ type: 'clickMult', value: 1.5 }], text: 'Clics ×1,5 para siempre.' } },
  { id: 'click10000', name: 'Tengo un problema', description: 'Haz 10.000 clics manuales.', condition: { type: 'clicks', value: 10000 },
    reward: { effects: [{ type: 'clickPps', value: 0.01 }], text: '+1 % de la producción por clic.' } },
  { id: 'employeeMonth', name: 'Empleado del mes', description: 'Produce 100.000 documentos solo con clics (manuales o automáticos).', condition: { type: 'stat', key: 'manualPaperwork', value: 1e5 },
    reward: { effects: [{ type: 'clickPps', value: 0.005 }], text: '+0,5 % de la producción por clic.' } },

  { id: 'coffeeBoss', name: 'El café era del jefe', description: 'Compra 5 mejoras relacionadas con el café.', condition: { type: 'upgradeTagCount', tag: 'coffee', value: 5 } },
  { id: 'meetingEmail', name: 'Reunión que pudo ser un correo', description: 'Compra «Reuniones que generan reuniones».', condition: { type: 'upgrade', id: 'meetingsBreed' } },

  { id: 'printerAlive', name: 'La impresora está viva', description: 'Alcanza 1.000 de papeleo por segundo.', condition: { type: 'pps', value: 1e3 } },
  { id: 'pps1M', name: 'Productividad sospechosa', description: 'Alcanza 1 M de papeleo por segundo.', condition: { type: 'pps', value: 1e6 } },
  { id: 'pps1B', name: 'Cadena de montaje cósmica', description: 'Alcanza 1 B de papeleo por segundo.', condition: { type: 'pps', value: 1e9 } },

  { id: 'pigeon100', name: 'La paloma sabe demasiado', description: 'Ten 100 palomas contables.', condition: { type: 'building', id: 'pigeon', count: 100 } },
  { id: 'intern100', name: 'Becarios hasta en el techo', description: 'Ten 100 becarios sin contrato.', condition: { type: 'building', id: 'intern', count: 100 } },
  { id: 'build100', name: 'Organigrama inabarcable', description: 'Ten 100 edificios en total.', condition: { type: 'buildingsTotal', value: 100 } },
  { id: 'build500', name: 'Esto ya es un polígono industrial', description: 'Ten 500 edificios en total.', condition: { type: 'buildingsTotal', value: 500 },
    reward: { effects: [{ type: 'buildingCostMult', value: 0.95 }], text: 'Edificios un 5 % más baratos.' } },

  { id: 'deptHell', name: 'Bienvenido al infierno (de RR. HH.)', description: 'Desbloquea Recursos Humanos del Infierno.', condition: { type: 'department', id: 'hellHR' } },
  { id: 'milestones10', name: 'Hitos de la empresa', description: 'Alcanza 10 hitos de edificios a la vez (10, 25, 50 o 100 unidades).', condition: { type: 'milestones', value: 10 } },
  { id: 'milestones40', name: 'Cultura corporativa de hitos', description: 'Alcanza 40 hitos de edificios a la vez.', condition: { type: 'milestones', value: 40 },
    reward: { effects: [{ type: 'globalMult', value: 1.25 }], text: 'Producción total ×1,25 para siempre.' } },
  { id: 'deptTime', name: 'Dietas del Jurásico', description: 'Desbloquea el nivel 7: Oficina de Gastos Temporales.', condition: { type: 'department', id: 'timeOffice' } },
  { id: 'deptVoid', name: 'Café para la nada', description: 'Desbloquea el nivel 10: la Sede en el Vacío Absoluto.', condition: { type: 'department', id: 'voidHQ' } },
  { id: 'deptEnd', name: 'El tiempo era un trámite', description: 'Desbloquea el nivel 12: El Despacho al Final del Tiempo.', condition: { type: 'department', id: 'endOfTime' } },
  { id: 'trueEnding', name: 'Apelación estimada', description: 'Compra el Formulario 405-C y recurre el fin del mundo.', condition: { type: 'upgrade', id: 'form405C' },
    reward: { effects: [{ type: 'globalMult', value: 3 }], text: 'Producción total ×3 para siempre.' } },
  { id: 'deptGod', name: 'Dios tiene un supervisor', description: 'Desbloquea el despacho del Dios Administrativo.', condition: { type: 'department', id: 'adminGod' } },

  { id: 'prestige1', name: 'Capitalismo dimensional', description: 'Asciende por primera vez.', condition: { type: 'prestiges', value: 1 },
    reward: { influence: 2, text: '+2 de Influencia (una sola vez).' } },
  { id: 'prestige5', name: 'Ascensor sin botón de bajada', description: 'Asciende 5 veces.', condition: { type: 'prestiges', value: 5 } },
  { id: 'prestige25', name: 'Ascensor espacial', description: 'Asciende 25 veces.', condition: { type: 'prestiges', value: 25 },
    reward: { effects: [{ type: 'influenceMult', value: 1.25 }], text: 'Influencia ×1,25 para siempre.' } },
  { id: 'merger1', name: 'Fusión hostil con la realidad', description: 'Fusiona la empresa con el multiverso por primera vez.', condition: { type: 'mergers', value: 1 },
    reward: { effects: [{ type: 'globalMult', value: 1.5 }], text: 'Producción total ×1,5 para siempre.' } },
  { id: 'merger5', name: 'Monopolio de todas las realidades', description: 'Fusiónate 5 veces.', condition: { type: 'mergers', value: 5 } },
  { id: 'boardFull', name: 'Consejo en pleno', description: 'Consigue todas las ventajas del Consejo de Administración.', condition: { type: 'boardPerks', value: 8 } },

  { id: 'talent1', name: 'Desarrollo profesional', description: 'Compra tu primer talento.', condition: { type: 'talentsOwned', value: 1 } },
  { id: 'talentBranches', name: 'Perfil polivalente', description: 'Ten al menos un talento en cada una de las 4 ramas.', condition: { type: 'talentBranches', value: 4 } },

  { id: 'golden1', name: 'Hallazgo dorado', description: 'Atrapa un formulario dorado.', condition: { type: 'stat', key: 'goldenFormsClicked', value: 1 } },
  { id: 'golden25', name: 'Coleccionista de burocracia', description: 'Atrapa 25 formularios dorados.', condition: { type: 'stat', key: 'goldenFormsClicked', value: 25 },
    reward: { effects: [{ type: 'eventRewardMult', value: 1.25 }], text: 'Recompensas de eventos y formularios ×1,25.' } },
  { id: 'events10', name: 'Superviviente de imprevistos', description: 'Resuelve 10 eventos aleatorios.', condition: { type: 'stat', key: 'eventsResolved', value: 10 } },
  { id: 'missions10', name: 'Cumplidor compulsivo', description: 'Completa 10 misiones.', condition: { type: 'stat', key: 'missionsCompleted', value: 10 } },
  { id: 'offline1h', name: 'Teletrabajo extremo', description: 'Acumula 1 hora de producción offline.', condition: { type: 'stat', key: 'offlineSecondsTotal', value: 3600 },
    reward: { effects: [{ type: 'offlineEfficiency', value: 0.05 }], text: '+5 % de eficiencia offline.' } },
  { id: 'playtime1h', name: 'Una hora que no vuelve', description: 'Juega durante una hora.', condition: { type: 'stat', key: 'playTimeSeconds', value: 3600 } },

  { id: 'secretLogo', name: 'No deberías estar viendo esto', description: 'Encuentra un secreto oculto en la oficina.', secret: true, condition: { type: 'secret', id: 'logo' },
    reward: { influence: 1, text: '+1 de Influencia (una sola vez).' } },
  { id: 'secret404', name: 'Error 404: logro no encontrado', description: 'Teclea el nombre del formulario más famoso de la empresa.', secret: true, condition: { type: 'secret', id: 'form404' } },
  { id: 'secretPigeon', name: 'No molestes a la paloma', description: 'Molesta 20 veces a la misma paloma.', secret: true, condition: { type: 'secret', id: 'pigeonPoke' } },

  { id: 'ending', name: 'Fin del mundo (aprobado)', description: 'Firma el formulario 404-B.', condition: { type: 'upgrade', id: 'form404B' },
    reward: { effects: [{ type: 'globalMult', value: 2 }], text: 'Producción total ×2 para siempre.' } },
];

export const ACHIEVEMENT_IDS = ACHIEVEMENTS.map((a) => a.id);

export const ACHIEVEMENTS_BY_ID = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]));

/** Bonificación de producción total por logro desbloqueado. */
export const ACHIEVEMENT_GLOBAL_BONUS = 0.01;
