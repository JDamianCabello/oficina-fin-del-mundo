// Eventos aleatorios y formularios dorados.
// Los temporizadores viven en state.temp y avanzan con la simulación, no con
// el reloj de pared, así que pausar la pestaña no genera ráfagas de eventos.

import { RANDOM_EVENTS, RANDOM_EVENTS_BY_ID, EVENT_TIMING, GOLDEN_TIMING, GOLDEN_REWARDS } from '../config/randomEvents.data.js';
import { addPaperwork, getModifiers, getPps, spendPaperwork, finiteOr } from '../core/economy.js';
import { isFeatureUnlocked } from '../core/progression.js';
import { addTempEffect } from './effects.js';
import { emit } from '../core/events.js';

function randomBetween(min, max, rng) {
  return min + (max - min) * rng();
}

function eventFrequencyMultiplier(state) {
  return EVENT_TIMING.frequencyMultipliers[state.settings.eventFrequency] ?? 1;
}

export function scheduleNextEvent(state, rng = Math.random) {
  const mult = eventFrequencyMultiplier(state);
  state.temp.nextEventIn = Number.isFinite(mult)
    ? randomBetween(EVENT_TIMING.minInterval, EVENT_TIMING.maxInterval, rng) * mult
    : EVENT_TIMING.maxInterval;
}

/** Avanza el temporizador de eventos. Devuelve el id del evento lanzado o null. */
export function updateRandomEvents(state, dt, rng = Math.random) {
  const temp = state.temp;
  if (temp.activeEvent) {
    temp.activeEvent.remaining -= dt;
    if (temp.activeEvent.remaining <= 0) resolveEvent(state, 0, { auto: true });
    return null;
  }
  if (!isFeatureUnlocked(state, 'events') || state.settings.eventFrequency === 'off') return null;
  temp.nextEventIn -= dt;
  if (temp.nextEventIn > 0) return null;
  const event = RANDOM_EVENTS[Math.floor(rng() * RANDOM_EVENTS.length) % RANDOM_EVENTS.length];
  temp.activeEvent = { id: event.id, remaining: EVENT_TIMING.autoResolveSeconds };
  scheduleNextEvent(state, rng);
  emit('randomEvent', { id: event.id });
  return event.id;
}

function lumpFor(state, seconds) {
  const mods = getModifiers(state, { includeTemp: false });
  return finiteOr(getPps(state, { includeTemp: false }) * seconds * mods.eventRewardMult, 0);
}

/** Coste real (en papeleo) de una opción. */
export function getChoiceCost(state, choice) {
  const fraction = choice.cost?.paperworkFraction ?? 0;
  return Math.floor(state.resources.paperwork * Math.max(0, Math.min(1, fraction)));
}

export function resolveEvent(state, choiceIndex, { auto = false } = {}) {
  const active = state.temp.activeEvent;
  if (!active) return { ok: false, reason: 'none' };
  const event = RANDOM_EVENTS_BY_ID[active.id];
  const choice = event?.choices[choiceIndex];
  if (!event || !choice) {
    state.temp.activeEvent = null;
    return { ok: false, reason: 'invalid' };
  }
  const cost = getChoiceCost(state, choice);
  if (cost > 0 && !spendPaperwork(state, cost)) return { ok: false, reason: 'funds' };
  let amount = 0;
  if (choice.outcome.lumpSeconds) amount = addPaperwork(state, lumpFor(state, choice.outcome.lumpSeconds), 'reward');
  if (choice.outcome.temp) addTempEffect(state, choice.outcome.temp);
  state.temp.activeEvent = null;
  state.statistics.eventsResolved += 1;
  const message = choice.outcome.message;
  emit('randomEventResolved', { id: event.id, choiceIndex, message, amount, auto });
  return { ok: true, amount, message };
}

// ─── Formularios dorados ──────────────────────────────────────────────────

export function updateGolden(state, dt, rng = Math.random) {
  const temp = state.temp;
  if (temp.golden) {
    temp.golden.remaining -= dt;
    if (temp.golden.remaining <= 0) temp.golden = null;
    return false;
  }
  if (!isFeatureUnlocked(state, 'golden')) return false;
  temp.nextGoldenIn -= dt;
  if (temp.nextGoldenIn > 0) return false;
  const mods = getModifiers(state, { includeTemp: false });
  temp.nextGoldenIn = randomBetween(GOLDEN_TIMING.minInterval, GOLDEN_TIMING.maxInterval, rng) * mods.goldenFrequencyMult;
  temp.golden = { remaining: GOLDEN_TIMING.lifetime, x: 0.15 + rng() * 0.7, y: 0.2 + rng() * 0.5 };
  emit('goldenSpawn', { ...temp.golden });
  return true;
}

export function clickGolden(state, rng = Math.random) {
  if (!state.temp.golden) return { ok: false };
  state.temp.golden = null;
  const totalWeight = GOLDEN_REWARDS.reduce((s, r) => s + r.weight, 0);
  let roll = rng() * totalWeight;
  let reward = GOLDEN_REWARDS[0];
  for (const r of GOLDEN_REWARDS) {
    roll -= r.weight;
    if (roll <= 0) { reward = r; break; }
  }
  let amount = 0;
  if (reward.lumpSeconds) {
    const mods = getModifiers(state, { includeTemp: false });
    const pps = getPps(state, { includeTemp: false });
    const fromBank = state.resources.paperwork * reward.bankFraction;
    const base = Math.max(pps * 30, Math.min(pps * reward.lumpSeconds, fromBank)) + 13;
    amount = addPaperwork(state, finiteOr(base * mods.eventRewardMult, 0), 'reward');
  }
  if (reward.temp) addTempEffect(state, reward.temp);
  state.statistics.goldenFormsClicked += 1;
  emit('goldenClicked', { label: reward.label, amount });
  return { ok: true, reward: reward.id, amount };
}
