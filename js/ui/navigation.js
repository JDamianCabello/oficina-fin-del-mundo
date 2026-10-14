// Navegación por pestañas.
//
// Escritorio: la columna izquierda muestra siempre los edificios y la derecha
// la vista elegida. Pulsar «Edificios» enfoca la columna izquierda.
// Móvil (≤ 760 px): solo se ve la vista activa, incluidos los edificios.

import { $, $$, replayAnimation } from './dom.js';
import { emit } from '../core/events.js';

const MOBILE_QUERY = '(max-width: 760px)';
const RIGHT_VIEWS = ['upgrades', 'talents', 'achievements', 'missions', 'prestige', 'stats'];
const STORAGE_KEY = 'oficinaFinDelMundo.view';

let current = 'upgrades';
let rightView = 'upgrades';

function isMobile() {
  return window.matchMedia(MOBILE_QUERY).matches;
}

export function getActiveView() {
  return current;
}

/** ¿Está visible ahora mismo la vista `name`? (para no redibujar lo oculto) */
export function isViewVisible(name) {
  if (name === 'buildings') return !isMobile() || current === 'buildings';
  if (isMobile()) return current === name;
  return rightView === name;
}

export function setView(name, { focus = false, scroll = false } = {}) {
  if (name !== 'buildings' && !RIGHT_VIEWS.includes(name)) return;
  current = name;
  if (name !== 'buildings') rightView = name;
  document.body.dataset.view = current;
  document.body.dataset.rightView = rightView;
  for (const tab of $$('#tabs [role="tab"]')) {
    const selected = isMobile() ? tab.dataset.view === current : tab.dataset.view === (name === 'buildings' ? 'buildings' : rightView);
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
  }
  try { localStorage.setItem(STORAGE_KEY, name); } catch { /* sin almacenamiento */ }
  if (name === 'buildings' && !isMobile()) {
    const panel = $('.panel--left');
    replayAnimation(panel, 'is-flashing', 600);
  }
  if (scroll && isMobile()) {
    const target = name === 'buildings' ? $('.panel--left') : $('.panel--right');
    const smooth = !document.documentElement.classList.contains('reduced-motion') && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    target?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
  }
  if (focus) {
    const view = $(`#view-${name}`);
    view?.querySelector('.panel__title')?.focus({ preventScroll: false });
  }
  emit('viewChanged', { view: name });
}

export function initNavigation() {
  // Enlace «Saltar al contenido»: se gestiona por JS porque, con el <base href>
  // de la versión publicada, «#main-content» apuntaría a otra URL.
  $('.skip-link')?.addEventListener('click', (event) => {
    event.preventDefault();
    $('#main-content')?.focus();
  });
  const tabs = $$('#tabs [role="tab"]');
  for (const tab of tabs) {
    tab.addEventListener('click', () => setView(tab.dataset.view, { scroll: true }));
  }
  // Teclado: flechas para moverse entre pestañas (patrón ARIA tablist).
  $('#tabs').addEventListener('keydown', (event) => {
    const index = tabs.indexOf(document.activeElement);
    if (index < 0) return;
    let next = null;
    if (event.key === 'ArrowRight') next = tabs[(index + 1) % tabs.length];
    if (event.key === 'ArrowLeft') next = tabs[(index - 1 + tabs.length) % tabs.length];
    if (event.key === 'Home') next = tabs[0];
    if (event.key === 'End') next = tabs[tabs.length - 1];
    if (next) {
      event.preventDefault();
      next.focus();
      setView(next.dataset.view);
    }
  });
  // Altura real de la barra superior (varía en móvil) para las pestañas fijas.
  const topbar = $('.topbar');
  const syncHeights = () => document.documentElement.style.setProperty('--topbar-h', `${Math.ceil(topbar.getBoundingClientRect().height)}px`);
  syncHeights();
  if ('ResizeObserver' in window) new ResizeObserver(syncHeights).observe(topbar);
  let saved = null;
  try { saved = localStorage.getItem(STORAGE_KEY); } catch { /* nada */ }
  const initial = saved && (saved === 'buildings' || RIGHT_VIEWS.includes(saved)) ? saved : isMobile() ? 'buildings' : 'upgrades';
  setView(initial);
  window.matchMedia(MOBILE_QUERY).addEventListener?.('change', () => setView(current));
}
