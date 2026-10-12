// Migraciones de partidas guardadas entre versiones del esquema.
// Cada migración recibe un objeto con `version === n` y devuelve uno con
// `version === n + 1`. Nunca lanzan por datos parciales: rellenan valores por
// defecto y dejan la validación estricta a sanitizeState().

import { SAVE_VERSION } from '../core/state.js';

export const MIGRATIONS = {
  // v1 → v2: esquema inicial del documento de diseño.
  //   - Se añade resources.cycleTotal (papeleo del ciclo actual).
  //   - achievements pasa de array de ids a objeto { id: marcaTemporal }.
  //   - Se añaden secrets, missions, temp y flags.
  1(save) {
    const out = { ...save, version: 2 };
    const resources = { ...(save.resources ?? {}) };
    if (typeof resources.cycleTotal !== 'number') {
      const prestiges = save.statistics?.totalPrestiges ?? 0;
      // Sin prestigios previos, todo lo producido pertenece al ciclo actual.
      resources.cycleTotal = prestiges > 0 ? resources.paperwork ?? 0 : resources.lifetimePaperwork ?? 0;
    }
    out.resources = resources;
    if (Array.isArray(save.achievements)) {
      const ts = typeof save.lastSavedAt === 'number' && save.lastSavedAt > 0 ? save.lastSavedAt : Date.now();
      out.achievements = Object.fromEntries(save.achievements.filter((id) => typeof id === 'string').map((id) => [id, ts]));
    }
    out.secrets = Array.isArray(save.secrets) ? save.secrets : [];
    out.missions = save.missions ?? { claimed: [] };
    out.flags = save.flags ?? { endingSeen: false };
    // `temp` se deja ausente: sanitizeState crea uno nuevo.
    return out;
  },
  // v2 → v3: segunda capa de prestigio (Acciones y Consejo).
  2(save) {
    const resources = { ...(save.resources ?? {}) };
    if (typeof resources.shares !== 'number') resources.shares = 0;
    if (typeof resources.totalSharesEarned !== 'number') resources.totalSharesEarned = 0;
    const statistics = { ...(save.statistics ?? {}) };
    if (typeof statistics.totalMergers !== 'number') statistics.totalMergers = 0;
    return { ...save, version: 3, resources, statistics, board: Array.isArray(save.board) ? save.board : [] };
  },
};

/** Aplica las migraciones necesarias hasta SAVE_VERSION. */
export function migrate(save) {
  if (!save || typeof save !== 'object') throw new Error('La partida no es un objeto.');
  let current = save;
  let version = Number.isInteger(current.version) ? current.version : 1;
  if (version > SAVE_VERSION) throw new Error(`La partida es de una versión más nueva (${version}) que el juego (${SAVE_VERSION}).`);
  if (version < 1) throw new Error('Versión de partida no válida.');
  current = { ...current, version };
  while (version < SAVE_VERSION) {
    const step = MIGRATIONS[version];
    if (!step) throw new Error(`No existe migración desde la versión ${version}.`);
    current = step(current);
    version = current.version;
  }
  return current;
}
