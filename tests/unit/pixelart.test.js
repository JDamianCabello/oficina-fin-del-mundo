import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PIXEL_ART, validatePixelArt } from '../../js/ui/pixelArt.js';

test('el pixel art propio tiene filas regulares y colores definidos', () => {
  assert.deepEqual(validatePixelArt(PIXEL_ART), []);
});
