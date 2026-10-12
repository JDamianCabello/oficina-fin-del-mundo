import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeState, approx } from './helpers.js';
import { MERGER_DIVISOR, getMergerGain, canMerge, performMerger, getMergerPreview, buyBoardPerk, getBoardPerkStatus } from '../../js/systems/merger.js';
import { getPps, getClickValue } from '../../js/core/economy.js';
import { checkDepartments } from '../../js/core/progression.js';
import { checkAchievements } from '../../js/systems/achievements.js';
import { parseSave, serializeState } from '../../js/storage/save.js';
import { BOARD_PERKS } from '../../js/config/board.data.js';

const ALL_DEPS = ['exploitation', 'hellHR', 'multinational', 'adminGod', 'board'];

test('el Consejo (nivel 6) se desbloquea al firmar el formulario 404-B', () => {
  const s = makeState({ departments: ['exploitation', 'hellHR', 'multinational', 'adminGod'] });
  assert.deepEqual(checkDepartments(s), []);
  s.upgrades.push('form404B');
  assert.deepEqual(checkDepartments(s), ['board']);
});

test('Acciones = floor(cbrt(Influencia de la fusión / divisor))', () => {
  const s = makeState();
  const d = MERGER_DIVISOR;
  for (const [infl, gain] of [[0, 0], [d - 1, 0], [d, 1], [8 * d, 2], [27 * d, 3], [1000 * d, 10]]) {
    assert.equal(getMergerGain(s, infl), gain, String(infl));
  }
});

test('fusionar exige el Consejo, confirmación y al menos 1 Acción', () => {
  const s = makeState({ departments: ['exploitation', 'hellHR', 'multinational', 'adminGod'] });
  s.resources.totalInfluenceEarned = 8 * MERGER_DIVISOR;
  assert.equal(canMerge(s), false);
  s.unlockedDepartments.push('board');
  assert.equal(canMerge(s), true);
  assert.equal(performMerger(s).reason, 'notConfirmed');
  assert.equal(s.resources.totalInfluenceEarned, 8 * MERGER_DIVISOR);
});

test('la fusión reinicia la primera capa y conserva lo permanente', () => {
  const s = makeState({ paperwork: 1e20, buildings: { godServer: 5, intern: 40 }, upgrades: ['coffeeDubious'], departments: ALL_DEPS, influence: 300 });
  s.talents = ['lazyIronFinger'];
  s.resources.totalInfluenceEarned = 27 * MERGER_DIVISOR;
  s.resources.cycleTotal = 1e20;
  s.achievements = { paper1k: 1 };
  s.statistics.totalPrestiges = 7;
  const preview = getMergerPreview(s);
  assert.equal(preview.gain, 3);
  const r = performMerger(s, { confirmed: true });
  assert.equal(r.ok, true);
  assert.equal(r.gained, 3);
  assert.equal(s.resources.shares, 3);
  assert.equal(s.resources.totalSharesEarned, 3);
  assert.equal(s.resources.influence, 0);
  assert.equal(s.resources.totalInfluenceEarned, 0);
  assert.equal(s.resources.paperwork, 0);
  assert.equal(s.buildings.godServer, 0);
  assert.deepEqual(s.upgrades, []);
  assert.deepEqual(s.talents, []);
  assert.deepEqual(s.achievements, { paper1k: 1 });
  assert.equal(s.statistics.totalPrestiges, 7);
  assert.equal(s.statistics.totalMergers, 1);
  assert.ok(s.unlockedDepartments.includes('board'));
});

test('cada Acción ganada da +50 % de producción, sin duplicarse al recargar', () => {
  const s = makeState({ buildings: { intern: 10 } });
  const base = getPps(s);
  s.resources.totalSharesEarned = 4;
  s.resources.shares = 0; // gastadas: el bonus se mantiene
  assert.ok(approx(getPps(s), base * 3));
  assert.ok(approx(getPps(parseSave(serializeState(s))), base * 3));
});

test('ventajas del Consejo: requisitos, coste, efecto y persistencia', () => {
  const s = makeState({ departments: ALL_DEPS, buildings: { intern: 10 } });
  s.resources.shares = 10;
  assert.equal(getBoardPerkStatus(s, 'boardLobby'), 'locked');
  assert.equal(buyBoardPerk(s, 'boardSeedCapital').ok, true);
  assert.equal(s.resources.shares, 9);
  assert.equal(buyBoardPerk(s, 'boardSeedCapital').ok, false);
  assert.equal(buyBoardPerk(s, 'boardAutomation').ok, true);
  const click = getClickValue(s);
  assert.ok(click > 1, 'clickPps del comité');
  s.resources.shares = 1;
  assert.equal(getBoardPerkStatus(s, 'boardSynergy'), 'locked');
  assert.equal(getBoardPerkStatus(s, 'boardRemote'), 'unaffordable');
  // Capital semilla: papeleo inicial tras fusionarse.
  s.resources.totalInfluenceEarned = MERGER_DIVISOR;
  performMerger(s, { confirmed: true });
  assert.equal(s.resources.paperwork, 1e7);
  assert.deepEqual(s.board, ['boardSeedCapital', 'boardAutomation']);
});

test('«Memoria institucional» conserva los talentos en la fusión', () => {
  const s = makeState({ departments: ALL_DEPS });
  s.board = ['boardGoldenParachute', 'boardMemory'];
  s.talents = ['lazyIronFinger'];
  s.resources.totalInfluenceEarned = MERGER_DIVISOR;
  performMerger(s, { confirmed: true });
  assert.deepEqual(s.talents, ['lazyIronFinger']);
});

test('logros de la segunda capa', () => {
  const s = makeState({ departments: ALL_DEPS });
  s.resources.totalInfluenceEarned = MERGER_DIVISOR;
  performMerger(s, { confirmed: true });
  assert.ok(checkAchievements(s).includes('merger1'));
  s.board = BOARD_PERKS.map((p) => p.id);
  assert.ok(checkAchievements(s).includes('boardFull'));
});
