import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeState, approx } from './helpers.js';
import {
  getUnitCost, getBulkCost, getMaxAffordable, getPps, getClickValue, performClick,
  addPaperwork, spendPaperwork, produce, getGlobalMultiplier, getModifiers, CRIT_MULT, quoteBuilding,
} from '../../js/core/economy.js';
import { buyBuilding } from '../../js/systems/buildings.js';
import { BUILDINGS_BY_ID } from '../../js/config/buildings.data.js';
import { formatNumber, formatInteger, formatDuration, setNotation } from '../../js/utils/format.js';

test('coste unitario = floor(base × 1,15^n)', () => {
  const s = makeState();
  assert.equal(getUnitCost(s, 'printer', 0), 15);
  assert.equal(getUnitCost(s, 'printer', 1), Math.floor(15 * 1.15));
  assert.equal(getUnitCost(s, 'printer', 10), Math.floor(15 * Math.pow(1.15, 10)));
  assert.equal(getUnitCost(s, 'bureaucracyReactor', 0), 150000);
});

test('coste por lotes suma el coste de cada unidad', () => {
  const s = makeState({ buildings: { intern: 3 } });
  let expected = 0;
  for (let i = 3; i < 13; i++) expected += Math.floor(100 * Math.pow(1.15, i));
  assert.equal(getBulkCost(s, 'intern', 10), expected);
});

test('compra individual descuenta el coste exacto y suma la unidad', () => {
  const s = makeState({ paperwork: 100 });
  const r = buyBuilding(s, 'printer', 1);
  assert.equal(r.ok, true);
  assert.equal(s.buildings.printer, 1);
  assert.equal(s.resources.paperwork, 85);
});

test('no se puede comprar sin recursos y el saldo no cambia', () => {
  const s = makeState({ paperwork: 14 });
  const r = buyBuilding(s, 'printer', 1);
  assert.equal(r.ok, false);
  assert.equal(r.reason, 'funds');
  assert.equal(s.buildings.printer, 0);
  assert.equal(s.resources.paperwork, 14);
});

test('×10 solo compra si alcanza para las diez unidades', () => {
  const s = makeState({ paperwork: 200 });
  assert.equal(buyBuilding(s, 'printer', 10).ok, false);
  assert.equal(s.buildings.printer, 0);
  s.resources.paperwork = getBulkCost(s, 'printer', 10);
  assert.equal(buyBuilding(s, 'printer', 10).ok, true);
  assert.equal(s.buildings.printer, 10);
  assert.equal(s.resources.paperwork, 0);
});

test('comprar máximo nunca deja saldo negativo y compra lo máximo posible', () => {
  for (const budget of [0, 14, 15, 100, 1234, 99999, 1e7]) {
    const s = makeState({ paperwork: budget, buildings: { printer: 5 } });
    const { count, cost } = getMaxAffordable(s, 'printer');
    const r = buyBuilding(s, 'printer', 'max');
    if (count === 0) {
      assert.equal(r.ok, false);
      continue;
    }
    assert.equal(r.count, count);
    assert.ok(s.resources.paperwork >= 0);
    assert.equal(s.resources.paperwork, budget - cost);
    // La siguiente unidad ya no es asequible.
    assert.ok(getUnitCost(s, 'printer', s.buildings.printer) > s.resources.paperwork);
  }
});

test('quoteBuilding con máximo y 0 asequibles muestra el coste de 1', () => {
  const s = makeState({ paperwork: 0 });
  const q = quoteBuilding(s, 'printer', 'max');
  assert.equal(q.count, 0);
  assert.equal(q.cost, 15);
  assert.equal(q.affordable, false);
});

test('producción por segundo base de los cinco edificios iniciales', () => {
  const s = makeState({ buildings: { printer: 10, intern: 2, pigeon: 1, bossClone: 1, bureaucracyReactor: 1 }, departments: 'all' });
  const expected = 10 * 0.2 + 2 * 1 + 8 + 50 + 400;
  assert.ok(approx(getPps(s), expected));
});

test('los multiplicadores de mejoras, talentos y logros se combinan sin duplicarse', () => {
  const s = makeState({ buildings: { printer: 10 }, upgrades: ['printerThreat', 'meetingsBreed'], talents: ['exploit25Hours'] });
  s.achievements = { paper1k: 1, click1: 1 };
  // impresora: 0,2 × 10 × 2 (mejora) × 1,3 (talento) ; global: 1,2 × (1 + 0,02 logros)
  const expected = 0.2 * 10 * 2 * 1.3 * 1.2 * 1.02;
  assert.ok(approx(getPps(s), expected));
  // Llamar muchas veces no acumula nada.
  for (let i = 0; i < 50; i++) getPps(s);
  assert.ok(approx(getPps(s), expected));
});

test('el bonus de Influencia es 2 % por punto ganado (no por punto disponible)', () => {
  const s = makeState({ buildings: { intern: 1 } });
  s.resources.totalInfluenceEarned = 50;
  s.resources.influence = 0; // gastado en talentos: el bonus se mantiene
  assert.ok(approx(getPps(s), 1 * 2));
  // Por encima de 100 puntos el bonus crece con raíz cuadrada.
  s.resources.totalInfluenceEarned = 400;
  assert.ok(approx(getPps(s), 3 * Math.sqrt(4)));
});

