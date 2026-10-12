// Simulación de balance: juega automáticamente con varias estrategias y muestra
// cuándo se alcanzan los hitos. Uso: node tests/tools/balance.mjs [horas]
//
// La IA compra siempre la opción con mejor «tiempo de recuperación»
// (espera hasta poder pagarla + coste / ganancia de ingresos), reclama
// misiones, resuelve eventos y asciende cuando la Influencia por minuto del
// ciclo deja de mejorar.

import { createInitialState } from '../../js/core/state.js';
import {
  performClick, getTotalRate, getExpectedClickValue, getBulkCost, getBuildingUnitProduction, invalidateModifiers,
} from '../../js/core/economy.js';
import { simulateStep, runChecks } from '../../js/core/gameLoop.js';
import { getUnlockedBuildings, buyBuilding } from '../../js/systems/buildings.js';
import { getAvailableUpgrades, buyUpgrade, getUpgradeCost } from '../../js/systems/upgrades.js';
import { getActiveMissions, claimMission, isMissionComplete } from '../../js/systems/missions.js';
import { resolveEvent, clickGolden } from '../../js/systems/randomEvents.js';
import { canPrestige, getPrestigeGain, performPrestige } from '../../js/systems/prestige.js';
import { buyTalent, getTalentStatus } from '../../js/systems/talents.js';
import { canMerge, getMergerGain, performMerger, buyBoardPerk, getBoardPerkStatus } from '../../js/systems/merger.js';
import { BOARD_PERKS } from '../../js/config/board.data.js';
import { TALENTS } from '../../js/config/talents.data.js';
import { formatNumber, formatDuration } from '../../js/utils/format.js';

export const STRATEGIES = {
  balanced: { cps: 2, branches: ['exploiter', 'lazy', 'scientist', 'villain'], golden: true },
  clicker: { cps: 5, branches: ['lazy', 'exploiter', 'scientist', 'villain'], golden: true },
  idle: { cps: 0.1, branches: ['villain', 'exploiter', 'scientist', 'lazy'], golden: false },
  prestige: { cps: 2, branches: ['villain', 'scientist', 'exploiter', 'lazy'], golden: true },
};

function seeded(seed) {
  let x = seed >>> 0;
  return () => {
    x = (x * 1664525 + 1013904223) >>> 0;
    return x / 4294967296;
  };
}

function income(state, cps) {
  return getTotalRate(state) + cps * getExpectedClickValue(state);
}

function bestPurchase(state, cps) {
  const base = income(state, cps);
  let best = null;
  const consider = (kind, id, cost, gain) => {
    if (!(gain > 0) || !Number.isFinite(cost)) return;
    const wait = Math.max(0, cost - state.resources.paperwork) / Math.max(base, 1e-9);
    const score = wait + cost / gain;
    if (!best || score < best.score) best = { kind, id, cost, score };
  };
  for (const b of getUnlockedBuildings(state)) {
    consider('building', b.id, getBulkCost(state, b.id, 1), getBuildingUnitProduction(state, b.id));
  }
  for (const u of getAvailableUpgrades(state)) {
    state.upgrades.push(u.id);
    const after = income(state, cps);
    state.upgrades.pop();
    consider('upgrade', u.id, getUpgradeCost(state, u.id), after - base);
  }
  return best;
}

function buyTalents(state, branches) {
  let bought = true;
  while (bought) {
    bought = false;
    for (const branch of branches) {
      const t = TALENTS.filter((x) => x.branch === branch).find((x) => getTalentStatus(state, x.id) === 'available');
      if (t) {
        buyTalent(state, t.id);
        bought = true;
        break;
      }
    }
  }
}

