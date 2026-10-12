// Comprobación central de logros.
//
// Para no evaluar todo en cada fotograma, cada condición pertenece a un «tema».
// El juego marca temas como sucios cuando cambia algo relacionado (compras,
// clics, ascensos...) y una comprobación periódica cubre los temas continuos
// (papeleo producido, producción/s, estadísticas de tiempo).

import { ACHIEVEMENTS } from '../config/achievements.data.js';
import { checkRequirement } from '../core/progression.js';
import { emit } from '../core/events.js';

const TOPIC_BY_TYPE = {
  lifetime: 'paperwork',
  cycleTotal: 'paperwork',
  pps: 'pps',
  clicks: 'clicks',
  stat: 'stats',
  building: 'buildings',
  buildingsTotal: 'buildings',
  upgrade: 'upgrades',
  upgradesOwned: 'upgrades',
  upgradeTagCount: 'upgrades',
  department: 'departments',
  prestiges: 'prestige',
  mergers: 'prestige',
  boardPerks: 'prestige',
  talent: 'talents',
  talentsOwned: 'talents',
  talentBranches: 'talents',
  secret: 'secrets',
  achievement: 'achievements',
};

export const ALL_TOPICS = [...new Set(Object.values(TOPIC_BY_TYPE))];

/** Temas que se comprueban periódicamente (cambian de forma continua). */
export const PERIODIC_TOPICS = ['paperwork', 'pps', 'stats', 'clicks'];

export function topicOf(achievement) {
  return TOPIC_BY_TYPE[achievement.condition.type] ?? 'stats';
}

export function isAchievementUnlocked(state, id) {
  return id in state.achievements;
}

/** Suma Influencia ganada (de logros o de ascensos). */
export function grantInfluence(state, amount) {
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  state.resources.influence += amount;
  state.resources.totalInfluenceEarned += amount;
  return amount;
}

/**
 * Comprueba los logros de los temas indicados (o todos si `topics` es null).
 * Desbloquea los que se cumplan, entrega su recompensa única y devuelve sus ids.
 */
export function checkAchievements(state, topics = null, ctx = {}, now = Date.now()) {
  const wanted = topics ? new Set(topics) : null;
  const unlocked = [];
  for (const a of ACHIEVEMENTS) {
    if (a.id in state.achievements) continue;
    if (wanted && !wanted.has(topicOf(a))) continue;
    if (!checkRequirement(state, a.condition, ctx)) continue;
    // Marcar ANTES de pagar: aunque algo fallase después, nunca se paga dos veces.
    state.achievements[a.id] = now;
    if (a.reward?.influence) grantInfluence(state, a.reward.influence);
    unlocked.push(a.id);
  }
  for (const id of unlocked) emit('achievementUnlocked', { id });
  if (unlocked.length) emit('structureChanged', {});
  return unlocked;
}

/** Registra un secreto y comprueba los logros secretos. */
export function discoverSecret(state, id) {
  if (state.secrets.includes(id)) return [];
  state.secrets.push(id);
  emit('secretFound', { id });
  return checkAchievements(state, ['secrets']);
}
