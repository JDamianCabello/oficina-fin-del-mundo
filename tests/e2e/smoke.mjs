// Prueba de humo en un navegador real (Chromium + Playwright).
// Uso: npm run test:e2e   (levanta un servidor estático propio en un puerto libre)
//
// Comprueba: arranque sin errores de consola, clics, compras, pestañas,
// ajustes que cambian el comportamiento, guardado/recarga, exportar/importar,
// diseño móvil y captura pantallazos en tests/e2e/output/.

import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const OUT = join(ROOT, 'tests/e2e/output');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.ttf': 'font/ttf', '.json': 'application/json' };

async function loadPlaywright() {
  try {
    return await import('playwright');
  } catch {
    const globalRoot = execSync('npm root -g').toString().trim();
    const require = createRequire(join(globalRoot, 'noop.js'));
    return require('playwright');
  }
}

function startServer() {
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      let path = normalize(decodeURIComponent(url.pathname)).replace(/^([/\\])+/, '');
      if (path === '' || path.endsWith('/')) path += 'index.html';
      if (path.includes('..')) throw new Error('ruta no permitida');
      const data = await readFile(join(ROOT, path));
      res.writeHead(200, { 'Content-Type': TYPES[extname(path)] ?? 'application/octet-stream' });
      res.end(data);
    } catch {
      res.writeHead(404);
      res.end('not found');
    }
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
}

const results = [];
function check(name, ok, detail = '') {
  results.push({ name, ok, detail });
  console.log(`${ok ? '✔' : '✘'} ${name}${detail ? ` — ${detail}` : ''}`);
}

const { chromium } = await loadPlaywright();
await mkdir(OUT, { recursive: true });
const server = await startServer();
const base = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const errors = [];

