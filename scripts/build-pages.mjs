// Construye el sitio de GitHub Pages con versiones inmutables.
//
// Uso: node scripts/build-pages.mjs <versión> <carpeta-del-sitio>
//
// La carpeta del sitio puede contener la publicación anterior (la rama
// gh-pages): se conservan las KEEP_VERSIONS versiones más recientes para que
// quien tenga cacheado un index.html antiguo (GitHub Pages cachea ~10 min)
// siga pudiendo cargar el juego completo.
//
// Resultado:
//   index.html        Copia del index con <base href="v/<versión>/"> y
//                     <meta name="app-version">: todas las rutas relativas
//                     (CSS, JS, sprites, fuentes) apuntan a la versión.
//   version.json      { version, builtAt } para la actualización automática.
//   versions.json     Lista de versiones conservadas (de más nueva a más vieja).
//   v/<versión>/      Archivos del juego de esa versión.

import { cp, mkdir, readFile, rm, writeFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const KEEP_VERSIONS = 3;
const GAME_FILES = ['index.html', 'css', 'js', 'assets', 'README.md', 'ASSET_CREDITS.md'];

export async function buildPages(version, site) {
  if (!/^[\w.-]{1,64}$/.test(version)) throw new Error(`Versión no válida: ${version}`);
  await mkdir(site, { recursive: true });

  // Versiones anteriores que se conservan.
  let previous = [];
  try {
    previous = JSON.parse(await readFile(join(site, 'versions.json'), 'utf8')).filter((v) => typeof v === 'string');
  } catch { /* primera publicación */ }
  const versions = [version, ...previous.filter((v) => v !== version)].slice(0, KEEP_VERSIONS);

  // Limpiar todo salvo las versiones que se conservan (y .git).
  for (const entry of await readdir(site)) {
    if (entry === '.git' || entry === 'v') continue;
    await rm(join(site, entry), { recursive: true, force: true });
  }
  if (existsSync(join(site, 'v'))) {
    for (const entry of await readdir(join(site, 'v'))) {
      if (!versions.includes(entry)) await rm(join(site, 'v', entry), { recursive: true, force: true });
    }
  }

  // Copiar la versión nueva.
  const target = join(site, 'v', version);
  await rm(target, { recursive: true, force: true });
  await mkdir(target, { recursive: true });
  for (const f of GAME_FILES) await cp(join(ROOT, f), join(target, f), { recursive: true });

  // index.html raíz apuntando a la versión.
  const html = await readFile(join(ROOT, 'index.html'), 'utf8');
  const head = `<meta charset="utf-8">\n  <base href="v/${version}/">\n  <meta name="app-version" content="${version}">`;
  if (!html.includes('<meta charset="utf-8">')) throw new Error('index.html sin <meta charset>');
  await writeFile(join(site, 'index.html'), html.replace('<meta charset="utf-8">', head));
  await writeFile(join(site, 'version.json'), `${JSON.stringify({ version, builtAt: new Date().toISOString() })}\n`);
  await writeFile(join(site, 'versions.json'), `${JSON.stringify(versions)}\n`);
  await writeFile(join(site, '.nojekyll'), '');
  return { versions };
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const [version, site] = process.argv.slice(2);
  if (!version || !site) {
    console.error('Uso: node scripts/build-pages.mjs <versión> <carpeta-del-sitio>');
    process.exit(1);
  }
  const { versions } = await buildPages(version, site);
  console.log(`Sitio generado en ${site} (versiones: ${versions.join(', ')})`);
}
