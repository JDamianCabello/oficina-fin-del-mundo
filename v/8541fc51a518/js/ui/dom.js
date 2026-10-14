// Utilidades DOM seguras: todo el texto se inserta con textContent, nunca con
// innerHTML, así que ningún dato (nombres, partidas importadas) puede inyectar HTML.

/**
 * Crea un elemento. `attrs` admite: class, text, dataset, on{Evento}, hidden,
 * y cualquier atributo (aria-*, role, type...). `children` puede contener
 * nodos, cadenas o valores falsy (se ignoran).
 */
export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === null || value === false) continue;
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = String(value);
    else if (key === 'dataset') Object.assign(node.dataset, value);
    else if (key.startsWith('on') && typeof value === 'function') node.addEventListener(key.slice(2).toLowerCase(), value);
    else if (key === 'hidden') node.hidden = Boolean(value);
    else if (value === true) node.setAttribute(key, '');
    else node.setAttribute(key, String(value));
  }
  for (const child of [].concat(children)) {
    if (child === null || child === undefined || child === false) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return node;
}

export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

/** Cambia textContent solo si ha cambiado (evita trabajo de layout). */
export function setText(node, text) {
  if (!node) return;
  const value = String(text);
  if (node.textContent !== value) node.textContent = value;
}

export function setAttr(node, name, value) {
  if (!node) return;
  const v = String(value);
  if (node.getAttribute(name) !== v) node.setAttribute(name, v);
}

export function toggleClass(node, name, on) {
  if (node && node.classList.contains(name) !== Boolean(on)) node.classList.toggle(name, Boolean(on));
}

export function setDisabled(node, disabled) {
  if (node && node.disabled !== Boolean(disabled)) node.disabled = Boolean(disabled);
}

/** Reinicia una animación CSS añadiendo la clase de nuevo. */
export function replayAnimation(node, className, duration = 600) {
  if (!node) return;
  node.classList.remove(className);
  void node.offsetWidth; // fuerza reflow
  node.classList.add(className);
  clearTimeout(node._animTimer);
  node._animTimer = setTimeout(() => node.classList.remove(className), duration);
}

export function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}
