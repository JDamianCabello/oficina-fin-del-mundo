import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { isNewerVersion } from '../../js/ui/updater.js';
import { buildPages } from '../../scripts/build-pages.mjs';
import { parseSave } from '../../js/storage/save.js';

test('isNewerVersion: solo actualiza con versiones conocidas y distintas', () => {
  assert.equal(isNewerVersion('abc123', 'def456'), true);
  assert.equal(isNewerVersion('abc123', 'abc123'), false);
  assert.equal(isNewerVersion('', 'def456'), false); // desarrollo local
  assert.equal(isNewerVersion('abc123', ''), false);
  assert.equal(isNewerVersion('abc123', null), false);
  assert.equal(isNewerVersion('abc123', '<script>'), false);
});

test('el ajuste autoUpdate se guarda y se valida', () => {
  const base = { version: 3, resources: { paperwork: 0 } };
  assert.equal(parseSave(JSON.stringify(base)).settings.autoUpdate, true);
  assert.equal(parseSave(JSON.stringify({ ...base, settings: { autoUpdate: false } })).settings.autoUpdate, false);
  assert.equal(parseSave(JSON.stringify({ ...base, settings: { autoUpdate: 'sí' } })).settings.autoUpdate, true);
});

test('build-pages: versión inmutable, index con <base>, version.json y conserva 3 versiones', async () => {
  const site = await mkdtemp(join(tmpdir(), 'ofdm-site-'));
  try {
    for (const v of ['v1', 'v2', 'v3', 'v4']) await buildPages(v, site);
    const index = await readFile(join(site, 'index.html'), 'utf8');
    assert.match(index, /<base href="v\/v4\/">/);
    assert.match(index, /<meta name="app-version" content="v4">/);
    assert.deepEqual(JSON.parse(await readFile(join(site, 'version.json'), 'utf8')).version, 'v4');
    assert.deepEqual((await readdir(join(site, 'v'))).sort(), ['v2', 'v3', 'v4']);
    assert.ok(existsSync(join(site, 'v', 'v4', 'js', 'main.js')));
    assert.ok(existsSync(join(site, 'v', 'v4', 'assets', 'sprites', 'kenney', 'industrial-tiles.png')));
    assert.ok(existsSync(join(site, '.nojekyll')));
    await assert.rejects(buildPages('../malo', site));
  } finally {
    await rm(site, { recursive: true, force: true });
  }
});
