// Misiones del ciclo: las primeras MISSION_SLOTS sin reclamar están activas.

import { MISSIONS, MISSIONS_BY_ID, MISSION_SLOTS } from '../config/missions.data.js';
import { addPaperwork, getModifiers, getPps } from '../core/economy.js';
import { checkRequirement, isFeatureUnlocked } from '../core/progression.js';
import { addTempEffect } from './effects.js';
import { emit } from '../core/events.js';

export function getActiveMissions(state) {
  if (!isFeatureUnlocked(state, 'missions')) return [];
  return MISSIONS.filter((m) => !state.missions.claimed.includes(m.id)).slice(0, MISSION_SLOTS);
}

export function isMissionComplete(state, id, ctx) {
  const m = MISSIONS_BY_ID[id];
  return Boolean(m) && checkRequirement(state, m.requirement, ctx);
}

/** Papeleo que daría la recompensa ahora mismo (0 si la recompensa es temporal). */
export function getMissionRewardAmount(state, mission) {
  const r = mission.reward;
  if (!r.ppsSeconds && !r.min) return 0;
  const mods = getModifiers(state, { includeTemp: false });
  const base = Math.max(r.min ?? 0, getPps(state, { includeTemp: false }) * (r.ppsSeconds ?? 0));
  return base * mods.missionRewardMult;
}

export function describeMissionReward(mission) {
  if (mission.reward.temp) {
    const t = mission.reward.temp;
    return `${t.label} (${t.seconds} s)`;
  }
  return `${mission.reward.ppsSeconds} s de producción (mín. ${mission.reward.min})`;
}

export function claimMission(state, id, ctx) {
  const m = MISSIONS_BY_ID[id];
  if (!m) return { ok: false, reason: 'unknown' };
  if (state.missions.claimed.includes(id)) return { ok: false, reason: 'claimed' };
  if (!getActiveMissions(state).some((a) => a.id === id)) return { ok: false, reason: 'inactive' };
  if (!checkRequirement(state, m.requirement, ctx)) return { ok: false, reason: 'incomplete' };

  const amount = getMissionRewardAmount(state, m);
  state.missions.claimed.push(id);
  state.statistics.missionsCompleted += 1;
  if (amount > 0) addPaperwork(state, amount, 'reward');
  if (m.reward.temp) addTempEffect(state, m.reward.temp);
  emit('missionClaimed', { id, amount });
  emit('structureChanged', {});
  return { ok: true, amount };
}
