// Estadísticas de la partida.

import { el, $, clear } from '../dom.js';
import { getPps, getClickValue, getGlobalMultiplier, getPrestigeMultiplier, getSharesMultiplier, getAutoClickRate, getModifiers } from '../../core/economy.js';
import { totalBuildings } from '../../core/state.js';
import { ACHIEVEMENTS } from '../../config/achievements.data.js';
import { formatNumber, formatInteger, formatDuration, formatMultiplier, formatPercent } from '../../utils/format.js';

export function createStatsView() {
  const root = $('#stats');
  let last = 0;

  function row(label, value) {
    return [el('dt', { text: label }), el('dd', { text: value })];
  }

  function render(state) {
    clear(root);
    const s = state.statistics;
    const mods = getModifiers(state);
    const items = [
      el('div', { class: 'stats__section', text: 'Este ciclo' }),
      ...row('Papeleo disponible', formatNumber(state.resources.paperwork)),
      ...row('Papeleo producido en el ciclo', formatNumber(state.resources.cycleTotal)),
      ...row('Producción por segundo', formatNumber(getPps(state))),
      ...row('Valor de un clic', formatNumber(getClickValue(state))),
      ...row('Clics automáticos por segundo', formatNumber(getAutoClickRate(state))),
      ...row('Probabilidad de crítico', formatPercent(mods.critChance)),
      ...row('Edificios', formatInteger(totalBuildings(state))),
      ...row('Mejoras compradas', formatInteger(state.upgrades.length)),
      ...row('Duración del ciclo', formatDuration(s.cyclePlayTime)),
      el('div', { class: 'stats__section', text: 'Multiplicadores' }),
      ...row('Multiplicador global total', formatMultiplier(getGlobalMultiplier(state))),
      ...row('Por Influencia', formatMultiplier(getPrestigeMultiplier(state))),
      ...row('Por Acciones', formatMultiplier(getSharesMultiplier(state))),
      ...row('Por logros', formatMultiplier(1 + 0.01 * Object.keys(state.achievements).length)),
      ...row('Producción offline', `${formatPercent(mods.offlineEfficiency)} · máx. ${formatNumber(mods.offlineHours)} h`),
      el('div', { class: 'stats__section', text: 'Histórico' }),
      ...row('Papeleo producido en total', formatNumber(state.resources.lifetimePaperwork)),
      ...row('Papeleo a base de clics', formatNumber(s.manualPaperwork)),
      ...row('Clics manuales', formatInteger(s.totalClicks)),
      ...row('Mejor producción por segundo', formatNumber(s.bestPps)),
      ...row('Ascensos', formatInteger(s.totalPrestiges)),
      ...row('Ascenso más rápido', s.fastestPrestigeSeconds ? formatDuration(s.fastestPrestigeSeconds) : '—'),
      ...row('Influencia ganada (esta fusión)', formatNumber(state.resources.totalInfluenceEarned)),
      ...row('Fusiones', formatInteger(s.totalMergers)),
      ...row('Acciones ganadas en total', formatNumber(state.resources.totalSharesEarned)),
      ...row('Ventajas del Consejo', formatInteger(state.board.length)),
      ...row('Logros', `${Object.keys(state.achievements).length}/${ACHIEVEMENTS.length}`),
      ...row('Formularios dorados atrapados', formatInteger(s.goldenFormsClicked)),
      ...row('Eventos resueltos', formatInteger(s.eventsResolved)),
      ...row('Misiones completadas', formatInteger(s.missionsCompleted)),
      ...row('Edificios comprados', formatInteger(s.buildingsBought)),
      ...row('Tiempo offline acumulado', formatDuration(s.offlineSecondsTotal)),
      ...row('Tiempo de juego', formatDuration(s.playTimeSeconds)),
      ...row('Partida iniciada', new Date(s.startedAt).toLocaleDateString('es-ES')),
    ];
    root.append(...items);
  }

  function update(state, { visible }) {
    if (!visible) return;
    const now = performance.now();
    if (now - last < 1000) return;
    last = now;
    render(state);
  }

  return { update, invalidate: () => { last = 0; } };
}
