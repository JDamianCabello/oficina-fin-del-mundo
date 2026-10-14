// Lista de edificios (panel izquierdo).

import { el, $, clear, setText, setAttr, setDisabled, toggleClass } from '../dom.js';
import { getUnlockedBuildings, getNextLockedBuilding } from '../../systems/buildings.js';
import { quoteBuilding, getBuildingProduction, getBuildingUnitProduction, getTotalRate, getNextMilestone } from '../../core/economy.js';
import { DEPARTMENTS_BY_ID } from '../../config/departments.data.js';
import { describeRequirementWithProgress } from '../../core/progression.js';
import { formatNumber, formatDuration } from '../../utils/format.js';
import { getIconURL } from '../sprites.js';

export function createBuildingsView({ getState, actions }) {
  const list = $('#building-list');
  const amountGroup = $('#buy-amount');
  let key = '';
  let refs = new Map();
  let lockedRef = null;
  const seen = new Set();

  amountGroup.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-amount]');
    if (!btn) return;
    const raw = btn.dataset.amount;
    actions.setBuyAmount(raw === 'max' ? 'max' : Number(raw));
  });

  function syncAmountButtons(state) {
    for (const btn of amountGroup.querySelectorAll('[data-amount]')) {
      const value = btn.dataset.amount === 'max' ? 'max' : Number(btn.dataset.amount);
      setAttr(btn, 'aria-checked', String(value === state.settings.buyAmount));
    }
  }

  function build(state) {
    clear(list);
    refs = new Map();
    for (const def of getUnlockedBuildings(state)) {
      const count = el('span', { class: 'building__count', 'aria-label': 'Cantidad' });
      const prod = el('div', { class: 'building__prod' });
      const cost = el('span', { class: 'cost' });
      const reason = el('div', { class: 'building__reason' });
      const chips = def.milestones.map((m) => el('span', { class: 'milestone', title: `${m.count} unidades: ${m.text}`, text: m.count }));
      const nextMilestone = el('span', { class: 'building__milestone-next' });
      const milestones = el('div', { class: 'building__milestones', 'aria-label': 'Hitos del edificio' }, [
        el('span', { class: 'building__milestones-label', text: 'Hitos' }),
        ...chips,
        nextMilestone,
      ]);
      const button = el('button', { type: 'button', class: 'btn btn--primary', onClick: () => actions.buyBuilding(def.id) });
      const card = el('li', { class: 'building', dataset: { id: def.id } }, [
        el('div', { class: 'building__icon' }, [
          el('img', { src: getIconURL(def.icon), alt: '', width: 40, height: 40 }),
          count,
        ]),
        el('div', { class: 'building__info' }, [
          el('div', { class: 'building__name', text: def.name }),
          el('div', { class: 'building__desc', text: def.description }),
          prod,
          milestones,
        ]),
        el('div', { class: 'building__buy' }, [button, el('div', {}, [cost, reason])]),
      ]);
      if (!seen.has(def.id) && seen.size > 0) card.classList.add('building--new');
      seen.add(def.id);
      list.append(card);
      refs.set(def.id, { card, count, prod, cost, reason, button, def, chips, nextMilestone });
    }
    const next = getNextLockedBuilding(state);
    lockedRef = null;
    if (next) {
      const dep = DEPARTMENTS_BY_ID[next.department];
      const reqs = el('div', { class: 'building__reason' });
      list.append(el('li', { class: 'building building--locked', 'aria-label': `Edificio bloqueado: se desbloquea con ${dep.name}` }, [
        el('div', { class: 'building__icon' }, [el('img', { src: getIconURL(next.icon), alt: '', width: 40, height: 40 })]),
        el('div', { class: 'building__info' }, [
          el('div', { class: 'building__name', text: '??? (bloqueado)' }),
          el('div', { class: 'building__desc', text: `Se desbloquea con: ${dep.name}` }),
          reqs,
        ]),
      ]));
      lockedRef = { reqs, dep };
    }
  }

  function update(state) {
    const k = getUnlockedBuildings(state).map((b) => b.id).join(',');
    if (k !== key) {
      key = k;
      build(state);
    }
    syncAmountButtons(state);
    const rate = getTotalRate(state);
    for (const [id, r] of refs) {
      const owned = state.buildings[id] || 0;
      setText(r.count, owned);
      r.def.milestones.forEach((m, i) => r.chips[i].dataset.reached = String(owned >= m.count));
      const nm = getNextMilestone(state, id);
      setText(r.nextMilestone, nm ? `Con ${nm.count}: ${nm.text}` : '¡Todos los hitos conseguidos!');
      const unit = getBuildingUnitProduction(state, id);
      const total = getBuildingProduction(state, id);
      setText(r.prod, owned > 0 ? `Produce ${formatNumber(total)}/s · ${formatNumber(unit)}/s c/u` : `Cada uno: ${formatNumber(unit)}/s`);
      const q = quoteBuilding(state, id, state.settings.buyAmount);
      const label = state.settings.buyAmount === 'max' ? (q.count > 0 ? `Comprar ×${q.count}` : 'Comprar máx') : `Comprar ×${q.count}`;
      setText(r.button, label);
      setText(r.cost, formatNumber(q.cost));
      toggleClass(r.cost, 'cost--ok', q.affordable);
      toggleClass(r.cost, 'cost--no', !q.affordable);
      setDisabled(r.button, !q.affordable);
      toggleClass(r.card, 'building--affordable', q.affordable);
      if (q.affordable) {
        setText(r.reason, '');
        setAttr(r.button, 'aria-label', `${label} ${r.def.name} por ${formatNumber(q.cost)} de papeleo`);
      } else {
        const missing = q.cost - state.resources.paperwork;
        const eta = rate > 0 ? ` (≈ ${formatDuration(missing / rate)})` : '';
        const why = `Te faltan ${formatNumber(missing)} de papeleo${eta}`;
        setText(r.reason, why);
        setAttr(r.button, 'aria-label', `${label} ${r.def.name}: no disponible. ${why}`);
      }
    }
    if (lockedRef) {
      const text = lockedRef.dep.requirements.map((req) => describeRequirementWithProgress(state, req)).join(' · ');
      setText(lockedRef.reqs, text);
    }
  }

  return { update, invalidate: () => { key = ''; } };
}
