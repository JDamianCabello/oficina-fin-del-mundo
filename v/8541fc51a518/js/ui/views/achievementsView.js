// Logros: desbloqueados, pendientes y sus requisitos.

import { el, $, clear, setText } from '../dom.js';
import { ACHIEVEMENTS } from '../../config/achievements.data.js';
import { describeRequirementWithProgress } from '../../core/progression.js';

export function createAchievementsView({ getState }) {
  const list = $('#achievement-list');
  const counter = $('#achievements-count');
  const filterGroup = $('#achievement-filter');
  let filter = 'all';
  let key = '';

  filterGroup.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-filter]');
    if (!btn) return;
    filter = btn.dataset.filter;
    for (const b of filterGroup.querySelectorAll('[data-filter]')) b.setAttribute('aria-checked', String(b === btn));
    key = '';
    update(getState(), { visible: true });
  });

  function build(state) {
    clear(list);
    for (const a of ACHIEVEMENTS) {
      const unlockedAt = state.achievements[a.id];
      const unlocked = unlockedAt !== undefined;
      if (filter === 'unlocked' && !unlocked) continue;
      if (filter === 'locked' && unlocked) continue;
      const hidden = a.secret && !unlocked;
      list.append(el('li', { class: 'achievement', dataset: { unlocked: String(unlocked) } }, [
        el('div', { class: 'achievement__name', text: hidden ? 'Logro secreto' : a.name }),
        el('div', { class: 'achievement__desc', text: hidden ? 'Explora la oficina. Haz cosas raras.' : a.description }),
        !unlocked && !hidden && a.condition.type !== 'secret'
          ? el('div', { class: 'achievement__desc', text: `Progreso: ${describeRequirementWithProgress(state, a.condition)}` })
          : null,
        el('div', { class: 'achievement__reward', text: `Recompensa: +1 % de producción${a.reward?.text ? ` · ${a.reward.text}` : ''}` }),
        unlocked ? el('div', { class: 'achievement__date', text: `Conseguido el ${new Date(unlockedAt).toLocaleString('es-ES')}` }) : null,
      ]));
    }
    if (!list.children.length) list.append(el('li', { class: 'empty', text: 'Nada que mostrar con este filtro.' }));
  }

  function update(state, { visible }) {
    const total = ACHIEVEMENTS.length;
    const done = Object.keys(state.achievements).length;
    setText(counter, `${done}/${total} · +${done} % de producción`);
    if (!visible) return;
    const k = `${done}|${filter}|${Math.floor(Date.now() / 3000)}`;
    if (k !== key) {
      key = k;
      build(state);
    }
  }

  return { update, invalidate: () => { key = ''; } };
}
