// Actualización automática del juego publicado.
//
// Cada despliegue en GitHub Pages escribe `version.json` en la raíz del sitio
// y marca index.html con <meta name="app-version">. Este módulo consulta
// version.json cada pocos minutos (y al volver a la pestaña); si la versión
// publicada es distinta de la que se está ejecutando, avisa a quien lo llame,
// que guarda la partida y recarga la página.
//
// En local (sin meta de versión o sin version.json) no hace nada.

export const CHECK_INTERVAL_MS = 5 * 60 * 1000;

/** Versión con la que se cargó la página ('' en desarrollo). */
export function getRunningVersion(doc = document) {
  return doc.querySelector('meta[name="app-version"]')?.content?.trim() ?? '';
}

/** ¿Hay que actualizar? Solo si ambas versiones son conocidas y distintas. */
export function isNewerVersion(running, published) {
  if (typeof running !== 'string' || typeof published !== 'string') return false;
  const a = running.trim();
  const b = published.trim();
  return a !== '' && b !== '' && a !== b && /^[\w.-]{1,64}$/.test(b);
}

async function fetchPublishedVersion() {
  // Relativo a la página (no al <base>): version.json vive en la raíz del sitio.
  const url = new URL('version.json', window.location.href);
  url.searchParams.set('t', String(Date.now()));
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) return null;
  const data = await res.json();
  return typeof data?.version === 'string' ? data.version : null;
}

/**
 * Empieza a vigilar nuevas versiones. `onUpdate(version)` se llama una sola vez.
 * Devuelve una función para comprobar a mano (útil para pruebas).
 */
export function initUpdater({ onUpdate }) {
  const running = getRunningVersion();
  if (!running) return { check: async () => false, running };
  let notified = false;

  async function check() {
    if (notified) return true;
    try {
      const published = await fetchPublishedVersion();
      if (published && isNewerVersion(running, published)) {
        notified = true;
        onUpdate(published);
        return true;
      }
    } catch {
      /* sin conexión o archivo inaccesible: se reintenta más tarde */
    }
    return false;
  }

  setInterval(check, CHECK_INTERVAL_MS);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) check();
  });
  setTimeout(check, 30_000);
  return { check, running };
}
