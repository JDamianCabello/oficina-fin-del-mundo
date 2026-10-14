// Mejoras disponibles y compradas.

import { el, $, clear, setText, setAttr, setDisabled, toggleClass } from '../dom.js';
import { getAvailableUpgrades, getUpgradeCost, getOwnedUpgrades } from '../../systems/upgrades.js';
import { UPGRADES, UPGRADES_BY_ID, UPGRADE_CATEGORIES } from '../../config/upgrades.data.js';
import { isDepartmentUnlocked, describeRequirementWithProgress, checkRequirement } from '../../core/progression.js';
import { getTotalRate } from '../../core/economy.js';
import { formatNumber, formatDuration } from '../../utils/format.js';

export function createUpgradesView({ getState, actions }) {
  const list = $('#upgrade-list');
  const ownedList = $('#owned-upgrade-list');
  const count = $('#upgrades-count');
  let key = '';
  let ownedKey = '';
  let refs = new Map();
  let finalRef = null;

  // Mejoras clave que se anuncian antes de poder comprarlas.
  const KEY_UPGRADES = [
    { id: 'form404B', fromDept: 'multinational', label: '★ Mejora clave · desbloquea el nivel 6',
      text: 'Firmarlo termina la primera historia y desbloquea el nivel 6 (Consejo de Administración). Aparecerá aquí para comprarlo cuando cumplas estos requisitos:' },
    { id: 'form405C', fromDept: 'timeOffice', label: '★ Final · la última mejora del juego',
      text: 'La última mejora del juego: recurrir el fin del mundo. Aparecerá aquí para comprarla cuando cumplas estos requisitos:' },
  ];
  const KEY_BY_ID = Object.fromEntries(KEY_UPGRADES.map((k) => [k.id, k]));

  /** Primera mejora clave pendiente que hay que anunciar (o null). */
  function teaserFor(state, available) {
    return KEY_UPGRADES.find((k) => isDepartmentUnlocked(state, k.fromDept)
      && !state.upgrades.includes(k.id)
      && !available.some((u) => u.id === k.id)) ?? null;
  }

  function buildFinalTeaser(key) {
    const up = UPGRADES_BY_ID[key.id];
    const reqs = el('ul', { class: 'objective__reqs' });
    const cost = el('span', { class: 'cost cost--no' });
    list.append(el('li', { class: 'upgrade upgrade--final upgrade--locked', 'aria-label': `${key.label}, bloqueada: ${up.name}` }, [
      el('div', {}, [
        el('div', { class: 'upgrade__cat', text: `🔒 ${key.label}` }),
        el('div', { class: 'upgrade__name', text: up.name }),
      ]),
      el('div', { class: 'upgrade__side' }, [cost]),
      el('p', { class: 'upgrade__desc', text: key.text }),
      reqs,
    ]));
    finalRef = { reqs, cost, up, key: '' };
  }

  function updateFinalTeaser(state) {
    if (!finalRef) return;
    setText(finalRef.cost, formatNumber(getUpgradeCost(state, finalRef.up.id)));
    const items = finalRef.up.requirements.map((r) => [checkRequirement(state, r), describeRequirementWithProgress(state, r)]);
    const k = JSON.stringify(items);
    if (k === finalRef.key) return;
    finalRef.key = k;
    clear(finalRef.reqs);
    for (const [done, text] of items) finalRef.reqs.append(el('li', { dataset: { done: String(done) }, text }));
  }

  function build(state, available) {
    clear(list);
    refs = new Map();
    finalRef = null;
    if (!available.length) {
      list.append(el('li', { class: 'empty', text: 'No hay mejoras disponibles ahora mismo. Sigue produciendo, contratando y clicando: aparecerán nuevas.' }));
    }
    for (const up of available) {
      const cost = el('span', { class: 'cost' });
      const reason = el('span', { class: 'building__reason' });
      const button = el('button', { type: 'button', class: 'btn btn--magenta btn--small', text: 'Comprar', onClick: () => actions.buyUpgrade(up.id) });
      const keyInfo = KEY_BY_ID[up.id];
      const card = el('li', { class: `upgrade${keyInfo ? ' upgrade--final' : ''}`, dataset: { id: up.id } }, [
        el('div', {}, [
          el('div', { class: 'upgrade__cat', text: keyInfo ? keyInfo.label : UPGRADE_CATEGORIES[up.category] ?? up.category }),
          el('div', { class: 'upgrade__name', text: up.name }),
        ]),
        el('div', { class: 'upgrade__side' }, [cost, button]),
        el('p', { class: 'upgrade__desc', text: up.description }),
        reason,
      ]);
      list.append(card);
      refs.set(up.id, { card, cost, button, reason, up });
    }
    const teaser = teaserFor(state, available);
    if (teaser) buildFinalTeaser(teaser);
  }

  function buildOwned(state) {
    clear(ownedList);
    const owned = getOwnedUpgrades(state);
    if (!owned.length) ownedList.append(el('li', { text: 'Ninguna todavía.' }));
    for (const up of owned) ownedList.append(el('li', { title: up.description, text: up.name }));
  }

  function update(state) {
    const available = getAvailableUpgrades(state);
    const k = `${available.map((u) => u.id).join(',')}|${teaserFor(state, available)?.id ?? ''}`;
    if (k !== key) {
      key = k;
      build(state, available);
    }
    updateFinalTeaser(state);
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
