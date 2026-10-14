// Notificaciones (toasts), tablón de anuncios y ventanas modales.

import { el, $, clear } from './dom.js';

const MAX_TOASTS = 4;
const MAX_NEWS = 30;

/**
 * Muestra una notificación breve que no bloquea los controles.
 * type: 'info' | 'achievement' | 'warning' | 'magenta'
 */
export function toast({ title, text = '', icon = 'ℹ', type = 'info', duration = 4200 }) {
  const container = $('#toasts');
  if (!container) return;
  while (container.children.length >= MAX_TOASTS) container.firstElementChild.remove();
  const node = el('div', { class: `toast toast--${type}`, role: type === 'warning' ? 'alert' : 'status' }, [
    el('span', { class: 'toast__icon', 'aria-hidden': 'true', text: icon }),
    el('div', {}, [
      el('div', { class: 'toast__title', text: title }),
      text ? el('div', { class: 'toast__text', text }) : null,
    ]),
  ]);
  container.append(node);
  setTimeout(() => dismiss(node), duration);
}

function dismiss(node) {
  if (!node.isConnected || node.classList.contains('toast--leaving')) return;
  node.classList.add('toast--leaving');
  setTimeout(() => node.remove(), 220);
}

/** Añade una línea al tablón de anuncios (registro de lo ocurrido). */
export function news(text) {
  const list = $('#news');
  if (!list) return;
  const time = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  list.prepend(el('li', { text: `${time} · ${text}` }));
  while (list.children.length > MAX_NEWS) list.lastElementChild.remove();
}

// ─── Modal ────────────────────────────────────────────────────────────────

let modalResolve = null;
let modalLocked = false;

/**
 * Abre la ventana modal. `body` es un nodo o array de nodos; `actions` es una
 * lista de { label, value, class, autofocus }. Devuelve una promesa con el
 * `value` de la acción elegida (o null si se cierra con Escape, salvo si
 * `dismissible` es false).
 */
export function openModal({ title, body, actions = [{ label: 'Cerrar', value: null }], dismissible = true }) {
  const dialog = $('#modal');
  if (!dialog) return Promise.resolve(null);
  if (dialog.open) closeModal(null);
  $('#modal-title').textContent = title;
  const bodyNode = $('#modal-body');
  clear(bodyNode);
  for (const child of [].concat(body)) if (child) bodyNode.append(child);
  const actionsNode = $('#modal-actions');
  clear(actionsNode);
  let focusTarget = null;
  for (const action of actions) {
    const btn = el('button', { type: 'button', class: `btn ${action.class ?? ''}`, text: action.label });
    btn.addEventListener('click', () => closeModal(action.value));
    if (action.autofocus) focusTarget = btn;
    actionsNode.append(btn);
  }
  modalLocked = !dismissible;
  dialog.showModal();
  (focusTarget ?? actionsNode.lastElementChild)?.focus();
  return new Promise((resolve) => {
    modalResolve = resolve;
  });
}

export function closeModal(value = null) {
  const dialog = $('#modal');
  if (dialog?.open) dialog.close();
  const resolve = modalResolve;
  modalResolve = null;
  modalLocked = false;
  resolve?.(value);
}

export function isModalOpen() {
  return Boolean($('#modal')?.open);
}

export function initModal() {
  const dialog = $('#modal');
  if (!dialog) return;
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    if (!modalLocked) closeModal(null);
  });
  dialog.addEventListener('close', () => {
    // Cerrado por el navegador (p. ej. form method=dialog): resolver igualmente.
    // El evento llega de forma asíncrona: si ya se abrió otra modal, no tocarla.
    if (modalResolve && !dialog.open) {
      const resolve = modalResolve;
      modalResolve = null;
      resolve(null);
    }
  });
}
