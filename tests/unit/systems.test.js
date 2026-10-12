import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeState, approx, seededRng } from './helpers.js';
import { getPps, getClickValue, invalidateModifiers } from '../../js/core/economy.js';
import { buyUpgrade, getAvailableUpgrades, getUpgradeCost } from '../../js/systems/upgrades.js';
import { checkAchievements, discoverSecret } from '../../js/systems/achievements.js';
import { buyTalent, getTalentStatus, respecTalents, canRespec } from '../../js/systems/talents.js';
import { getPrestigeGain, performPrestige, canPrestige, getPrestigePreview } from '../../js/systems/prestige.js';
import { getActiveMissions, claimMission } from '../../js/systems/missions.js';
import { updateRandomEvents, resolveEvent, updateGolden, clickGolden } from '../../js/systems/randomEvents.js';
import { addTempEffect, tickTempEffects } from '../../js/systems/effects.js';
import { checkDepartments, isFeatureUnlocked, getNextDepartment } from '../../js/core/progression.js';
import { simulateStep, runChecks } from '../../js/core/gameLoop.js';
import { UPGRADES } from '../../js/config/upgrades.data.js';
import { TALENTS } from '../../js/config/talents.data.js';
import { ACHIEVEMENTS } from '../../js/config/achievements.data.js';
import { parseSave, serializeState } from '../../js/storage/save.js';

// ─── Mejoras ────────────────────────────────────────────────────────────

test('hay al menos 20 mejoras con ids únicos y efectos reales', () => {
  assert.ok(UPGRADES.length >= 20);
  assert.equal(new Set(UPGRADES.map((u) => u.id)).size, UPGRADES.length);
  for (const u of UPGRADES) assert.ok(u.effects.length > 0, u.id);
});

test('las mejoras no están todas disponibles al principio', () => {
  const s = makeState({ paperwork: 1e30 });
  assert.equal(getAvailableUpgrades(s).length, 0);
  s.statistics.totalClicks = 10;
  assert.deepEqual(getAvailableUpgrades(s).map((u) => u.id), ['coffeeDubious']);
});

test('una mejora se compra una sola vez, exige requisitos y descuenta su coste', () => {
  const s = makeState({ paperwork: 1000 });
  assert.equal(buyUpgrade(s, 'coffeeDubious').reason, 'locked');
  s.statistics.totalClicks = 10;
  const before = getClickValue(s);
  assert.equal(buyUpgrade(s, 'coffeeDubious').ok, true);
  assert.equal(s.resources.paperwork, 1000 - getUpgradeCost(s, 'coffeeDubious'));
  assert.equal(getClickValue(s), before * 2);
  assert.equal(buyUpgrade(s, 'coffeeDubious').reason, 'owned');
  assert.equal(s.upgrades.filter((id) => id === 'coffeeDubious').length, 1);
});

test('una mejora sin fondos no se compra', () => {
  const s = makeState({ paperwork: 10, buildings: { printer: 1 } });
  assert.equal(buyUpgrade(s, 'printerThreat').reason, 'funds');
  assert.equal(s.upgrades.length, 0);
  assert.equal(s.resources.paperwork, 10);
});

test('el efecto de una mejora de edificio se refleja en la producción', () => {
  const s = makeState({ paperwork: 1000, buildings: { printer: 10 } });
  const before = getPps(s);
  buyUpgrade(s, 'printerThreat');
  assert.ok(approx(getPps(s), before * 2));
});

test('las mejoras persisten después de guardar y cargar sin duplicar efectos', () => {
  const s = makeState({ paperwork: 1000, buildings: { printer: 10 } });
  buyUpgrade(s, 'printerThreat');
  const pps = getPps(s);
  const loaded = parseSave(serializeState(s));
  invalidateModifiers();
  assert.deepEqual(loaded.upgrades, ['printerThreat']);
  assert.ok(approx(getPps(loaded), pps));
  const twice = parseSave(serializeState(loaded));
  assert.ok(approx(getPps(twice), pps));
});

// ─── Departamentos ──────────────────────────────────────────────────────

test('los departamentos se desbloquean en orden y activan mecánicas', () => {
  const s = makeState({ buildings: { intern: 5 } });
  assert.equal(isFeatureUnlocked(s, 'missions'), false);
  s.resources.cycleTotal = 1500;
  assert.deepEqual(checkDepartments(s), ['exploitation']);
  assert.equal(isFeatureUnlocked(s, 'missions'), true);
  assert.equal(getNextDepartment(s).id, 'hellHR');
  // No se puede saltar al nivel 4 aunque se cumplan sus requisitos.
  s.buildings.bureaucracyReactor = 20;
  s.resources.cycleTotal = 1e9;
  assert.deepEqual(checkDepartments(s), []);
  s.buildings.pigeon = 20;
  assert.deepEqual(checkDepartments(s), ['hellHR', 'multinational']);
});