try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', (err) => errors.push(err.message));

  await page.goto(base);
  await page.waitForFunction(() => window.__ofdm, null, { timeout: 15000 });
  check('el juego arranca y expone el estado', true);

  // Bienvenida
  const welcome = page.locator('#modal[open]');
  check('se muestra la bienvenida en partida nueva', await welcome.isVisible());
  await page.locator('#modal-actions button').first().click();

  // Clics en el botón y en la escena
  for (let i = 0; i < 20; i++) await page.click('#btn-stamp');
  for (let i = 0; i < 10; i++) await page.click('#scene', { position: { x: 200 + i * 10, y: 200 } });
  let st = await page.evaluate(() => window.__ofdm.getState());
  check('los clics producen papeleo', st.resources.paperwork >= 30 && st.statistics.totalClicks === 30, `papeleo=${st.resources.paperwork}, clics=${st.statistics.totalClicks}`);

  // Comprar impresora
  await page.waitForTimeout(400);
  const buyPrinter = page.locator('#building-list li[data-id="printer"] button');
  check('el botón de compra está habilitado con fondos', await buyPrinter.isEnabled());
  await buyPrinter.click();
  st = await page.evaluate(() => window.__ofdm.getState());
  check('comprar impresora resta coste y suma unidad', st.buildings.printer === 1 && st.resources.paperwork < 30, `impresoras=${st.buildings.printer}`);

  // Producción automática
  const before = st.resources.paperwork;
  await page.waitForTimeout(2200);
  st = await page.evaluate(() => window.__ofdm.getState());
  check('los edificios producen automáticamente', st.resources.paperwork > before, `${before.toFixed(2)} → ${st.resources.paperwork.toFixed(2)}`);

  // Botón deshabilitado explica por qué
  const internBtn = page.locator('#building-list li[data-id="intern"] button');
  const disabled = await internBtn.isDisabled();
  const reason = await page.locator('#building-list li[data-id="intern"] .building__reason').textContent();
  check('botón sin fondos deshabilitado y con motivo', disabled && /faltan/i.test(reason), reason);

  // Mejora (café) tras 10 clics
  await page.evaluate(() => { window.__ofdm.getState().resources.paperwork += 200; });
  await page.waitForTimeout(400);
  await page.click('#tab-upgrades');
  const coffee = page.locator('#upgrade-list li[data-id="coffeeDubious"] button');
  check('aparece la mejora de café tras los clics', await coffee.count() === 1);
  await coffee.click();
  st = await page.evaluate(() => window.__ofdm.getState());
  check('la mejora se compra y queda registrada', st.upgrades.includes('coffeeDubious'));

  // Pestañas
  for (const view of ['talents', 'achievements', 'missions', 'prestige', 'stats', 'upgrades']) {
    await page.click(`#tab-${view}`);
    const visible = await page.locator(`#view-${view}`).isVisible();
    const selected = await page.getAttribute(`#tab-${view}`, 'aria-selected');
    check(`pestaña ${view} muestra su contenido`, visible && selected === 'true');
  }
  check('el logro «Primer sello» está desbloqueado', st.achievements.click1 !== undefined);

  await page.screenshot({ path: join(OUT, 'desktop.png') });

  // Ajustes: desactivar partículas y movimiento reducido cambian el comportamiento
  await page.click('#btn-settings');
  await page.check('#set-motion');
  await page.uncheck('#set-particles');
  const motionClass = await page.evaluate(() => document.documentElement.classList.contains('reduced-motion'));
  st = await page.evaluate(() => window.__ofdm.getState());
  check('ajuste «reducir movimiento» aplica la clase', motionClass && st.settings.reducedMotion === true);
  check('ajuste «partículas» queda desactivado', st.settings.particles === false);
  await page.keyboard.press('Escape');
  const pBefore = await page.evaluate(() => window.__ofdm.getState().resources.paperwork);
  await page.click('#btn-stamp');
  const pAfter = await page.evaluate(() => window.__ofdm.getState().resources.paperwork);
  check('sin partículas la economía sigue igual (clic suma)', pAfter > pBefore);

  // Guardado y recarga
  await page.evaluate(() => window.__ofdm.saveNow());
  const saved = await page.evaluate(() => window.__ofdm.getState());
  await page.reload();
  await page.waitForFunction(() => window.__ofdm, null, { timeout: 15000 });
  st = await page.evaluate(() => window.__ofdm.getState());
  check('la partida sobrevive a una recarga', st.buildings.printer === saved.buildings.printer && st.upgrades.includes('coffeeDubious') && st.settings.particles === false,
    `impresoras=${st.buildings.printer}`);
  if (await page.locator('#modal[open]').isVisible()) await page.keyboard.press('Escape');

  // Exportar e importar (vía UI)
  await page.click('#btn-settings');
  await page.click('#modal-actions button:has-text("Exportar")');
  const exported = await page.locator('#modal .save-textarea').inputValue();
  check('exportar produce JSON válido', (() => { try { return JSON.parse(exported).game === 'oficina-fin-del-mundo'; } catch { return false; } })());
  await page.keyboard.press('Escape');
  await page.click('#btn-settings');
  await page.click('#modal-actions button:has-text("Importar")');
  await page.fill('#modal .save-textarea', '{"esto": "no es una partida"}');
  await page.click('#modal-actions button:has-text("Importar")');
  await page.waitForTimeout(300);
  const rejected = await page.locator('.toast--warning').count();
  st = await page.evaluate(() => window.__ofdm.getState());
  check('importación inválida rechazada sin tocar la partida', rejected > 0 && st.buildings.printer === saved.buildings.printer);
  await page.click('#btn-settings');
  await page.click('#modal-actions button:has-text("Importar")');
  const modified = JSON.parse(exported);
  modified.save.buildings.intern = 7;
  await page.fill('#modal .save-textarea', JSON.stringify(modified));
  await page.click('#modal-actions button:has-text("Importar")');
  await page.waitForTimeout(300);
  st = await page.evaluate(() => window.__ofdm.getState());
  check('importación válida sustituye la partida', st.buildings.intern === 7);

  // Evento aleatorio forzado
  await page.evaluate(() => {
    const s = window.__ofdm.getState();
    s.unlockedDepartments.push('exploitation');
    s.temp.nextEventIn = 0.1;
  });
  await page.waitForSelector('#modal[open]', { timeout: 5000 });
  const eventTitle = await page.locator('#modal-title').textContent();
  await page.locator('#modal-actions button').first().click();
  st = await page.evaluate(() => window.__ofdm.getState());
  check('evento aleatorio aparece y se resuelve', st.statistics.eventsResolved === 1, eventTitle);

  // Prestigio vía UI
  await page.evaluate(() => {
    const s = window.__ofdm.getState();
    s.unlockedDepartments = ['basement', 'exploitation', 'hellHR', 'multinational'];
    s.resources.cycleTotal = 8e9;
  });
  await page.click('#tab-prestige');
  await page.waitForTimeout(400);
  await page.click('#prestige button:has-text("Ascender")');
  await page.click('#modal-actions button:has-text("Ascender")'); // sin marcar la casilla
  st = await page.evaluate(() => window.__ofdm.getState());
  check('ascender sin confirmar no hace nada', st.statistics.totalPrestiges === 0);
  await page.click('#prestige button:has-text("Ascender")');
  await page.check('#prestige-ack');
  await page.click('#modal-actions button:has-text("Ascender")');
  await page.waitForTimeout(300);
  st = await page.evaluate(() => window.__ofdm.getState());
  check('ascender con confirmación reinicia y da Influencia', st.statistics.totalPrestiges === 1 && st.resources.totalInfluenceEarned >= 20 && st.buildings.intern === 0,
    `influencia=${st.resources.totalInfluenceEarned}`);
  await page.screenshot({ path: join(OUT, 'after-prestige.png') });

  // Talentos tras ascender
  await page.click('#tab-talents');
  await page.click('.talent-node:has-text("Dedo de hierro")');
  await page.click('#talent-detail button:has-text("Comprar")');
  st = await page.evaluate(() => window.__ofdm.getState());
  check('comprar un talento desde el árbol', st.talents.includes('lazyIronFinger'));

  // Segunda capa: fusión multiversal y Consejo
  await page.evaluate(() => {
    const s = window.__ofdm.getState();
    s.unlockedDepartments = ['basement', 'exploitation', 'hellHR', 'multinational', 'adminGod', 'board'];
    s.resources.totalInfluenceEarned = 8 * 20000;
  });
  await page.click('#tab-prestige');
  await page.waitForTimeout(400);
  await page.click('#prestige button:has-text("Fusionar")');
  await page.check('#merger-ack');
  await page.click('#modal-actions button:has-text("Fusionar")');
  await page.waitForTimeout(300);
  st = await page.evaluate(() => window.__ofdm.getState());
  check('fusión multiversal con confirmación da Acciones y reinicia la Influencia', st.statistics.totalMergers === 1 && st.resources.shares === 2 && st.resources.totalInfluenceEarned === 0 && st.talents.length === 0,
    `acciones=${st.resources.shares}`);
  check('el contador de Acciones aparece en la barra superior', await page.locator('#res-shares-box').isVisible());
  await page.waitForTimeout(300);
  await page.click('#prestige li[data-id="boardSeedCapital"] button');
  st = await page.evaluate(() => window.__ofdm.getState());
  check('comprar una ventaja del Consejo', st.board.includes('boardSeedCapital') && st.resources.shares === 1);

  // Escena: la oficina dibuja algo (píxeles no vacíos)
  const painted = await page.evaluate(() => {
    const c = document.querySelector('#scene-canvas');
    const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    let n = 0;
    for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++;
    return n / (c.width * c.height);
  });
  check('la escena se dibuja en el canvas', painted > 0.9, `${(painted * 100).toFixed(0)} % de píxeles pintados`);

  // Progreso offline: partida guardada hace 2 h con 10 becarios.
  const offlineCtx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await offlineCtx.addInitScript(() => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    const save = { version: 2, resources: { paperwork: 0, cycleTotal: 100, lifetimePaperwork: 100, influence: 0, totalInfluenceEarned: 0 },
      buildings: { intern: 10 }, upgrades: [], talents: [], achievements: {}, unlockedDepartments: ['basement'], lastSavedAt: Date.now() - 2 * 3600 * 1000 };
    localStorage.setItem('oficinaFinDelMundo.save', JSON.stringify(save));
  });
  const op = await offlineCtx.newPage();
  op.on('pageerror', (err) => errors.push(`[offline] ${err.message}`));
  await op.goto(base);
  await op.waitForFunction(() => window.__ofdm, null, { timeout: 15000 });
  await op.waitForSelector('#modal[open]', { timeout: 5000 });
  const offTitle = await op.locator('#modal-title').textContent();
  const offState = await op.evaluate(() => window.__ofdm.getState());
  check('offline: resumen al volver y producción aplicada', /no estabas/i.test(offTitle) && Math.abs(offState.resources.paperwork - 36000) < 200,
    `papeleo=${offState.resources.paperwork.toFixed(0)} (esperado ≈ 36.000)`);
  await offlineCtx.close();

  // Móvil
  const mobile = await browser.newContext({ viewport: { width: 375, height: 740 }, isMobile: true, hasTouch: true });
  const mp = await mobile.newPage();
  mp.on('pageerror', (err) => errors.push(`[móvil] ${err.message}`));
  await mp.goto(base);
  await mp.waitForFunction(() => window.__ofdm, null, { timeout: 15000 });
  if (await mp.locator('#modal[open]').isVisible()) await mp.locator('#modal-actions button').first().tap();
  const overflow = await mp.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check('móvil: sin desbordamiento horizontal', overflow <= 1, `exceso=${overflow}px`);
  await mp.tap('#btn-stamp');
  const mst = await mp.evaluate(() => window.__ofdm.getState());
  check('móvil: el botón de sellar funciona con toque', mst.statistics.totalClicks === 1);
  await mp.tap('#tab-buildings');
  const leftVisible = await mp.locator('.panel--left').isVisible();
  const upgradesHidden = !(await mp.locator('#view-upgrades').isVisible());
  check('móvil: las secciones funcionan como pestañas', leftVisible && upgradesHidden);
  const tabsFit = await mp.evaluate(() => [...document.querySelectorAll('#tabs .tab')].every((t) => {
    const r = t.getBoundingClientRect();
    return r.left >= 0 && r.right <= window.innerWidth + 0.5 && r.bottom <= window.innerHeight + 0.5;
  }));
  check('móvil: las 7 pestañas caben en la barra inferior', tabsFit);
  await mp.screenshot({ path: join(OUT, 'mobile.png'), fullPage: false });
  await mp.tap('#tab-talents');
  await mp.screenshot({ path: join(OUT, 'mobile-talents.png'), fullPage: false });
  await mobile.close();

  check('sin errores en consola', errors.length === 0, errors.join(' | '));
} catch (err) {
  check('ejecución de la prueba', false, err.stack);
  if (errors.length) console.log('Errores de consola:', errors);
} finally {
  await browser.close();
  server.close();
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} comprobaciones superadas`);
process.exit(failed.length ? 1 : 0);