test('sinergias: becarios +3 % por paloma', () => {
  const s = makeState({ buildings: { intern: 10, pigeon: 10 }, upgrades: ['synPigeonIntern'], departments: 'all' });
  const internProd = 1 * 10 * (1 + 0.03 * 10);
  assert.ok(approx(getPps(s), internProd + 80));
});

test('valor del clic: base, multiplicadores y porcentaje de la producción', () => {
  const s = makeState({ upgrades: ['coffeeDubious', 'keyboardPrehistoric'] });
  assert.equal(getClickValue(s), 4);
  s.upgrades.push('buttonTraining');
  s.buildings.intern = 100;
  assert.ok(approx(getClickValue(s), 4 + 100 * 0.01));
});

test('clic crítico multiplica por CRIT_MULT', () => {
  const s = makeState({ talents: ['lazyIronFinger', 'lazyExcelScript', 'lazyTendinitis', 'lazyCritical'] });
  const normal = getClickValue(s);
  const r = performClick(s, () => 0);
  assert.equal(r.crit, true);
  assert.ok(approx(r.amount, normal * CRIT_MULT));
  const r2 = performClick(s, () => 0.99);
  assert.equal(r2.crit, false);
});

test('performClick suma papeleo, cuenta clics y reinicia el contador de inactividad', () => {
  const s = makeState();
  s.temp.secondsSinceClick = 99;
  performClick(s);
  assert.equal(s.resources.paperwork, 1);
  assert.equal(s.resources.cycleTotal, 1);
  assert.equal(s.resources.lifetimePaperwork, 1);
  assert.equal(s.statistics.totalClicks, 1);
  assert.equal(s.statistics.manualPaperwork, 1);
  assert.equal(s.temp.secondsSinceClick, 0);
});

test('addPaperwork/spendPaperwork rechazan valores no finitos o negativos', () => {
  const s = makeState({ paperwork: 10 });
  assert.equal(addPaperwork(s, NaN), 0);
  assert.equal(addPaperwork(s, Infinity), 0);
  assert.equal(addPaperwork(s, -5), 0);
  assert.equal(s.resources.paperwork, 10);
  assert.equal(spendPaperwork(s, NaN), false);
  assert.equal(spendPaperwork(s, -1), false);
  assert.equal(spendPaperwork(s, 11), false);
  assert.equal(spendPaperwork(s, 10), true);
  assert.equal(s.resources.paperwork, 0);
});

test('el papeleo satura en Number.MAX_VALUE en lugar de llegar a Infinity', () => {
  const s = makeState({ paperwork: Number.MAX_VALUE });
  addPaperwork(s, Number.MAX_VALUE);
  assert.equal(s.resources.paperwork, Number.MAX_VALUE);
  assert.ok(Number.isFinite(s.resources.lifetimePaperwork));
});

test('produce() usa el delta de tiempo', () => {
  const s = makeState({ buildings: { intern: 4 } });
  produce(s, 0.5);
  assert.ok(approx(s.resources.paperwork, 2));
  produce(s, 2.5);
  assert.ok(approx(s.resources.paperwork, 12));
  produce(s, -1);
  produce(s, NaN);
  assert.ok(approx(s.resources.paperwork, 12));
});

test('el bonus de inactividad del villano solo se aplica tras 30 s sin clics', () => {
  const s = makeState({ buildings: { intern: 1 }, talents: ['villainUnpaidOvertime', 'villainAbusiveClause', 'villainNobodyTouches'] });
  s.temp.secondsSinceClick = 0;
  const active = getPps(s);
  s.temp.secondsSinceClick = 31;
  assert.ok(approx(getPps(s), active * 2));
});

test('globalPerBuildingTypeAbove cuenta tipos con suficientes unidades', () => {
  const s = makeState({ buildings: { printer: 25, intern: 30, pigeon: 3 }, talents: ['exploit25Hours', 'exploitSeverance', 'exploitScale'] });
  const mods = getModifiers(s);
  assert.ok(approx(getGlobalMultiplier(s, mods), 1 + 0.05 * 2));
});

test('todos los edificios tienen datos coherentes', () => {
  for (const b of Object.values(BUILDINGS_BY_ID)) {
    assert.ok(b.baseCost > 0 && b.baseProduction > 0 && b.costGrowth > 1, b.id);
  }
});

test('formato de números en español', () => {
  setNotation('short');
  assert.equal(formatNumber(950), '950');
  assert.equal(formatNumber(0.2), '0,2');
  assert.equal(formatNumber(12.5), '12,5');
  assert.equal(formatNumber(1250), '1,25 mil');
  assert.equal(formatNumber(1.4e6), '1,4 M');
  assert.equal(formatNumber(2.3e9), '2,3 B');
  assert.equal(formatNumber(5.6e12), '5,6 T');
  assert.equal(formatNumber(999999), '1 M');
  assert.equal(formatNumber(123456789), '123 M');
  assert.equal(formatNumber(1e70), '1e70');
  assert.equal(formatNumber(NaN), '0');
  assert.equal(formatNumber(-1500), '-1,5 mil');
  setNotation('scientific');
  assert.equal(formatNumber(1.4e6), '1,4e6');
  assert.equal(formatNumber(1250), '1,25 mil');
  setNotation('short');
  assert.equal(formatInteger(1234567), '1.234.567');
  assert.equal(formatDuration(3725), '1 h 2 min');
});
