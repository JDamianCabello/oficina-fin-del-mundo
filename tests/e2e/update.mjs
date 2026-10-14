// Prueba de la actualización automática con el sitio versionado real:
// publica la versión A, juega, publica la versión B y comprueba que el juego
// abierto se recarga solo con B conservando la partida.
import { createServer } from 'node:http';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { tmpdir } from 'node:os';
import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { buildPages } from '../../scripts/build-pages.mjs';

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.ttf': 'font/ttf', '.json': 'application/json' };

async function loadPlaywright() {
  try {
    return await import('playwright');
  } catch {
    const globalRoot = execSync('npm root -g').toString().trim();
    return createRequire(join(globalRoot, 'noop.js'))('playwright');
  }
}

const results = [];
const check = (name, ok, detail = '') => {
  results.push(ok);
  console.log(`${ok ? '✔' : '✘'} ${name}${detail ? ` — ${detail}` : ''}`);
};

const site = await mkdtemp(join(tmpdir(), 'ofdm-update-'));
const server = createServer(async (req, res) => {
  try {
    let path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, '');
    if (path === '' || path.endsWith('/')) path += 'index.html';
    if (path.includes('..')) throw new Error('ruta');
    const data = await readFile(join(site, path));
    res.writeHead(200, { 'Content-Type': TYPES[extname(path)] ?? 'application/octet-stream', 'Cache-Control': 'max-age=600' });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end();
  }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}/`;
const { chromium } = await loadPlaywright();
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const errors = [];

try {
  await buildPages('versionA', site);
  const page = await (await browser.newContext()).newPage();
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('response', (r) => { if (r.status() >= 400 && !r.url().includes('favicon')) errors.push(`${r.status()} ${r.url()}`); });
  await page.goto(base);
  await page.waitForFunction(() => window.__ofdm, null, { timeout: 15000 });
  if (await page.locator('#modal[open]').isVisible()) await page.keyboard.press('Escape');
  check('el sitio versionado arranca con la versión A', (await page.evaluate(() => window.__ofdm.version)) === 'versionA');
  for (let i = 0; i < 12; i++) await page.click('#btn-stamp');

  const noUpdate = await page.evaluate(() => window.__ofdm.checkForUpdate());
  check('sin versión nueva no se recarga', noUpdate === false);

  await buildPages('versionB', site);
  const reloaded = page.waitForNavigation({ timeout: 15000 });
  await page.evaluate(() => window.__ofdm.checkForUpdate());
  await reloaded;
  await page.waitForFunction(() => window.__ofdm, null, { timeout: 15000 });
  const after = await page.evaluate(() => ({ v: window.__ofdm.version, clicks: window.__ofdm.getState().statistics.totalClicks }));
  check('al publicarse B el juego se recarga solo con la versión B', after.v === 'versionB', after.v);
  check('la partida se conserva tras actualizar', after.clicks === 12, `clics=${after.clicks}`);

  // Con la actualización automática desactivada solo se avisa.
  await page.evaluate(() => window.__ofdm.actions.setSetting('autoUpdate', false));
  await buildPages('versionC', site);
  await page.evaluate(() => window.__ofdm.checkForUpdate());
  await page.waitForTimeout(3500);
  const stay = await page.evaluate(() => window.__ofdm.version);
  const toastShown = await page.locator('.toast:has-text("Nueva versión disponible")').count();
  check('con el ajuste desactivado no recarga y avisa', stay === 'versionB' && toastShown > 0);
  check('sin errores ni recursos 404', errors.length === 0, errors.join(' | '));
} catch (err) {
  check('ejecución', false, err.stack);
} finally {
  await browser.close();
  server.close();
  await rm(site, { recursive: true, force: true });
}
const failed = results.filter((ok) => !ok).length;
console.log(`\n${results.length - failed}/${results.length} comprobaciones superadas`);
process.exit(failed ? 1 : 0);
