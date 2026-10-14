// Bus de eventos mínimo para desacoplar la lógica del juego de la interfaz.
// La lógica emite hechos («se compró un edificio») y la interfaz decide cómo
// mostrarlos (partículas, sonidos, notificaciones). Nunca al revés.

const listeners = new Map();

export function on(type, handler) {
  if (!listeners.has(type)) listeners.set(type, new Set());
  listeners.get(type).add(handler);
  return () => off(type, handler);
}

export function off(type, handler) {
  listeners.get(type)?.delete(handler);
}

export function emit(type, payload) {
  const set = listeners.get(type);
  if (!set) return;
  for (const handler of [...set]) {
    try {
      handler(payload);
    } catch (err) {
      console.error(`[events] Error en el manejador de «${type}»`, err);
    }
  }
}

export function clearAll() {
  listeners.clear();
}

// Tipos de eventos usados en el juego (documentación):
//   'click'             { amount, crit }
//   'buildingBought'    { id, amount, cost }
//   'upgradeBought'     { id }
//   'talentBought'      { id }
//   'achievementUnlocked' { id }
//   'departmentUnlocked'  { id }
//   'missionClaimed'    { id, amount }
//   'prestige'          { gained }
//   'randomEvent'       { id }
//   'randomEventResolved' { id, choiceIndex, message }
//   'goldenSpawn'       { lifetime }
//   'goldenClicked'     { label, amount }
//   'tempEffectStarted' { id, label }
//   'tempEffectEnded'   { id, label }
//   'structureChanged'  {}  (algo cambió que requiere redibujar listas)
//   'secretFound'       { id }
//   'saveStatus'        { ok, message }
