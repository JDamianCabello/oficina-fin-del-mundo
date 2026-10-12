import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeState, approx } from './helpers.js';
import {
  saveGame, loadGame, createMemoryStorage, STORAGE_KEYS, exportSave, importSave, parseSave,
  serializeState, MAX_IMPORT_BYTES, BACKUP_EVERY_N_SAVES,
} from '../../js/storage/save.js';
import { migrate } from '../../js/storage/migrations.js';
import { SAVE_VERSION } from '../../js/core/state.js';
import { computeOfflineGain, applyOfflineProgress } from '../../js/systems/offlineProgress.js';
import { getPps } from '../../js/core/economy.js';

test('guardar y cargar conserva el estado', () => {
  const storage = createMemoryStorage();
  const s = makeState({ paperwork: 1234.5, buildings: { printer: 7 }, upgrades: ['printerThreat'] });
  s.achievements = { paper1k: 5 };
  assert.equal(saveGame(s, storage, 2_000_000).ok, true);
  const { state, source } = loadGame(storage);
  assert.equal(source, 'main');
  assert.equal(state.resources.paperwork, 1234.5);
  assert.equal(state.buildings.printer, 7);
  assert.deepEqual(state.upgrades, ['printerThreat']);
  assert.deepEqual(state.achievements, { paper1k: 5 });
  assert.equal(state.lastSavedAt, 2_000_000);
});

test('sin partida se crea una nueva', () => {
  const { state, source } = loadGame(createMemoryStorage());
  assert.equal(source, 'new');
  assert.equal(state.resources.paperwork, 0);
});

test('una partida dañada recupera la copia de seguridad y conserva los datos dañados', () => {
  const storage = createMemoryStorage();
  const good = makeState({ paperwork: 999 });
  storage.setItem(STORAGE_KEYS.backup, serializeState(good));
  storage.setItem(STORAGE_KEYS.main, '{"resources": esto no es json');
  const r = loadGame(storage, 3_000_000);
  assert.equal(r.source, 'backup');
  assert.equal(r.state.resources.paperwork, 999);
  assert.ok(r.warning);
  const corruptKeys = [...storage._map.keys()].filter((k) => k.startsWith(STORAGE_KEYS.corruptPrefix));
  assert.equal(corruptKeys.length, 1);
  assert.equal(storage.getItem(corruptKeys[0]), '{"resources": esto no es json');
});

test('sin copia válida: partida nueva, aviso y datos dañados conservados', () => {
  const storage = createMemoryStorage({ [STORAGE_KEYS.main]: '[1,2,3]' });
  const r = loadGame(storage);
  assert.equal(r.source, 'new');
  assert.ok(r.warning);
  assert.ok([...storage._map.keys()].some((k) => k.startsWith(STORAGE_KEYS.corruptPrefix)));
});

test('la copia de seguridad se escribe periódicamente', () => {
  const storage = createMemoryStorage();
  const s = makeState();
  for (let i = 0; i < BACKUP_EVERY_N_SAVES; i++) saveGame(s, storage, 1000 + i);
  assert.ok(storage.getItem(STORAGE_KEYS.backup));
});

test('si guardar falla, lastSavedAt no avanza', () => {
  const storage = { getItem: () => null, setItem: () => { const e = new Error('full'); e.name = 'QuotaExceededError'; throw e; }, removeItem() {} };
  const s = makeState();
  s.lastSavedAt = 500;
  const r = saveGame(s, storage, 9999);
  assert.equal(r.ok, false);
  assert.match(r.error, /espacio/);
  assert.equal(s.lastSavedAt, 500);
});

test('exportar e importar ida y vuelta', () => {
  const s = makeState({ paperwork: 42, buildings: { intern: 3 } });
  s.talents = ['lazyIronFinger'];
  const text = exportSave(s);
  const r = importSave(text);
  assert.equal(r.ok, true);
  assert.equal(r.state.resources.paperwork, 42);
  assert.equal(r.state.buildings.intern, 3);
  assert.deepEqual(r.state.talents, ['lazyIronFinger']);
});

test('importación inválida: JSON roto, tipos incorrectos, demasiado grande', () => {
  assert.equal(importSave('no es json').ok, false);
  assert.equal(importSave('null').ok, false);
  assert.equal(importSave('{"foo":1}').ok, false);
  assert.equal(importSave('x'.repeat(MAX_IMPORT_BYTES + 1)).ok, false);
  assert.equal(importSave('{"version": 99, "resources": {}}').ok, false);
});

