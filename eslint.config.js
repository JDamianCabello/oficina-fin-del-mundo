// Configuración mínima de ESLint (sin dependencias: reglas básicas a mano).
const browserGlobals = [
  'window', 'document', 'localStorage', 'performance', 'requestAnimationFrame', 'setTimeout', 'setInterval',
  'clearTimeout', 'clearInterval', 'console', 'navigator', 'Blob', 'URL', 'Image', 'Node', 'structuredClone',
  'globalThis', 'process', 'ResizeObserver', 'sessionStorage',
];

export default [
  {
    files: ['js/**/*.js', 'tests/**/*.js', 'tests/**/*.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: Object.fromEntries(browserGlobals.map((g) => [g, 'readonly'])),
    },
    rules: {
      'no-unused-vars': ['error', { args: 'none' }],
      'no-undef': 'error',
      'no-unreachable': 'error',
      'no-dupe-keys': 'error',
      'no-redeclare': 'error',
      'no-self-assign': 'error',
      'no-constant-condition': ['error', { checkLoops: false }],
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'prefer-const': 'error',
      'eqeqeq': ['error', 'smart'],
    },
  },
];
