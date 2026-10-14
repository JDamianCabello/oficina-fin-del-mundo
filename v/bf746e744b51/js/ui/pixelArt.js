// Pixel art propio (creado para este proyecto, dominio público / CC0).
// Cubre lo que no existe en los packs libres verificados: impresoras de
// oficina, palomas, el jefe, mesas, ordenadores CRT, servidores, etc.
//
// Cada sprite es una lista de fotogramas; cada fotograma, una lista de filas
// de caracteres. Cada carácter se traduce con su paleta ('.' = transparente).

const OUTLINE = '#1b1d2e';

export const PIXEL_ART = {
  printer: {
    palette: { k: OUTLINE, g: '#8b93a7', G: '#c3c9d6', d: '#5a6075', w: '#f4f4fa', c: '#32f5c8', r: '#ff5a5a', b: '#10111b' },
    frames: [
      [
        '...kkkkkkkkkk...',
        '...kwwwwwwwwk...',
        '.kkkkkkkkkkkkkk.',
        'kGGGGGGGGGGGGGGk',
        'kGggggggggggggdk',
        'kGgcggggggggggdk',
        'kGggggggggggggdk',
        'kGgkkkkkkkkkkgdk',
        'kGgkbbbbbbbbkgdk',
        'kddddddddddddddk',
        '.kkkkkkkkkkkkkk.',
        '..kk........kk..',
      ],
      [
        '...kkkkkkkkkk...',
        '...kwwwwwwwwk...',
        '.kkkkkkkkkkkkkk.',
        'kGGGGGGGGGGGGGGk',
        'kGggggggggggggdk',
        'kGgrggggggggggdk',
        'kGggggggggggggdk',
        'kGgkkkkkkkkkkgdk',
        'kGgkwwwwwwwwkgdk',
        'kdddwwwwwwwwdddk',
        '.kkkkkkkkkkkkkk.',
        '..kk........kk..',
      ],
    ],
  },

  pigeon: {
    palette: { k: OUTLINE, p: '#8f9bb3', P: '#c5cee0', n: '#3fd4a0', m: '#c45ad6', o: '#ff9f43', y: '#ffd166' },
    frames: [
      // 0: quieta
      [
        '......kkk...',
        '.....kPPPk..',
        '.....kPPokyy',
        '....knmPPk..',
        'kk.knmpppk..',
        'kPkpppppppk.',
        '.kPppPPpppk.',
        '..kpppppppk.',
        '...kkkkkkk..',
        '.....o..o...',
      ],
      // 1: picoteando
      [
        '............',
        '............',
        '......kkk...',
        '.....kPPokyy',
        'kk.knmpppk..',
        'kPkpppppppk.',
        '.kPppPPpppk.',
        '..kpppppppk.',
        '...kkkkkkk..',
        '.....o..o...',
      ],
      // 2: alas arriba
      [
        '..k.....kkk.',
        '.kPk...kPPoy',
        '.kPPk.knmPk.',
        '..kPPkknmk..',
        'kk.kPPppppk.',
        'kPkpppppppk.',
        '.kPppPPpppk.',
        '..kkkkkkkk..',
        '............',
        '............',
      ],
      // 3: alas abajo
      [
        '............',
        '........kkk.',
        '.......kPPoy',
        '......knmPk.',
        'kk.kkknmpk..',
        'kPkpppppppk.',
        '.kPppPPpppk.',
        '..kpPPkkkk..',
        '...kPPk.....',
        '....kk......',
      ],
    ],
  },

  boss: {
    palette: { k: OUTLINE, h: '#3a2a1e', f: '#f2c39b', s: '#2b2f4a', S: '#4a5280', w: '#f4f4fa', m: '#ff4fd8', r: '#ff5a5a' },
    frames: [
      [
        '...kkkkkk...',
        '..khhhhhhk..',
        '..khffffhk..',
        '..kfkffkfk..',
        '..kffffffk..',
        '..kffkkffk..',
        '...kffffk...',
        '.kkssswsssk.',
        'kSsssmmsssSk',
        'kSssswmsssSk',
        'kSssswmsssSk',
        'kfsssmmsssfk',
        '.kssssssssk.',
        '.kssskksssk.',
        '.kssk..kssk.',
        '.kssk..kssk.',
        '.kkkk..kkkk.',
        '............',
      ],
      [
        '...kkkkkk...',
        '..khhhhhhk..',
        '..khffffhk..',
        '..kfkffkfk..',
        '..kffffffk..',
        '..kfkrrkfk..',
        '...kffffk..f',
        '.kkssswsssSk',
        'kSsssmmssssk',
        'kSssswmsssk.',
        'kSssswmsssk.',
        'kfsssmmsssk.',
        '.kssssssssk.',
        '.kssskksssk.',
        '.kssk..kssk.',
        '.kssk..kssk.',
        '.kkkk..kkkk.',
        '............',
      ],
    ],
  },

  desk: {
    palette: { k: OUTLINE, B: '#b07a4f', b: '#8a5a3b', D: '#5e3b26' },
    frames: [[
      'kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk',
      'kBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBk',
      'kbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbk',
      'kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk',
      '.kDk.....................kbbbbk.',
      '.kDk.....................kbkkbk.',
      '.kDk.....................kbbbbk.',
      '.kDk.....................kkkkkk.',
      '.kDk.....................kbbbbk.',
      '.kDk.....................kbkkbk.',
      '.kDk.....................kbbbbk.',
      '.kkk.....................kkkkkk.',
    ]],
  },

  computer: {
    palette: { k: OUTLINE, G: '#e8e0c4', g: '#cfc6a8', d: '#8f876c', s: '#0f3b33' },
    frames: [[
      '.kkkkkkkkkkkk.',
      'kGGGGGGGGGGGGk',
      'kGkkkkkkkkkkgk',
      'kGksssssssskgk',
      'kGksssssssskgk',
      'kGksssssssskgk',
      'kGksssssssskgk',
      'kGksssssssskgk',
      'kGkkkkkkkkkkgk',
      'kddddddddddddk',
      '....kddddk....',
      '...kkkkkkkk...',
    ]],
  },

  coffee: {
    palette: { k: OUTLINE, r: '#c0392b', R: '#e74c3c', g: '#7f8c8d', w: '#f4f4fa', b: '#6b3e26', y: '#ffd166' },
    frames: [[
      'kkkkkkkkkk',
      'kRRRRRRRRk',
      'kRkkkkkkRk',
      'kRkyyyykRk',
      'kRkkkkkkRk',
      'kRRRRRRRRk',
      'kRkk..kkRk',
      'kRk....kRk',
      'kRk.ww.kRk',
      'kRk.bb.kRk',
      'kRRRRRRRRk',
      'kggggggggk',
      'kkkkkkkkkk',
    ]],
  },

  plant: {
    palette: { k: OUTLINE, g: '#2ecc71', G: '#7bed9f', d: '#1e8449', p: '#b07a4f', P: '#8a5a3b' },
    frames: [[
      '...kk.kk...',
      '..kGgkgGk..',
      '.kGggkggGk.',
      'kgGgdkdgGgk',
      'kggdgkgdggk',
      '.kgdgkgdgk.',
      '..kkdkdkk..',
      '...kpppk...',
      '..kpPPPpk..',
      '..kpPPPpk..',
      '...kkkkk...',
    ]],
  },

  cooler: {
    palette: { k: OUTLINE, b: '#74b9ff', B: '#a8d8ff', w: '#dfe6e9', g: '#636e72' },
    frames: [[
      '..kkkkkk..',
      '.kBBBBbbk.',
      '.kBbbbbbk.',
      '.kBbbbbbk.',
      '..kkkkkk..',
      '.kwwwwwwk.',
      '.kwkkwwwk.',
      '.kwwwwwwk.',
      '.kwwwwwwk.',
      '.kwwwwwwk.',
      '.kggggggk.',
      '.kkkkkkkk.',
    ]],
  },

  server: {
    palette: { k: OUTLINE, s: '#2d3436', S: '#4b5563', c: '#32f5c8', m: '#ff4fd8', y: '#ffd166' },
    frames: [
      [
        'kkkkkkkkkkkk',
        'kSSSSSSSSSSk',
        'kSkkkkkkkkSk',
        'kSksssscskSk',
        'kSkkkkkkkkSk',
        'kSksssssmkSk',
        'kSkkkkkkkkSk',
        'kSkscsssskSk',
        'kSkkkkkkkkSk',
        'kSksssysskSk',
        'kSkkkkkkkkSk',
        'kSksssssckSk',
        'kSkkkkkkkkSk',
        'kSSSSSSSSSSk',
        'kkkkkkkkkkkk',
      ],
      [
        'kkkkkkkkkkkk',
        'kSSSSSSSSSSk',
        'kSkkkkkkkkSk',
        'kSkcssssskSk',
        'kSkkkkkkkkSk',
        'kSksmsssskSk',
        'kSkkkkkkkkSk',
        'kSksssssckSk',
        'kSkkkkkkkkSk',
        'kSkyssssskSk',
        'kSkkkkkkkkSk',
        'kSksscssskSk',
        'kSkkkkkkkkSk',
        'kSSSSSSSSSSk',
        'kkkkkkkkkkkk',
      ],
    ],
  },

  goldenForm: {
    palette: { k: '#7a5200', y: '#ffd166', Y: '#fff1b8', o: '#e0a800' },
    frames: [[
      'kkkkkkkkk.',
      'kYYYYYYYkk',
      'kYyyyyyyYk',
      'kYokooyyYk',
      'kYyyyyyyYk',
      'kYookoyyYk',
      'kYyyyyyyYk',
      'kYyyyokoYk',
      'kYYYYYYYYk',
      'kkkkkkkkkk',
    ]],
  },
};

