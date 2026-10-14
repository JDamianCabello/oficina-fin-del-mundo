// Formato de números y tiempos en español.
//
// Convención (documentada en el README):
//   < 1.000           → 950 · 12,5 · 0,2
//   ≥ 1.000           → escala corta con sufijos de juego incremental:
//                       mil, M (millón, 1e6), B (1e9), T (1e12), Qa, Qi, Sx, Sp,
//                       Oc, No, Dc ... hasta 1e63.
//   > 1e63            → notación científica (1,23e66).
//   Ajuste «científica» → notación científica desde 1e6.
// Decimales: 2 si el valor escalado es < 10, 1 si es < 100, 0 si no, quitando
// ceros finales. Coma decimal. La precisión interna (double) no se toca: solo
// se redondea al mostrar. El máximo representable es ~1,79e308; la economía
// satura en ese valor en lugar de producir Infinity.

const SUFFIXES = ['', 'mil', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc',
  'UDc', 'DDc', 'TDc', 'QaDc', 'QiDc', 'SxDc', 'SpDc', 'OcDc', 'NoDc', 'Vg'];

let notation = 'short';

export function setNotation(value) {
  notation = value === 'scientific' ? 'scientific' : 'short';
}

function trimDecimals(value, decimals) {
  // toFixed y luego quitar ceros finales; coma decimal.
  let s = value.toFixed(decimals);
  if (s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '');
  return s.replace('.', ',');
}

function decimalsFor(value) {
  if (value < 10) return 2;
  if (value < 100) return 1;
  return 0;
}

function scientific(n) {
  const exp = Math.floor(Math.log10(n));
  let mantissa = n / Math.pow(10, exp);
  let e = exp;
  if (Number(mantissa.toFixed(2)) >= 10) {
    mantissa /= 10;
    e += 1;
  }
  return `${trimDecimals(mantissa, 2)}e${e}`;
}

/** Formatea una cantidad para mostrar. */
export function formatNumber(n, { forceDecimals = false } = {}) {
  if (typeof n !== 'number' || Number.isNaN(n)) return '0';
  if (!Number.isFinite(n)) return n > 0 ? '∞' : '-∞';
  if (n < 0) return `-${formatNumber(-n, { forceDecimals })}`;
  if (n < 1000) {
    if (Number.isInteger(n) && !forceDecimals) return String(n);
    if (n < 100) return trimDecimals(n, n < 10 ? 2 : 1);
    return String(Math.floor(n));
  }
  if (notation === 'scientific' && n >= 1e6) return scientific(n);
  let tier = Math.floor(Math.log10(n) / 3);
  if (tier >= SUFFIXES.length) return scientific(n);
  let scaled = n / Math.pow(1000, tier);
  let decimals = decimalsFor(scaled);
  // El redondeo puede convertir 999,99 en 1000: subir de nivel.
  if (Number(scaled.toFixed(decimals)) >= 1000) {
    tier += 1;
    if (tier >= SUFFIXES.length) return scientific(n);
    scaled /= 1000;
    decimals = decimalsFor(scaled);
  }
  return `${trimDecimals(scaled, decimals)} ${SUFFIXES[tier]}`;
}

/** Cantidad entera con separador de miles (para contadores: 1.234). */
export function formatInteger(n) {
  if (typeof n !== 'number' || !Number.isFinite(n)) return '0';
  if (n >= 1e15) return formatNumber(n);
  const s = String(Math.floor(Math.abs(n)));
  const grouped = s.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return n < 0 ? `-${grouped}` : grouped;
}

/** Duración legible: «45 s», «3 min 20 s», «2 h 5 min», «3 d 4 h». */
export function formatDuration(seconds) {
  if (typeof seconds !== 'number' || !Number.isFinite(seconds) || seconds < 0) return '0 s';
  const s = Math.floor(seconds);
  if (s < 60) return `${s} s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ${s % 60} s`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h ${m % 60} min`;
  const d = Math.floor(h / 24);
  return `${d} d ${h % 24} h`;
}

export function formatPercent(fraction, decimals = 0) {
  if (!Number.isFinite(fraction)) return '0 %';
  return `${trimDecimals(fraction * 100, decimals)} %`;
}

export function formatMultiplier(m) {
  if (!Number.isFinite(m)) return '×?';
  return `×${m >= 1000 ? formatNumber(m) : trimDecimals(m, m < 10 ? 2 : 1)}`;
}
