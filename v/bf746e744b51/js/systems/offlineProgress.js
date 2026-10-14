// Progreso offline: una sola fórmula, sin simular ticks.
//
//   segundos  = min(ahora − último guardado válido, horasMáx × 3600)
//   ganancia  = (pps sin efectos temporales + clics automáticos) × segundos × eficiencia
//
// Protecciones: sin fecha válida no hay recompensa; si el reloj ha ido hacia
// atrás tampoco; ausencias de menos de MIN_OFFLINE_SECONDS se ignoran.

import { addPaperwork, getModifiers, getPps, getExpectedClickValue, getAutoClickRate, finiteOr } from '../core/economy.js';
import { tickTempEffects } from './effects.js';

export const MIN_OFFLINE_SECONDS = 10;

export function computeOfflineGain(state, now = Date.now()) {
  const last = state.lastSavedAt;
  const mods = getModifiers(state, { includeTemp: false });
  const maxSeconds = Math.max(0, mods.offlineHours) * 3600;
  const result = { seconds: 0, elapsed: 0, gain: 0, efficiency: mods.offlineEfficiency, maxSeconds, capped: false, reason: 'ok' };

  if (typeof last !== 'number' || !Number.isFinite(last) || last <= 0) return { ...result, reason: 'noSave' };
  if (typeof now !== 'number' || !Number.isFinite(now)) return { ...result, reason: 'invalidNow' };
  const elapsed = (now - last) / 1000;
  if (elapsed < 0) return { ...result, reason: 'clockBackwards' };
  if (elapsed < MIN_OFFLINE_SECONDS) return { ...result, elapsed, reason: 'tooShort' };

  const seconds = Math.min(elapsed, maxSeconds);
  const rate = getPps(state, { includeTemp: false, forceIdle: true })
    + getExpectedClickValue(state, { includeTemp: false }) * getAutoClickRate(state);
  const gain = finiteOr(rate * seconds * mods.offlineEfficiency, 0);
  return { ...result, elapsed, seconds, gain, capped: elapsed > maxSeconds };
}

/** Aplica el progreso offline y devuelve el resumen para mostrarlo. */
export function applyOfflineProgress(state, now = Date.now()) {
  const summary = computeOfflineGain(state, now);
  if (summary.seconds <= 0) return summary;
  addPaperwork(state, summary.gain, 'offline');
  state.statistics.offlineSecondsTotal += summary.seconds;
  // Los efectos temporales caducan también mientras no estás.
  tickTempEffects(state, summary.seconds);
  if (state.temp.golden) state.temp.golden = null;
  return summary;
}