// ─── Logros ─────────────────────────────────────────────────────────────

test('hay al menos 20 logros con ids únicos', () => {
  assert.ok(ACHIEVEMENTS.length >= 20);
  assert.equal(new Set(ACHIEVEMENTS.map((a) => a.id)).size, ACHIEVEMENTS.length);
});

test('los logros se desbloquean y su recompensa se entrega una sola vez', () => {
  const s = makeState({ departments: 'all' });
  s.statistics.totalPrestiges = 1;
  const first = checkAchievements(s);
  assert.ok(first.includes('prestige1'));
  assert.equal(s.resources.influence, 2);
  const second = checkAchievements(s);
  assert.equal(second.length, 0);
  assert.equal(s.resources.influence, 2);
});

test('checkAchievements por temas solo evalúa los temas pedidos', () => {
  const s = makeState();
  s.resources.lifetimePaperwork = 5000;
  s.statistics.totalClicks = 5;
  assert.deepEqual(checkAchievements(s, ['clicks']), ['click1']);
  assert.deepEqual(checkAchievements(s, ['paperwork']), ['paper1k']);
});

test('cada logro da +1 % de producción (derivado, no acumulativo)', () => {
  const s = makeState({ buildings: { intern: 100 } });
  const base = getPps(s);
  s.achievements = { paper1k: 1, click1: 1, click100: 1 };
  assert.ok(approx(getPps(s), base * 1.03));
  assert.ok(approx(getPps(parseSave(serializeState(s))), base * 1.03));
});

test('los secretos desbloquean logros secretos una sola vez', () => {
  const s = makeState();
  const r = discoverSecret(s, 'logo');
  assert.deepEqual(r, ['secretLogo']);
  assert.equal(s.resources.influence, 1);
  assert.deepEqual(discoverSecret(s, 'logo'), []);
  assert.equal(s.resources.influence, 1);
});

// ─── Talentos ───────────────────────────────────────────────────────────

test('hay al menos 16 talentos en 4 ramas', () => {
  assert.ok(TALENTS.length >= 16);
  assert.equal(new Set(TALENTS.map((t) => t.branch)).size, 4);
});

test('talentos: requieren el árbol desbloqueado, Influencia y nodos previos', () => {
  const s = makeState({ influence: 100 });
  assert.equal(getTalentStatus(s, 'lazyIronFinger'), 'locked');
  s.unlockedDepartments.push('exploitation', 'hellHR');
  assert.equal(getTalentStatus(s, 'lazyIronFinger'), 'available');
  assert.equal(getTalentStatus(s, 'lazyExcelScript'), 'locked');
  assert.equal(buyTalent(s, 'lazyExcelScript').ok, false);
  assert.equal(buyTalent(s, 'lazyIronFinger').ok, true);
  assert.equal(s.resources.influence, 99);
  assert.equal(getTalentStatus(s, 'lazyIronFinger'), 'owned');
  assert.equal(buyTalent(s, 'lazyIronFinger').ok, false);
  s.resources.influence = 0;
  assert.equal(getTalentStatus(s, 'lazyExcelScript'), 'unaffordable');
});

test('talentos: efectos reales en la economía', () => {
  const s = makeState({ influence: 100, departments: ['exploitation', 'hellHR'], buildings: { intern: 10 } });
  const click = getClickValue(s);
  const pps = getPps(s);
  buyTalent(s, 'lazyIronFinger');
  assert.equal(getClickValue(s), click * 2);
  buyTalent(s, 'exploit25Hours');
  assert.ok(approx(getPps(s), pps * 1.3));
});

test('talentos excluyentes', () => {
  const s = makeState({ influence: 1000, departments: ['exploitation', 'hellHR'] });
  for (const id of ['lazyIronFinger', 'lazyExcelScript', 'lazyTendinitis', 'lazyCritical']) assert.equal(buyTalent(s, id).ok, true, id);
  assert.equal(getTalentStatus(s, 'lazyPerpetualMouse'), 'excluded');
  assert.equal(buyTalent(s, 'lazyPerpetualMouse').ok, false);
  assert.equal(getTalentStatus(s, 'lazyGodThumb'), 'available');
});

test('reasignar talentos devuelve toda la Influencia solo al inicio del ciclo', () => {
  const s = makeState({ influence: 10, departments: ['exploitation', 'hellHR'] });
  buyTalent(s, 'lazyIronFinger');
  buyTalent(s, 'lazyExcelScript');
  s.resources.cycleTotal = 5000;
  assert.equal(canRespec(s), false);
  assert.equal(respecTalents(s).ok, false);
  s.resources.cycleTotal = 0;
  assert.equal(respecTalents(s).refund, 4);
  assert.equal(s.resources.influence, 10);
  assert.deepEqual(s.talents, []);
});

