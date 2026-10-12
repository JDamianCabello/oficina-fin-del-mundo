// Prestigio: vista previa completa antes de ascender.

import { el, $, clear } from '../dom.js';
import { getPrestigePreview } from '../../systems/prestige.js';
import { isFeatureUnlocked } from '../../core/progression.js';
import { DEPARTMENTS_BY_ID } from '../../config/departments.data.js';
import { formatNumber, formatPercent } from '../../utils/format.js';

export function createPrestigeView({ actions }) {
  const root = $('#prestige');
  let key = '';

  function render(state) {
    clear(root);
    const unlocked = isFeatureUnlocked(state, 'prestige');
    const p = getPrestigePreview(state);
    root.append(el('p', { class: 'prestige__note', text: 'Ascender reinicia la oficina a cambio de Influencia: una moneda permanente que multiplica toda tu producción y compra talentos.' }));
    if (!unlocked) {
      root.append(el('p', { class: 'modal-note', text: `El ascenso se desbloquea con ${DEPARTMENTS_BY_ID.multinational.title}. Consulta sus requisitos en el objetivo actual.` }));
    }
    const numbers = el('dl', { class: 'prestige__numbers' }, [
      el('div', { class: 'prestige__number' }, [el('dt', { text: 'Influencia actual' }), el('dd', { text: formatNumber(Math.floor(p.current)) })]),
      el('div', { class: 'prestige__number' }, [el('dt', { text: 'Ganarás' }), el('dd', { text: `+${formatNumber(p.gain)}` })]),
      el('div', { class: 'prestige__number' }, [el('dt', { text: 'Tendrás después' }), el('dd', { text: formatNumber(Math.floor(p.after)) })]),
    ]);
    root.append(numbers);
    root.append(el('p', { class: 'prestige__note', text: `Bonus permanente de producción: +${formatPercent(p.bonusNow)} ahora → +${formatPercent(p.bonusAfter)} después de ascender. Siguiente punto de Influencia con ${formatNumber(p.nextAt)} de papeleo del ciclo (llevas ${formatNumber(state.resources.cycleTotal)}).` }));
    root.append(el('div', { class: 'prestige__lists' }, [
      el('div', { class: 'prestige__reset' }, [el('h4', { text: 'Se reinicia' }), el('ul', {}, p.resets.map((t) => el('li', { text: t })))]),
      el('div', { class: 'prestige__keep' }, [el('h4', { text: 'Se conserva' }), el('ul', {}, p.keeps.map((t) => el('li', { text: t })))]),
    ]));
    const reason = !unlocked ? 'Todavía no has desbloqueado el ascenso.' : p.gain < 1 ? `Necesitas al menos 1 punto de Influencia (producir ${formatNumber(p.nextAt)} en este ciclo).` : '';
    root.append(el('div', { class: 'talent-detail__actions' }, [
      el('button', { type: 'button', class: 'btn btn--magenta', text: `⇪ Ascender (+${formatNumber(p.gain)} ✦)`, disabled: !p.canPrestige, onClick: () => actions.requestPrestige() }),
      reason ? el('span', { class: 'building__reason', text: reason }) : null,
    ]));
  }

  function update(state, { visible }) {
    if (!visible) return;
    const p = getPrestigePreview(state);
    const k = `${p.gain}|${p.canPrestige}|${Math.floor(p.current)}|${state.resources.totalInfluenceEarned}|${Math.floor(Math.log10(state.resources.cycleTotal + 1) * 4)}`;
    if (k !== key) {
      key = k;
      render(state);
    }
  }

  return { update, invalidate: () => { key = ''; } };
}