test('importación saneada: negativos, NaN, ids desconocidos y estructuras arbitrarias', () => {
  const evil = {
    version: SAVE_VERSION,
    resources: { paperwork: -100, cycleTotal: 'mucho', lifetimePaperwork: 1e400, influence: 5, totalInfluenceEarned: null },
    buildings: { printer: 3.7, intern: -2, hackerBuilding: 999, pigeon: 1e12 },
    upgrades: ['printerThreat', 'printerThreat', 'fakeUpgrade', { evil: true }],
    talents: ['lazyCritical', 'lazyPerpetualMouse', 'lazyIronFinger', 'nope'],
    achievements: { paper1k: 1, fakeAch: 2 },
    unlockedDepartments: ['adminGod', 'hacker'],
    secrets: ['logo', '<script>'],
    temp: { effects: [{ id: 'x', label: 'x', remaining: 10, duration: 10, effects: [{ type: 'eval', value: 1 }, { type: 'globalMult', value: 1e9 }] }] },
    settings: { particles: 'yes', eventFrequency: 'always', buyAmount: 1000 },
    statistics: { totalClicks: Infinity },
    __proto__hack: { polluted: true },
    lastSavedAt: -5,
  };
  const r = importSave(JSON.stringify(evil));
  assert.equal(r.ok, true);
  const s = r.state;
  assert.equal(s.resources.paperwork, 0);
  assert.equal(s.resources.cycleTotal, 0);
  assert.ok(Number.isFinite(s.resources.lifetimePaperwork));
  assert.equal(s.resources.totalInfluenceEarned, 0);
  assert.equal(s.buildings.printer, 3);
  assert.equal(s.buildings.intern, 0);
  assert.equal(s.buildings.pigeon, 1e6);
  assert.equal('hackerBuilding' in s.buildings, false);
  assert.deepEqual(s.upgrades, ['printerThreat']);
  // lazyCritical se descarta por falta de requisitos; el excluyente también.
  assert.deepEqual(s.talents, ['lazyIronFinger']);
  assert.deepEqual(Object.keys(s.achievements), ['paper1k']);
  assert.deepEqual(s.unlockedDepartments, ['basement', 'adminGod']);
  assert.deepEqual(s.secrets, ['logo']);
  assert.equal(s.temp.effects.length, 1);
  assert.deepEqual(s.temp.effects[0].effects, [{ type: 'globalMult', value: 1000 }]);
  assert.equal(s.settings.particles, true);
  assert.equal(s.settings.eventFrequency, 'normal');
  assert.equal(s.settings.buyAmount, 1);
  assert.equal(s.statistics.totalClicks, 0);
  assert.equal(s.lastSavedAt, 0);
  assert.equal('__proto__hack' in s, false);
  assert.ok(Number.isFinite(getPps(s)));
});

test('migración v1 → v2 desde el esquema del documento de diseño', () => {
  const v1 = {
    version: 1,
    resources: { paperwork: 500, lifetimePaperwork: 9000, influence: 0, totalInfluenceEarned: 0 },
    buildings: { printer: 4, intern: 1, pigeon: 0, bossClone: 0, bureaucracyReactor: 0 },
    upgrades: ['coffeeDubious'],
    talents: [],
    achievements: ['paper1k', 'click1'],
    unlockedDepartments: ['basement'],
    statistics: { totalClicks: 120, totalPrestiges: 0, playTimeSeconds: 600 },
    settings: { particles: false, reducedMotion: true, sound: false },
    lastSavedAt: 1_700_000_000_000,
  };
  const migrated = migrate(v1);
  assert.equal(migrated.version, 2);
  assert.equal(migrated.resources.cycleTotal, 9000);
  assert.deepEqual(migrated.achievements, { paper1k: 1_700_000_000_000, click1: 1_700_000_000_000 });
  const s = parseSave(JSON.stringify(v1));
  assert.equal(s.version, SAVE_VERSION);
  assert.equal(s.buildings.printer, 4);
  assert.equal(s.statistics.totalClicks, 120);
  assert.equal(s.settings.particles, false);
  assert.equal(s.buildings.meetingMachine, 0);
});

// ─── Offline ────────────────────────────────────────────────────────────

test('offline: tiempo normal con eficiencia base del 50 %', () => {
  const s = makeState({ buildings: { intern: 10 } });
  s.lastSavedAt = 1_000_000;
  const r = computeOfflineGain(s, 1_000_000 + 3600 * 1000);
  assert.equal(r.seconds, 3600);
  assert.ok(approx(r.gain, 10 * 3600 * 0.5));
  applyOfflineProgress(s, 1_000_000 + 3600 * 1000);
  assert.ok(approx(s.resources.paperwork, 18000));
  assert.equal(s.statistics.offlineSecondsTotal, 3600);
});

test('offline: se limita al máximo de 8 horas', () => {
  const s = makeState({ buildings: { intern: 1 } });
  s.lastSavedAt = 1;
  const r = computeOfflineGain(s, 1 + 100 * 3600 * 1000);
  assert.equal(r.seconds, 8 * 3600);
  assert.equal(r.capped, true);
  assert.ok(approx(r.gain, 8 * 3600 * 0.5));
});

test('offline: fecha inválida, reloj hacia atrás o sin guardado → sin recompensa', () => {
  const s = makeState({ buildings: { intern: 10 } });
  s.lastSavedAt = 0;
  assert.equal(computeOfflineGain(s, Date.now()).gain, 0);
  s.lastSavedAt = NaN;
  assert.equal(computeOfflineGain(s, Date.now()).gain, 0);
  s.lastSavedAt = Date.now() + 1e7;
  const r = computeOfflineGain(s, Date.now());
  assert.equal(r.gain, 0);
  assert.equal(r.reason, 'clockBackwards');
  s.lastSavedAt = 1000;
  assert.equal(computeOfflineGain(s, NaN).gain, 0);
  assert.equal(computeOfflineGain(s, 1000 + 5000).reason, 'tooShort');
});

test('offline: los efectos temporales no cuentan y caducan', () => {
  const s = makeState({ buildings: { intern: 10 } });
  s.temp.effects.push({ id: 'b', label: 'b', remaining: 30, duration: 30, effects: [{ type: 'globalMult', value: 10 }] });
  s.lastSavedAt = 1000;
  const r = applyOfflineProgress(s, 1000 + 100_000);
  assert.ok(approx(r.gain, 10 * 100 * 0.5));
  assert.equal(s.temp.effects.length, 0);
});

test('offline: talentos y mejoras aumentan límite y eficiencia', () => {
  const s = makeState({ buildings: { intern: 1 }, upgrades: ['physicsContract'] });
  s.lastSavedAt = 1;
  const r = computeOfflineGain(s, 1 + 100 * 3600 * 1000);
  assert.equal(r.seconds, 12 * 3600);
  assert.ok(approx(r.efficiency, 0.6));
});
