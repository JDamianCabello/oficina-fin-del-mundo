// Regresión de balance: la IA de tests/tools/balance.mjs debe alcanzar los
// hitos dentro de los rangos de diseño (la IA juega de forma óptima, así que
// un jugador humano tardará algo más).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { simulate } from '../tools/balance.mjs';

const minutes = (m) => m * 60;

function firstTime(milestones, prefix) {
  return milestones.find((m) => m.label.startsWith(prefix))?.t ?? Infinity;
}

for (const strategy of ['balanced', 'clicker', 'idle']) {
  test(`balance (${strategy}): hitos dentro de los rangos de diseño`, () => {
    const { milestones, state } = simulate(strategy, 1.6);
    const firstBuilding = firstTime(milestones, 'Primer edificio');
    const dept2 = firstTime(milestones, 'Departamento: exploitation');
    const dept3 = firstTime(milestones, 'Departamento: hellHR');
    const prestige = firstTime(milestones, 'ASCENSO #1');
    assert.ok(firstBuilding < minutes(3), `primer edificio a los ${firstBuilding} s`);
    assert.ok(dept2 < minutes(12), `departamento 2 a los ${dept2} s`);
    assert.ok(dept3 > minutes(10) && dept3 < minutes(40), `departamento 3 a los ${dept3} s`);
    assert.ok(prestige > minutes(40) && prestige < minutes(95), `primer ascenso a los ${prestige} s`);
    for (const v of Object.values(state.resources)) assert.ok(Number.isFinite(v) && v >= 0);
  });
}
