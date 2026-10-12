// Prestigio: vista previa completa antes de ascender.

import { el, $, clear } from '../dom.js';
import { getPrestigePreview } from '../../systems/prestige.js';
import { isFeatureUnlocked } from '../../core/progression.js';
import { DEPARTMENTS_BY_ID } from '../../config/departments.data.js';
import { formatNumber, formatPercent } from '../../utils/format.js';
import { getMergerPreview, getBoardPerkStatus, getBoardPerkBlockReason } from '../../systems/merger.js';
import { BOARD_PERKS } from '../../config/board.data.js';

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
    renderMerger(state);
  }

  function renderMerger(state) {
    const m = getMergerPreview(state);
    const unlocked = isFeatureUnlocked(state, 'merger');
    root.append(el('h3', { class: 'panel__subheading', text: 'Fusión multiversal' }));
    root.append(el('p', { class: 'prestige__note', text: 'La segunda capa de prestigio: fusiona la empresa con el multiverso. Pierdes la Influencia y los talentos, pero ganas ACCIONES (◆): +50 % de producción por cada acción ganada y ventajas del Consejo que nunca se pierden.' }));
    if (!unlocked) {
      root.append(el('p', { class: 'modal-note', text: `Se desbloquea con ${DEPARTMENTS_BY_ID.board.title}: firma el formulario 404-B.` }));
      return;
    }
    root.append(el('dl', { class: 'prestige__numbers' }, [
      el('div', { class: 'prestige__number' }, [el('dt', { text: 'Acciones' }), el('dd', { text: `${formatNumber(m.shares)} ◆` })]),
      el('div', { class: 'prestige__number' }, [el('dt', { text: 'Ganarás' }), el('dd', { text: `+${formatNumber(m.gain)} ◆` })]),
      el('div', { class: 'prestige__number' }, [el('dt', { text: 'Bonus de acciones' }), el('dd', { text: `+${formatPercent(m.bonusNow)}` })]),
    ]));
    root.append(el('p', { class: 'prestige__note', text: `Tras fusionarte, el bonus pasará a +${formatPercent(m.bonusAfter)}. Siguiente acción con ${formatNumber(m.nextAt)} de Influencia ganada en esta fusión (llevas ${formatNumber(state.resources.totalInfluenceEarned)}).${m.keepTalents ? ' «Memoria institucional»: conservarás tus talentos.' : ''}` }));
    root.append(el('div', { class: 'prestige__lists' }, [
      el('div', { class: 'prestige__reset' }, [el('h4', { text: 'Se reinicia' }), el('ul', {}, m.resets.map((t) => el('li', { text: t })))]),
      el('div', { class: 'prestige__keep' }, [el('h4', { text: 'Se conserva' }), el('ul', {}, m.keeps.map((t) => el('li', { text: t })))]),
    ]));
    root.append(el('div', { class: 'talent-detail__actions' }, [
      el('button', { type: 'button', class: 'btn btn--danger', text: `⚭ Fusionar (+${formatNumber(m.gain)} ◆)`, disabled: !m.canMerge, onClick: () => actions.requestMerger() }),
      !m.canMerge ? el('span', { class: 'building__reason', text: `Necesitas ${formatNumber(m.nextAt)} de Influencia ganada en esta fusión.` }) : null,
    ]));
    root.append(el('h3', { class: 'panel__subheading', text: 'Consejo de Administración' }));
    const list = el('ul', { class: 'upgrade-list' });
    for (const perk of BOARD_PERKS) {
      const status = getBoardPerkStatus(state, perk.id);
      list.append(el('li', { class: `upgrade${status === 'available' ? ' upgrade--affordable' : ''}`, dataset: { id: perk.id } }, [
        el('div', {}, [
          el('div', { class: 'upgrade__cat', text: status === 'owned' ? '✓ En el Consejo' : `${perk.cost} ◆` }),
          el('div', { class: 'upgrade__name', text: perk.name }),
        ]),
        el('div', { class: 'upgrade__side' }, [
          status === 'owned'
            ? el('span', { class: 'cost cost--ok', text: 'Comprada' })
            : el('button', { type: 'button', class: 'btn btn--magenta btn--small', text: 'Comprar', disabled: status !== 'available', onClick: () => actions.buyBoardPerk(perk.id) }),
        ]),
        el('p', { class: 'upgrade__desc', text: perk.description }),
        status !== 'owned' && status !== 'available' ? el('span', { class: 'building__reason', text: getBoardPerkBlockReason(state, perk.id) }) : null,
      ]));
    }
    root.append(list);
  }

  function update(state, { visible }) {
    if (!visible) return;
    const p = getPrestigePreview(state);
    const m = getMergerPreview(state);
    const k = `${p.gain}|${p.canPrestige}|${Math.floor(p.current)}|${state.resources.totalInfluenceEarned}|${Math.floor(Math.log10(state.resources.cycleTotal + 1) * 4)}|${m.gain}|${m.shares}|${state.board.join(',')}|${isFeatureUnlocked(state, 'merger')}`;
    if (k !== key) {
      key = k;
      render(state);
    }
  }

  return { update, invalidate: () => { key = ''; } };
}
