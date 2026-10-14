// Misiones: objetivos cortos del ciclo actual (se reinician al ascender).
// Se muestran en orden; solo las MISSION_SLOTS primeras sin reclamar están activas.
// Usan solo condiciones del ciclo (edificios, papeleo del ciclo, producción,
// mejoras del ciclo) para que repetirlas tras un ascenso tenga sentido.
//
// Recompensa:
//   { ppsSeconds, min }  Papeleo = max(min, producción/s × ppsSeconds).
//   { temp: { id, label, seconds, effects } }  Bonificación temporal.

export const MISSION_SLOTS = 3;

export const MISSIONS = [
  { id: 'mInterns5', name: 'Contrata cinco becarios', description: 'Nadie cobra, todos sonríen.', requirement: { type: 'building', id: 'intern', count: 5 }, reward: { ppsSeconds: 30, min: 150 } },
  { id: 'mPrinters10', name: 'Diez impresoras y ningún técnico', description: 'Compra 10 impresoras.', requirement: { type: 'building', id: 'printer', count: 10 }, reward: { ppsSeconds: 45, min: 300 } },
  { id: 'mPaper10k', name: 'Produce 10.000 documentos', description: 'Papeleo producido en este ciclo.', requirement: { type: 'cycleTotal', value: 1e4 }, reward: { ppsSeconds: 45, min: 1000 } },
  { id: 'mPigeons5', name: 'Palomar oficial', description: 'Ten 5 palomas contables.', requirement: { type: 'building', id: 'pigeon', count: 5 }, reward: { ppsSeconds: 60, min: 1500 } },
  { id: 'mUpgrades5', name: 'Plan de carrera', description: 'Ten 5 mejoras compradas en este ciclo.', requirement: { type: 'upgradesOwned', value: 5 },
    reward: { temp: { id: 'selfEsteem', label: 'Subidón de autoestima', seconds: 60, effects: [{ type: 'globalMult', value: 2 }] } } },
  { id: 'mPps100', name: 'Alcanza 100 de papeleo por segundo', description: 'El ritmo de una oficina decente.', requirement: { type: 'pps', value: 100 }, reward: { ppsSeconds: 60, min: 3000 } },
  { id: 'mBuildings50', name: 'Plantilla de cincuenta', description: 'Ten 50 edificios en total.', requirement: { type: 'buildingsTotal', value: 50 }, reward: { ppsSeconds: 60, min: 5000 } },
  { id: 'mBoss1', name: 'Clona al jefe', description: 'Con permiso de nadie.', requirement: { type: 'building', id: 'bossClone', count: 1 }, reward: { ppsSeconds: 60, min: 8000 } },
  { id: 'mPigeons25', name: 'Bandada auditora', description: 'Ten 25 palomas contables.', requirement: { type: 'building', id: 'pigeon', count: 25 }, reward: { ppsSeconds: 75, min: 20000 } },
  { id: 'mPaper1M', name: 'El primer millón', description: 'Produce 1 M de documentos en este ciclo.', requirement: { type: 'cycleTotal', value: 1e6 }, reward: { ppsSeconds: 75, min: 50000 } },
  { id: 'mReactor1', name: 'Enciende el reactor', description: 'Ten un reactor burocrático.', requirement: { type: 'building', id: 'bureaucracyReactor', count: 1 },
    reward: { temp: { id: 'meltdown', label: 'Mini fusión del núcleo', seconds: 45, effects: [{ type: 'globalMult', value: 2 }] } } },
  { id: 'mBuildings100', name: 'Organigrama de cien', description: 'Ten 100 edificios en total.', requirement: { type: 'buildingsTotal', value: 100 }, reward: { ppsSeconds: 90, min: 100000 } },
  { id: 'mPps10k', name: 'Alcanza 10.000 de papeleo por segundo', description: 'Las palomas ya no dan abasto.', requirement: { type: 'pps', value: 1e4 }, reward: { ppsSeconds: 90, min: 300000 } },
  { id: 'mBoss25', name: 'Clonación en masa', description: 'Ten 25 clones del jefe.', requirement: { type: 'building', id: 'bossClone', count: 25 }, reward: { ppsSeconds: 90, min: 1e6 } },
  { id: 'mPaper100M', name: 'Cien millones de folios', description: 'Produce 100 M de documentos en este ciclo.', requirement: { type: 'cycleTotal', value: 1e8 }, reward: { ppsSeconds: 90, min: 3e6 } },
  { id: 'mMeeting5', name: 'Agenda completa', description: 'Ten 5 máquinas de hacer reuniones.', requirement: { type: 'building', id: 'meetingMachine', count: 5 },
    reward: { temp: { id: 'agenda', label: 'Agenda vacía', seconds: 60, effects: [{ type: 'globalMult', value: 2 }] } } },
  { id: 'mIR1', name: 'Recursos Inhumanos operativos', description: 'Ten un departamento de Recursos Inhumanos.', requirement: { type: 'building', id: 'inhumanResources', count: 1 }, reward: { ppsSeconds: 90, min: 5e6 } },
  { id: 'mPps1M', name: 'Alcanza 1 M de papeleo por segundo', description: 'Ya contamos los folios por toneladas.', requirement: { type: 'pps', value: 1e6 }, reward: { ppsSeconds: 90, min: 3e7 } },
  { id: 'mDP1', name: 'Imprime en otra dimensión', description: 'Ten una impresora dimensional.', requirement: { type: 'building', id: 'dimensionalPrinter', count: 1 }, reward: { ppsSeconds: 90, min: 5e7 } },
  { id: 'mBuildings300', name: 'Polígono corporativo', description: 'Ten 300 edificios en total.', requirement: { type: 'buildingsTotal', value: 300 }, reward: { ppsSeconds: 120, min: 1e8 } },
  { id: 'mUF1', name: 'Hágase la luz (con factura)', description: 'Ten una fábrica de universos.', requirement: { type: 'building', id: 'universeFactory', count: 1 },
    reward: { temp: { id: 'bigBang', label: 'Big Bang administrativo', seconds: 60, effects: [{ type: 'globalMult', value: 3 }] } } },
  { id: 'mPaper1T', name: 'Un billón de trámites', description: 'Produce 1 T de documentos en este ciclo.', requirement: { type: 'cycleTotal', value: 1e12 }, reward: { ppsSeconds: 120, min: 1e10 } },
  { id: 'mGod1', name: 'Dios en el rack', description: 'Ten un servidor que contiene a Dios.', requirement: { type: 'building', id: 'godServer', count: 1 }, reward: { ppsSeconds: 120, min: 1e11 } },
  { id: 'mAC1', name: 'Pulse 1 para el apocalipsis', description: 'Ten un centro de atención al apocalipsis.', requirement: { type: 'building', id: 'apocalypseCallCenter', count: 1 }, reward: { ppsSeconds: 150, min: 1e13 } },
];

export const MISSION_IDS = MISSIONS.map((m) => m.id);

export const MISSIONS_BY_ID = Object.fromEntries(MISSIONS.map((m) => [m.id, m]));