export function simulate(strategyName, hours = 6, { seed = 7, log = false, report = 0 } = {}) {
  const strat = STRATEGIES[strategyName];
  const rng = seeded(seed);
  invalidateModifiers();
  const state = createInitialState(0);
  const milestones = [];
  const mark = (label) => {
    milestones.push({ t: state.statistics.playTimeSeconds, label });
    if (log) console.log(`  ${formatDuration(state.statistics.playTimeSeconds).padStart(12)}  ${label}`);
  };
  const seen = new Set();
  const once = (key, label) => { if (!seen.has(key)) { seen.add(key); mark(label); } };
  let clickCarry = 0;
  let bestRatio = 0;
  const prestiges = [];
  const mergers = [];

  const total = hours * 3600;
  for (let t = 0; t < total; t++) {
    // Clics manuales
    clickCarry += strat.cps;
    while (clickCarry >= 1) { performClick(state, rng); clickCarry -= 1; }
    simulateStep(state, 1, rng);
    if (state.temp.activeEvent) resolveEvent(state, 1) || resolveEvent(state, 0);
    if (state.temp.activeEvent) resolveEvent(state, 0);
    if (strat.golden && state.temp.golden) clickGolden(state, rng);
    const { departments } = runChecks(state);
    for (const d of departments) mark(`Departamento: ${d}`);
    for (const m of getActiveMissions(state)) if (isMissionComplete(state, m.id)) claimMission(state, m.id);

    // Compras (varias por segundo si se puede)
    for (let k = 0; k < 20; k++) {
      const p = bestPurchase(state, strat.cps);
      if (!p || p.cost > state.resources.paperwork) break;
      const r = p.kind === 'building' ? buyBuilding(state, p.id, 1) : buyUpgrade(state, p.id);
      if (!r.ok) break;
      if (p.kind === 'building') once(`b:${p.id}`, `Primer edificio: ${p.id}`);
      else once(`u:${p.id}`, `Mejora: ${p.id}`);
    }
    if (state.statistics.totalClicks >= 0 && state.upgrades.includes('anxiousMouse')) once('auto', 'Automatización: ratón con ansiedad');

    // Prestigio cuando la Influencia por minuto del ciclo deja de crecer.
    if (canPrestige(state)) {
      const gain = getPrestigeGain(state);
      const ratio = gain / Math.max(60, state.statistics.cyclePlayTime);
      bestRatio = Math.max(bestRatio, ratio);
      const minGain = Math.max(10, state.resources.totalInfluenceEarned * 0.5);
      if (gain >= minGain && ratio < bestRatio * 0.97) {
        const cycle = state.statistics.cyclePlayTime;
        const r = performPrestige(state, { confirmed: true });
        if (r.ok) {
          prestiges.push({ t: state.statistics.playTimeSeconds, cycle, gain: r.gained });
          mark(`ASCENSO #${prestiges.length}: +${r.gained} Influencia (ciclo de ${formatDuration(cycle)})`);
          bestRatio = 0;
          runChecks(state, ['prestige']);
          buyTalents(state, strat.branches);
        }
      }
    }
    if (state.resources.influence > 0 && t % 10 === 0) buyTalents(state, strat.branches);
    // Segunda capa: fusionarse cuando las Acciones posibles al menos dupliquen las ganadas.
    if (t % 10 === 0 && canMerge(state)) {
      const gain = getMergerGain(state);
      if (gain >= Math.max(2, state.resources.totalSharesEarned)) {
        const r = performMerger(state, { confirmed: true });
        if (r.ok) {
          mergers.push({ t: state.statistics.playTimeSeconds, gain: r.gained });
          mark(`FUSIÓN #${mergers.length}: +${r.gained} Acciones`);
          bestRatio = 0;
          runChecks(state, ['prestige']);
        }
      }
    }
    if (state.resources.shares > 0 && t % 10 === 0) {
      for (const perk of [...BOARD_PERKS].sort((a, b) => a.cost - b.cost)) {
        if (getBoardPerkStatus(state, perk.id) === 'available' && buyBoardPerk(state, perk.id).ok) mark(`Consejo: ${perk.id}`);
      }
    }
    if (log && report && t % (report * 60) === 0 && t > 0) {
      console.log(`  ${formatDuration(t).padStart(12)}  · pps ${formatNumber(getTotalRate(state))}, ciclo ${formatNumber(state.resources.cycleTotal)}, edificios ${Object.values(state.buildings).reduce((a, b) => a + b, 0)}, mejoras ${state.upgrades.length}, Influencia posible ${getPrestigeGain(state)}`);
    }
  }
  return { state, milestones, prestiges, mergers };
}

const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  const hours = Number(process.argv[2] ?? 6);
  const report = Number(process.argv[3] ?? 0);
  const only = process.argv[4];
  for (const name of Object.keys(STRATEGIES).filter((n) => !only || n === only)) {
    console.log(`\n=== Estrategia: ${name} (${hours} h) ===`);
    const t0 = Date.now();
    const { state, prestiges } = simulate(name, hours, { log: true, report });
    console.log(`  Final: papeleo total ${formatNumber(state.resources.lifetimePaperwork)}, Influencia total ${formatNumber(state.resources.totalInfluenceEarned)}, ` +
      `ascensos ${prestiges.length}, fusiones ${state.statistics.totalMergers}, acciones ${state.resources.totalSharesEarned}, talentos ${state.talents.length}, logros ${Object.keys(state.achievements).length} (sim ${Date.now() - t0} ms)`);
  }
}
