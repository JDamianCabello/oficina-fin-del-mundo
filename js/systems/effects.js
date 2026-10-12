// Efectos temporales (bonificaciones y penalizaciones con duración).

import { getModifiers } from '../core/economy.js';
import { emit } from '../core/events.js';

const MAX_TEMP_EFFECTS = 12;

/** Un efecto es «positivo» si todos sus multiplicadores son ≥ 1. */
function isPositive(def) {
  return def.effects.every((e) => !(typeof e.value === 'number' && e.value < 1));
}

/**
 * Añade (o renueva) un efecto temporal. Las bonificaciones positivas se alargan
 * con tempDurationMult; las penalizaciones no. Si ya existe un efecto con el
 * mismo id se renueva su duración en lugar de apilarse.
 */
export function addTempEffect(state, def) {
  const mods = getModifiers(state, { includeTemp: false });
  const seconds = Math.max(1, def.seconds * (isPositive(def) ? mods.tempDurationMult : 1));
  const existing = state.temp.effects.find((e) => e.id === def.id);
  if (existing) {
    existing.remaining = Math.max(existing.remaining, seconds);
    existing.duration = Math.max(existing.duration, seconds);
    return existing;
  }
  if (state.temp.effects.length >= MAX_TEMP_EFFECTS) state.temp.effects.shift();
  const effect = {
    id: def.id,
    label: def.label,
    remaining: seconds,
    duration: seconds,
    effects: def.effects.map((e) => ({ ...e })),
  };
  state.temp.effects.push(effect);
  emit('tempEffectStarted', { id: effect.id, label: effect.label });
  return effect;
}

/** Descuenta tiempo y elimina los efectos caducados. Devuelve los caducados. */
export function tickTempEffects(state, dt) {
  if (!state.temp.effects.length) return [];
  const expired = [];
  for (const e of state.temp.effects) e.remaining -= dt;
  state.temp.effects = state.temp.effects.filter((e) => {
    if (e.remaining > 0) return true;
    expired.push(e);
    return false;
  });
  for (const e of expired) emit('tempEffectEnded', { id: e.id, label: e.label });
  return expired;
}
