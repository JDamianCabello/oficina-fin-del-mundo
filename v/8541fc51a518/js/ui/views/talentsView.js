// Árbol de talentos: cuatro ramas en columnas, nodos navegables con teclado.
// Seleccionar un nodo muestra su efecto y el botón de compra (sin depender de hover).

import { el, $, clear, setText } from '../dom.js';
import { TALENT_BRANCHES, TALENTS_BY_ID, RESPEC_MAX_CYCLE_TOTAL } from '../../config/talents.data.js';
import { getTalentStatus, getTalentBlockReason, getTalentsByBranch, canRespec, getSpentInfluence } from '../../systems/talents.js';
import { isFeatureUnlocked } from '../../core/progression.js';
import { formatNumber } from '../../utils/format.js';

const STATUS_TEXT = {
  owned: 'Comprado',
  available: 'Disponible',
  unaffordable: 'Falta Influencia',
  locked: 'Bloqueado',
  excluded: 'Incompatible',
};

export function createTalentsView({ getState, actions }) {
  const tree = $('#talent-tree');
  const detail = $('#talent-detail');
  const influenceLabel = $('#talents-influence');
  let built = false;
  let selected = null;
  let statusKey = '';
  const nodes = new Map();

  function build() {
    clear(tree);
    for (const branch of TALENT_BRANCHES) {
      const column = el('div', { class: 'talent-branch', role: 'group', 'aria-label': `Rama: ${branch.name}` }, [
        el('div', { class: 'talent-branch__head' }, [
          el('div', { class: 'talent-branch__name', text: `${branch.icon} ${branch.name}` }),
          el('div', { class: 'talent-branch__desc', text: branch.description }),
        ]),
      ]);
      const talents = getTalentsByBranch(branch.id);
      const rows = [...new Set(talents.map((t) => t.pos.row))].sort((a, b) => a - b);
      for (const row of rows) {
        const rowNode = el('div', { class: 'talent-row' });
        for (const t of talents.filter((x) => x.pos.row === row).sort((a, b) => a.pos.col - b.pos.col)) {
          const cost = el('span', { class: 'talent-node__cost' });
          const node = el('button', { type: 'button', class: 'talent-node', 'aria-pressed': 'false', onClick: () => select(t.id) }, [
            el('span', { class: 'talent-node__name', text: t.name }),
            cost,
          ]);
          nodes.set(t.id, { node, cost });
          rowNode.append(node);
        }
        column.append(rowNode);
      }
      tree.append(column);
    }
    built = true;
  }

  function select(id) {
    selected = id;
    for (const [tid, r] of nodes) r.node.setAttribute('aria-pressed', String(tid === id));
    renderDetail(getState());
  }

  function renderDetail(state) {
    clear(detail);
    if (!isFeatureUnlocked(state, 'talents')) {
      detail.append(el('p', { text: 'El árbol de talentos se desbloquea con Recursos Humanos del Infierno (nivel 3). Los talentos se pagan con Influencia, que se gana al ascender.' }));
    }
    const t = selected ? TALENTS_BY_ID[selected] : null;
    if (!t) {
      detail.append(el('p', { class: 'prestige__note', text: 'Selecciona un talento para ver qué hace. Los talentos son permanentes: sobreviven a los ascensos.' }));
    } else {
      const status = getTalentStatus(state, t.id);
      const branch = TALENT_BRANCHES.find((b) => b.id === t.branch);
      const actionsRow = el('div', { class: 'talent-detail__actions' });
      if (status === 'available') {
        actionsRow.append(el('button', { type: 'button', class: 'btn btn--magenta', text: `Comprar por ${t.cost} ✦`, onClick: () => actions.buyTalent(t.id) }));
      } else {
        actionsRow.append(el('button', { type: 'button', class: 'btn btn--magenta', text: `${t.cost} ✦`, disabled: true }));
        actionsRow.append(el('span', { class: 'building__reason', text: getTalentBlockReason(state, t.id) }));
      }
      detail.append(
        el('div', { class: 'talent-detail__name', text: t.name }),
        el('div', { class: 'upgrade__cat', text: `${branch?.name ?? ''} · ${STATUS_TEXT[status]}` }),
        el('p', { text: t.description }),
        actionsRow,
      );
    }
    // Reasignación
    const spent = getSpentInfluence(state);
    if (spent > 0) {
      const respec = el('div', { class: 'talent-detail__actions' }, [
        el('button', { type: 'button', class: 'btn btn--small', text: `Reasignar talentos (+${spent} ✦)`, disabled: !canRespec(state), onClick: () => actions.respecTalents() }),
        el('span', { class: 'building__reason', text: canRespec(state)
          ? 'Gratis: recuperas toda la Influencia gastada.'
          : `Solo al principio de un ciclo (papeleo del ciclo < ${formatNumber(RESPEC_MAX_CYCLE_TOTAL)}).` }),
      ]);
      detail.append(respec);
    }
  }

  function update(state, { visible }) {
    if (!visible) return;
    if (!built) build();
    setText(influenceLabel, `Influencia disponible: ${formatNumber(Math.floor(state.resources.influence))} ✦`);
    const k = [...nodes.keys()].map((id) => getTalentStatus(state, id)).join(',') + `|${isFeatureUnlocked(state, 'talents')}|${canRespec(state)}`;
    for (const [id, r] of nodes) {
      const status = getTalentStatus(state, id);
      r.node.dataset.status = status;
      const t = TALENTS_BY_ID[id];
      setText(r.cost, status === 'owned' ? 'Comprado' : `${t.cost} ✦ · ${STATUS_TEXT[status]}`);
      r.node.setAttribute('aria-label', `${t.name}. ${STATUS_TEXT[status]}. Coste ${t.cost} de Influencia. ${t.description}`);
    }
    if (k !== statusKey) {
      statusKey = k;
      renderDetail(state);
    }
  }

  function availableCount(state) {
    return [...TALENT_BRANCHES.flatMap((b) => getTalentsByBranch(b.id))].filter((t) => getTalentStatus(state, t.id) === 'available').length;
  }

  return { update, availableCount, invalidate: () => { statusKey = ''; } };
}