/** Valida que todas las filas de cada fotograma tengan la misma anchura. */
export function validatePixelArt(art = PIXEL_ART) {
  const errors = [];
  for (const [name, def] of Object.entries(art)) {
    def.frames.forEach((frame, fi) => {
      const w = frame[0].length;
      frame.forEach((row, ri) => {
        if (row.length !== w) errors.push(`${name}[${fi}] fila ${ri}: ${row.length} ≠ ${w}`);
        for (const ch of row) if (ch !== '.' && !(ch in def.palette)) errors.push(`${name}[${fi}] fila ${ri}: color «${ch}» sin paleta`);
      });
    });
  }
  return errors;
}

/** Convierte un sprite en un canvas por fotograma (solo en navegador). */
export function rasterize(def) {
  return def.frames.map((frame) => {
    const h = frame.length;
    const w = Math.max(...frame.map((r) => r.length));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < frame[y].length; x++) {
        const ch = frame[y][x];
        if (ch === '.') continue;
        ctx.fillStyle = def.palette[ch] ?? '#ff00ff';
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return canvas;
  });
}

/** Versión recoloreada de un sprite (p. ej. impresora dimensional). */
export function recolor(def, map) {
  const palette = { ...def.palette };
  for (const [k, v] of Object.entries(map)) palette[k] = v;
  return { ...def, palette };
}
