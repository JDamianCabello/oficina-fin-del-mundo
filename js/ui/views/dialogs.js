// Ventanas modales: ajustes, exportar/importar, eventos, prestigio, offline y final.

import { el } from '../dom.js';
import { openModal, toast } from '../notifications.js';
import { RANDOM_EVENTS_BY_ID } from '../../config/randomEvents.data.js';
import { getChoiceCost } from '../../systems/randomEvents.js';
import { getPrestigePreview } from '../../systems/prestige.js';
import { getMergerPreview } from '../../systems/merger.js';
import { exportSave, importSave, MAX_IMPORT_BYTES, STORAGE_KEYS } from '../../storage/save.js';
import { formatNumber, formatDuration, formatPercent } from '../../utils/format.js';

function checkboxSetting(id, label, hint, checked, onChange) {
  const input = el('input', { type: 'checkbox', id, checked: checked || undefined });
  input.checked = Boolean(checked);
  input.addEventListener('change', () => onChange(input.checked));
  return el('div', { class: 'setting' }, [
    el('label', { class: 'setting__label', for: id }, [el('span', { text: label }), el('span', { class: 'setting__hint', text: hint })]),
    input,
  ]);
}

function selectSetting(id, label, hint, value, options, onChange) {
  const select = el('select', { id }, options.map(([v, text]) => el('option', { value: v, text })));
  select.value = value;
  select.addEventListener('change', () => onChange(select.value));
  return el('div', { class: 'setting' }, [
    el('label', { class: 'setting__label', for: id }, [el('span', { text: label }), el('span', { class: 'setting__hint', text: hint })]),
    select,
  ]);
}

export async function openSettings({ getState, actions }) {
  const s = getState().settings;
  const body = el('div', { class: 'settings' }, [
    checkboxSetting('set-particles', 'Partículas', 'Papeles, chispas y confeti. No afecta a la economía.', s.particles, (v) => actions.setSetting('particles', v)),
    checkboxSetting('set-motion', 'Reducir movimiento', 'Detiene animaciones, temblores y desplazamientos.', s.reducedMotion, (v) => actions.setSetting('reducedMotion', v)),
    checkboxSetting('set-sound', 'Sonido', 'Efectos sintetizados (sin archivos).', s.sound, (v) => actions.setSetting('sound', v)),
    selectSetting('set-events', 'Eventos aleatorios', 'Frecuencia de las interrupciones.', s.eventFrequency,
      [['normal', 'Normal'], ['low', 'Pocos'], ['off', 'Desactivados']], (v) => actions.setSetting('eventFrequency', v)),
    checkboxSetting('set-autoupdate', 'Actualizar automáticamente', 'Si se publica una versión nueva del juego, guarda y recarga la página sola.', s.autoUpdate, (v) => actions.setSetting('autoUpdate', v)),
    selectSetting('set-notation', 'Notación de números', 'Sufijos (1,4 M) o científica (1,4e6).', s.notation,
      [['short', 'Sufijos'], ['scientific', 'Científica']], (v) => actions.setSetting('notation', v)),
    el('p', { class: 'setting__hint', text: `La partida se guarda sola cada 10 s en el almacenamiento local del navegador (clave «${STORAGE_KEYS.main}»), con una copia de seguridad en «${STORAGE_KEYS.backup}».` }),
  ]);
  const choice = await openModal({
    title: 'Ajustes',
    body,
    actions: [
      { label: 'Guardar ahora', value: 'save' },
      { label: 'Exportar', value: 'export' },
      { label: 'Importar', value: 'import' },
      { label: 'Borrar partida', value: 'reset', class: 'btn--danger' },
      { label: 'Cerrar', value: null, class: 'btn--primary', autofocus: true },
    ],
  });
  if (choice === 'save') actions.saveNow(true);
  if (choice === 'export') return openExport({ getState });
  if (choice === 'import') return openImport({ actions });
  if (choice === 'reset') return openHardReset({ actions });
  return null;
}

