// Mejoras disponibles y compradas.

import { el, $, clear, setText, setAttr, setDisabled, toggleClass } from '../dom.js';
import { getAvailableUpgrades, getUpgradeCost, getOwnedUpgrades } from '../../systems/upgrades.js';
import { UPGRADES, UPGRADE_CATEGORIES } from '../../config/upgrades.data.js';
import { getTotalRate } from '../../core/economy.js';
import { formatNumber, formatDuration } from '../../utils/format.js';

export function createUpgradesView({ getState, actions }) {
  const list = $('#upgrade-list');
  const ownedList = $('#owned-upgrade-list');
  const count = $('#upgrades-count');
  let key = '';
  let ownedKey = '';
  let refs = new Map();

  function build(available) {
    clear(list);
    refs = new Map();
    if (!available.length) {
      list.append(el('li', { class: 'empty', text: 'No hay mejoras disponibles ahora mismo. Sigue produciendo, contratando y clicando: aparecerán nuevas.' }));
      return;
    }
    for (const up of available) {
      const cost = el('span', { class: 'cost' });
      const reason = el('span', { class: 'building__reason' });
      const button = el('button', { type: 'button', class: 'btn btn--magenta btn--small', text: 'Comprar', onClick: () => actions.buyUpgrade(up.id) });
      const card = el('li', { class: 'upgrade', dataset: { id: up.id } }, [
        el('div', {}, [
          el('div', { class: 'upgrade__cat', text: UPGRADE_CATEGORIES[up.category] ?? up.category }),
          el('div', { class: 'upgrade__name', text: up.name }),
        ]),
        el('div', { class: 'upgrade__side' }, [cost, button]),
        el('p', { class: 'upgrade__desc', text: up.description }),
        reason,
      ]);
      list.append(card);
      refs.set(up.id, { card, cost, button, reason, up });
    }
  }

  function buildOwned(state) {
    clear(ownedList);
    const owned = getOwnedUpgrades(state);
    if (!owned.length) ownedList.append(el('li', { text: 'Ninguna todavía.' }));
    for (const up of owned) ownedList.append(el('li', { title: up.description, text: up.name }));
  }

  function update(state) {
    const available = getAvailableUpgrades(state);
    const k = available.map((u) => u.id).join(',');
    if (k !== key) {
      key = k;
      build(available);
    }
    const ok = state.upgrades.join(',');
    if (ok !== ownedKey) {
      ownedKey = ok;
      buildOwned(state);
    }
    const hidden = UPGRADES.length - available.length - state.upgrades.length;
    setText(count, `${state.upgrades.length} compradas · ${hidden} por descubrir`);
    const rate = getTotalRate(state);
    for (const r of refs.values()) {
      const c = getUpgradeCost(state, r.up.id);
      const affordable = state.resources.paperwork >= c;
      setText(r.cost, formatNumber(c));
      toggleClass(r.cost, 'cost--ok', affordable);
      toggleClass(r.cost, 'cost--no', !affordable);
      toggleClass(r.card, 'upgrade--affordable', affordable);
      setDisabled(r.button, !affordable);
      if (affordable) {
        setText(r.reason, '');
        setAttr(r.button, 'aria-label', `Comprar ${r.up.name} por ${formatNumber(c)}`);
      } else {
        const missing = c - state.resources.paperwork;
        const why = `Te faltan ${formatNumber(missing)}${rate > 0 ? ` (≈ ${formatDuration(missing / rate)})` : ''}`;
        setText(r.reason, why);
        setAttr(r.button, 'aria-label', `Comprar ${r.up.name}: no disponible. ${why}`);
      }
    }
  }

  /** Número de mejoras asequibles (para la insignia de la pestaña). */
  function affordableCount(state) {
    return getAvailableUpgrades(state).filter((u) => state.resources.paperwork >= getUpgradeCost(state, u.id)).length;
  }

  return { update, affordableCount, invalidate: () => { key = ''; ownedKey = ''; } };
}