// ─── Prestigio ──────────────────────────────────────────────────────────

test('ganancia de Influencia = floor(cbrt(ciclo / 1e6))', () => {
  const s = makeState({ departments: 'all' });
  for (const [total, gain] of [[0, 0], [999_999, 0], [1e6, 1], [8e6, 2], [1e9, 10], [1e10, 21], [1e12, 100], [1e15, 1000]]) {
    s.resources.cycleTotal = total;
    assert.equal(getPrestigeGain(s), gain, String(total));
  }
});

test('el prestigio exige confirmación y el departamento desbloqueado', () => {
  const s = makeState();
  s.resources.cycleTotal = 1e9;
  assert.equal(canPrestige(s), false);
  s.unlockedDepartments = ['basement', 'exploitation', 'hellHR', 'multinational'];
  assert.equal(performPrestige(s).reason, 'notConfirmed');
  assert.equal(s.resources.cycleTotal, 1e9);
});

test('el prestigio reinicia lo temporal y conserva lo permanente', () => {
  const s = makeState({ paperwork: 5e8, buildings: { intern: 50, pigeon: 20 }, upgrades: ['coffeeDubious'], departments: ['exploitation', 'hellHR', 'multinational'], influence: 3 });
  s.talents = ['lazyIronFinger'];
  s.resources.totalInfluenceEarned = 4;
  s.resources.cycleTotal = 1e9;
  s.resources.lifetimePaperwork = 2e9;
  s.achievements = { paper1k: 123 };
  s.statistics.totalClicks = 77;
  s.missions.claimed = ['mInterns5'];
  addTempEffect(s, { id: 'x', label: 'x', seconds: 30, effects: [{ type: 'globalMult', value: 2 }] });
  const preview = getPrestigePreview(s);
  assert.equal(preview.gain, 10);
  assert.equal(preview.after, 13);

  const r = performPrestige(s, { confirmed: true });
  assert.equal(r.ok, true);
  assert.equal(r.gained, 10);
  // Reiniciado
  assert.equal(s.resources.paperwork, 0);
  assert.equal(s.resources.cycleTotal, 0);
  assert.equal(s.buildings.intern, 0);
  assert.deepEqual(s.upgrades, []);
  assert.deepEqual(s.missions.claimed, []);
  assert.deepEqual(s.temp.effects, []);
  // Conservado
  assert.equal(s.resources.influence, 13);
  assert.equal(s.resources.totalInfluenceEarned, 14);
  assert.equal(s.resources.lifetimePaperwork, 2e9);
  assert.deepEqual(s.talents, ['lazyIronFinger']);
  assert.deepEqual(s.achievements, { paper1k: 123 });
  assert.equal(s.statistics.totalClicks, 77);
  assert.equal(s.statistics.totalPrestiges, 1);
  assert.ok(s.unlockedDepartments.includes('multinational'));
});

test('el prestigio no duplica multiplicadores al recargar', () => {
  const s = makeState({ departments: ['exploitation', 'hellHR', 'multinational'] });
  s.resources.cycleTotal = 1e9;
  performPrestige(s, { confirmed: true });
  s.buildings.intern = 10;
  const pps = getPps(s);
  assert.ok(approx(pps, 10 * (1 + 0.02 * 10)));
  for (let i = 0; i < 3; i++) {
    const reloaded = parseSave(serializeState(s));
    assert.ok(approx(getPps(reloaded), pps));
  }
});

test('talento de papeleo inicial se aplica tras ascender', () => {
  const s = makeState({ departments: ['exploitation', 'hellHR', 'multinational'], influence: 10 });
  buyTalent(s, 'exploit25Hours');
  buyTalent(s, 'exploitSeverance');
  s.resources.cycleTotal = 1e6;
  performPrestige(s, { confirmed: true });
  assert.equal(s.resources.paperwork, 5000);
  assert.equal(s.resources.cycleTotal, 0);
});

// ─── Misiones, eventos y efectos temporales ─────────────────────────────

test('misiones: activas tras desbloquear, se reclaman una vez', () => {
  const s = makeState({ buildings: { intern: 5 } });
  assert.equal(getActiveMissions(s).length, 0);
  s.unlockedDepartments.push('exploitation');
  const active = getActiveMissions(s);
  assert.equal(active.length, 3);
  const r = claimMission(s, 'mInterns5');
  assert.equal(r.ok, true);
  assert.ok(s.resources.paperwork >= 150);
  assert.equal(claimMission(s, 'mInterns5').ok, false);
  assert.equal(claimMission(s, 'mPrinters10').reason, 'incomplete');
  assert.equal(s.statistics.missionsCompleted, 1);
});