export async function openExport({ getState }) {
  const text = exportSave(getState());
  const area = el('textarea', { class: 'save-textarea', readonly: true, 'aria-label': 'Partida exportada en JSON' });
  area.value = text;
  const choice = await openModal({
    title: 'Exportar partida',
    body: [el('p', { text: 'Copia este texto o descárgalo como archivo .json para guardar tu partida fuera del navegador.' }), area],
    actions: [
      { label: 'Copiar', value: 'copy' },
      { label: 'Descargar .json', value: 'download', class: 'btn--primary' },
      { label: 'Cerrar', value: null },
    ],
  });
  if (choice === 'copy') {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: 'Copiado', text: 'La partida está en el portapapeles.', icon: '📋' });
    } catch {
      toast({ title: 'No se pudo copiar', text: 'Selecciona el texto y cópialo a mano.', icon: '⚠', type: 'warning' });
    }
  }
  if (choice === 'download') {
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = el('a', { href: url, download: `oficina-fin-del-mundo-${new Date().toISOString().slice(0, 10)}.json` });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

export async function openImport({ actions }) {
  const area = el('textarea', { class: 'save-textarea', 'aria-label': 'Pega aquí la partida en JSON', placeholder: '{ "game": "oficina-fin-del-mundo", ... }' });
  const file = el('input', { type: 'file', accept: '.json,application/json', 'aria-label': 'Cargar archivo .json' });
  const status = el('p', { class: 'setting__hint', role: 'status' });
  file.addEventListener('change', () => {
    const f = file.files?.[0];
    if (!f) return;
    if (f.size > MAX_IMPORT_BYTES) {
      status.textContent = `El archivo pesa ${Math.round(f.size / 1024)} KB: el máximo es ${MAX_IMPORT_BYTES / 1024} KB.`;
      return;
    }
    f.text().then((t) => {
      area.value = t;
      status.textContent = `Archivo cargado: ${f.name}`;
    }).catch(() => { status.textContent = 'No se pudo leer el archivo.'; });
  });
  const choice = await openModal({
    title: 'Importar partida',
    body: [
      el('p', { class: 'modal-note', text: 'La partida importada SUSTITUIRÁ a la actual. Exporta antes la tuya si quieres conservarla.' }),
      area, file, status,
    ],
    actions: [{ label: 'Cancelar', value: null }, { label: 'Importar', value: 'import', class: 'btn--danger' }],
  });
  if (choice !== 'import') return;
  const result = importSave(area.value);
  if (!result.ok) {
    toast({ title: 'Importación rechazada', text: result.error, icon: '⚠', type: 'warning', duration: 7000 });
    return;
  }
  actions.replaceState(result.state, 'Partida importada correctamente.');
}

export async function openHardReset({ actions }) {
  const input = el('input', { type: 'text', class: 'save-textarea', 'aria-label': 'Escribe BORRAR para confirmar', autocomplete: 'off' });
  input.style.minHeight = '40px';
  const choice = await openModal({
    title: '¿Borrar la partida?',
    body: [
      el('p', { class: 'modal-note', text: 'Se perderá TODO: papeleo, Influencia, talentos y logros. No se puede deshacer.' }),
      el('label', { text: 'Escribe BORRAR para confirmar:' }), input,
    ],
    actions: [{ label: 'Cancelar', value: null, autofocus: true }, { label: 'Borrar para siempre', value: 'reset', class: 'btn--danger' }],
  });
  if (choice === 'reset' && input.value.trim().toUpperCase() === 'BORRAR') actions.hardReset();
  else if (choice === 'reset') toast({ title: 'No se ha borrado nada', text: 'Tienes que escribir BORRAR.', icon: 'ℹ' });
}

/** Evento aleatorio con opciones. Devuelve el índice elegido. */
export async function openRandomEvent({ getState, eventId }) {
  const event = RANDOM_EVENTS_BY_ID[eventId];
  if (!event) return 0;
  const state = getState();
  const actions = event.choices.map((c, i) => {
    const cost = getChoiceCost(state, c);
    return { label: `${c.label}${cost > 0 ? ` (−${formatNumber(cost)})` : ''}`, value: i, class: i === 0 ? '' : 'btn--magenta' };
  });
  const body = [
    el('p', { text: event.text }),
    el('ul', { class: 'settings' }, event.choices.map((c) => el('li', { class: 'setting__hint', text: `• ${c.label}: ${c.description}` }))),
    el('p', { class: 'setting__hint', text: 'Si cierras esta ventana se aplica la primera opción. Puedes reducir los eventos en Ajustes.' }),
  ];
  const choice = await openModal({ title: `⚠ ${event.title}`, body, actions });
  return typeof choice === 'number' ? choice : 0;
}

/** Confirmación explícita del ascenso. */
export async function openPrestigeConfirm({ getState }) {
  const p = getPrestigePreview(getState());
  const check = el('input', { type: 'checkbox', id: 'prestige-ack' });
  const choice = await openModal({
    title: '¿Ascender?',
    body: [
      el('p', { text: `Ganarás ${formatNumber(p.gain)} de Influencia (tendrás ${formatNumber(Math.floor(p.after))}). Tu bonus permanente pasará de +${formatPercent(p.bonusNow)} a +${formatPercent(p.bonusAfter)}.` }),
      el('p', { class: 'modal-note', text: `Se reinicia: ${p.resets.join(', ').toLowerCase()}.` }),
      el('p', { text: `Se conserva: ${p.keeps.join(', ').toLowerCase()}.` }),
      el('div', { class: 'setting' }, [el('label', { for: 'prestige-ack', text: 'Entiendo que mi oficina actual se reinicia.' }), check]),
    ],
    actions: [{ label: 'Cancelar', value: null, autofocus: true }, { label: '⇪ Ascender', value: 'go', class: 'btn--magenta' }],
  });
  if (choice !== 'go') return false;
  if (!check.checked) {
    toast({ title: 'Ascenso cancelado', text: 'Marca la casilla de confirmación para ascender.', icon: 'ℹ' });
    return false;
  }
  return true;
}

export function openOfflineSummary(summary) {
  const capped = summary.capped ? ` (limitado a ${formatDuration(summary.maxSeconds)})` : '';
  return openModal({
    title: 'Mientras no estabas...',
    body: [
      el('p', { text: `Has estado fuera ${formatDuration(summary.elapsed)}${capped}. La oficina siguió trabajando sin ti (y sin supervisión, que es peor).` }),
      el('p', { class: 'offline-amount', text: `+${formatNumber(summary.gain)}` }),
      el('p', { class: 'setting__hint', text: `Eficiencia offline: ${formatPercent(summary.efficiency)}. Los efectos temporales no cuentan mientras no estás. Talentos y mejoras aumentan el límite y la eficiencia.` }),
    ],
    actions: [{ label: '¡A trabajar!', value: null, class: 'btn--primary', autofocus: true }],
  });
}

export function openEnding() {
  return openModal({
    title: 'FORMULARIO 404-B: APROBADO',
    body: [
      el('p', { text: 'Sellas el formulario. El universo emite un suave «bip». En algún lugar, una impresora imprime la palabra FIN en Comic Sans.' }),
      el('p', { text: 'El apocalipsis queda oficialmente autorizado... y programado para dentro de 6 a 8 semanas hábiles. Mientras tanto, alguien tiene que seguir haciendo el papeleo.' }),
      el('p', { class: 'modal-note', text: 'Has completado la historia. Tu producción queda ×3 (y ×2 más por el logro). Puedes seguir ascendiendo para batir tus récords.' }),
    ],
    actions: [{ label: 'Volver al trabajo', value: null, class: 'btn--primary', autofocus: true }],
  });
}

/** Confirmación explícita de la fusión (segunda capa). */
export async function openMergerConfirm({ getState }) {
  const m = getMergerPreview(getState());
  const check = el('input', { type: 'checkbox', id: 'merger-ack' });
  const choice = await openModal({
    title: '¿Fusionar con el multiverso?',
    body: [
      el('p', { text: `Ganarás ${formatNumber(m.gain)} Acciones (tendrás ${formatNumber(m.after)} ◆). Tu bonus de acciones pasará de +${formatPercent(m.bonusNow)} a +${formatPercent(m.bonusAfter)}.` }),
      el('p', { class: 'modal-note', text: `Se reinicia: ${m.resets.join('; ').toLowerCase()}.${m.keepTalents ? ' (Conservas los talentos gracias a «Memoria institucional».)' : ''}` }),
      el('p', { text: `Se conserva: ${m.keeps.join('; ').toLowerCase()}.` }),
      el('div', { class: 'setting' }, [el('label', { for: 'merger-ack', text: 'Entiendo que pierdo mi Influencia y mis talentos.' }), check]),
    ],
    actions: [{ label: 'Cancelar', value: null, autofocus: true }, { label: '⚭ Fusionar', value: 'go', class: 'btn--danger' }],
  });
  if (choice !== 'go') return false;
  if (!check.checked) {
    toast({ title: 'Fusión cancelada', text: 'Marca la casilla de confirmación para fusionarte.', icon: 'ℹ' });
    return false;
  }
  return true;
}