test('efectos temporales: se aplican, se renuevan sin apilarse y caducan', () => {
  const s = makeState({ buildings: { intern: 10 } });
  const base = getPps(s);
  const def = { id: 'boost', label: 'Boost', seconds: 10, effects: [{ type: 'globalMult', value: 2 }] };
  addTempEffect(s, def);
  addTempEffect(s, def);
  assert.equal(s.temp.effects.length, 1);
  assert.ok(approx(getPps(s), base * 2));
  tickTempEffects(s, 11);
  assert.equal(s.temp.effects.length, 0);
  assert.ok(approx(getPps(s), base));
});

test('eventos aleatorios: aparecen, cobran su coste y se resuelven una vez', () => {
  const s = makeState({ paperwork: 1000, buildings: { intern: 10 }, departments: ['exploitation'] });
  s.temp.nextEventIn = 1;
  const rng = seededRng(3);
  assert.equal(updateRandomEvents(s, 0.5, rng), null);
  const id = updateRandomEvents(s, 1, rng);
  assert.ok(id);
  assert.ok(s.temp.activeEvent);
  const r = resolveEvent(s, 0);
  assert.equal(r.ok, true);
  assert.equal(s.temp.activeEvent, null);
  assert.equal(resolveEvent(s, 0).ok, false);
  assert.equal(s.statistics.eventsResolved, 1);
});

test('eventos desactivados en ajustes no aparecen', () => {
  const s = makeState({ departments: ['exploitation'] });
  s.settings.eventFrequency = 'off';
  s.temp.nextEventIn = 0;
  assert.equal(updateRandomEvents(s, 10), null);
});

test('un evento sin respuesta se resuelve solo con la opción por defecto', () => {
  const s = makeState({ departments: ['exploitation'] });
  s.temp.activeEvent = { id: 'audit', remaining: 1 };
  updateRandomEvents(s, 2);
  assert.equal(s.temp.activeEvent, null);
  assert.equal(s.statistics.eventsResolved, 1);
});

test('formulario dorado: aparece con su mecánica y da recompensa', () => {
  const s = makeState({ paperwork: 1e6, buildings: { intern: 100 }, departments: ['exploitation', 'hellHR', 'multinational'] });
  s.temp.nextGoldenIn = 0.1;
  assert.equal(updateGolden(s, 1, seededRng(1)), true);
  const before = s.resources.paperwork;
  const r = clickGolden(s, () => 0);
  assert.equal(r.ok, true);
  assert.ok(s.resources.paperwork > before);
  assert.equal(clickGolden(s).ok, false);
});

test('simulación: 1000 ticks sin NaN ni negativos', () => {
  const s = makeState({ paperwork: 0, buildings: { printer: 3 }, departments: 'all' });
  const rng = seededRng(9);
  for (let i = 0; i < 1000; i++) {
    simulateStep(s, 0.1, rng);
    if (i % 5 === 0) runChecks(s);
    if (s.temp.activeEvent) resolveEvent(s, 1);
  }
  for (const v of Object.values(s.resources)) assert.ok(Number.isFinite(v) && v >= 0);
  assert.ok(s.resources.paperwork > 0);
});

test('bucle: los ticks largos de una pestaña en segundo plano se simulan, las suspensiones van a offline', async () => {
  const { createGameLoop, GAP_THRESHOLD_SECONDS } = await import('../../js/core/gameLoop.js');
  const steps = [];
  const gaps = [];
  let perf = 0;
  let wall = 1_000_000;
  const realPerf = globalThis.performance;
  const realNow = Date.now;
  const realSetInterval = globalThis.setInterval;
  let tick = null;
  globalThis.performance = { now: () => perf };
  Date.now = () => wall;
  globalThis.setInterval = (fn) => { tick = fn; return 1; };
  try {
    const loop = createGameLoop({ onStep: (dt) => steps.push(dt), onGap: (s) => gaps.push(s) });
    loop.start();
    perf += 60_000; wall += 60_000; tick();
    assert.equal(gaps.length, 0);
    assert.ok(approx(steps.reduce((a, b) => a + b, 0), 60));
    assert.ok(steps.every((d) => d <= 1));
    wall += (GAP_THRESHOLD_SECONDS + 500) * 1000; // suspensión: el reloj monótono no avanza
    tick();
    assert.equal(gaps.length, 1);
    wall -= 3_600_000; perf += 100; tick(); // reloj hacia atrás: se ignora el de pared
    assert.equal(gaps.length, 1);
    loop.stop();
  } finally {
    globalThis.performance = realPerf;
    Date.now = realNow;
    globalThis.setInterval = realSetInterval;
  }
});
