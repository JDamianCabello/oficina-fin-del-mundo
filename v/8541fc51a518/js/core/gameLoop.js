// Bucle de simulación económica (independiente del renderizado).
//
// Tres procesos separados:
//   1. Simulación: setInterval cada TICK_MS con delta de tiempo real medido con
//      performance.now() (reloj monótono). Ver createGameLoop().
//   2. Interfaz: js/ui/render.js refresca cifras unas pocas veces por segundo.
//   3. Animación: js/ui/scene.js y js/ui/particles.js usan requestAnimationFrame.
//
// Si el navegador congela la pestaña o el equipo se suspende, la diferencia
// entre el reloj de pared (Date.now) y el delta acumulado se trata como tiempo
// offline (con sus límites y eficiencia) en lugar de simularse tick a tick.

import { produce, getPps } from './economy.js';
import { checkDepartments } from './progression.js';
import { tickTempEffects } from '../systems/effects.js';
import { updateRandomEvents, updateGolden } from '../systems/randomEvents.js';
import { checkAchievements, PERIODIC_TOPICS } from '../systems/achievements.js';

export const TICK_MS = 100;
export const MAX_STEP_SECONDS = 1; // un tick nunca simula más de 1 s
// Huecos mayores → offline. Chrome despierta las pestañas en segundo plano
// como mínimo una vez por minuto («intensive throttling»); esos ticks de ~60 s
// se simulan con normalidad, y solo una suspensión real cuenta como offline.
export const GAP_THRESHOLD_SECONDS = 120;

/**
 * Avanza la simulación `dt` segundos: producción, contadores, efectos
 * temporales, eventos y formularios dorados. No toca el DOM.
 */
export function simulateStep(state, dt, rng = Math.random) {
  if (!(dt > 0)) return;
  const step = Math.min(dt, MAX_STEP_SECONDS);
  produce(state, step);
  const s = state.statistics;
  s.playTimeSeconds += step;
  s.cyclePlayTime += step;
  state.temp.secondsSinceClick += step;
  tickTempEffects(state, step);
  updateRandomEvents(state, step, rng);
  updateGolden(state, step, rng);
}

/**
 * Comprobaciones de progresión (más caras que un tick): departamentos,
 * logros de temas continuos y récords. Se llama ~2 veces por segundo.
 */
export function runChecks(state, extraTopics = []) {
  const pps = getPps(state);
  if (pps > state.statistics.bestPps) state.statistics.bestPps = pps;
  const ctx = { pps };
  const departments = checkDepartments(state, ctx);
  const topics = new Set([...PERIODIC_TOPICS, ...extraTopics]);
  if (departments.length) topics.add('departments');
  return { departments, achievements: checkAchievements(state, [...topics], ctx) };
}

/**
 * Crea el bucle. `onStep(dt)` recibe el delta en segundos; `onGap(seconds)`
 * recibe huecos largos (suspensión, pestaña congelada).
 */
export function createGameLoop({ onStep, onGap, tickMs = TICK_MS }) {
  let timer = null;
  let lastPerf = 0;
  let lastWall = 0;

  function tick() {
    const perf = performance.now();
    const wall = Date.now();
    const dt = Math.max(0, (perf - lastPerf) / 1000);
    const wallDt = (wall - lastWall) / 1000;
    lastPerf = perf;
    lastWall = wall;
    // El reloj monótono puede no avanzar durante una suspensión: usamos el
    // mayor de los dos si el de pared es razonable (no ha ido hacia atrás).
    const elapsed = wallDt >= 0 ? Math.max(dt, wallDt) : dt;
    if (elapsed > GAP_THRESHOLD_SECONDS) {
      onGap?.(elapsed);
      return;
    }
    // Pestañas en segundo plano: el navegador espacia los ticks (~1 s);
    // repartimos en pasos de como mucho MAX_STEP_SECONDS.
    let remaining = elapsed;
    while (remaining > 0) {
      const step = Math.min(remaining, MAX_STEP_SECONDS);
      onStep(step);
      remaining -= step;
    }
  }

  return {
    start() {
      if (timer) return;
      lastPerf = performance.now();
      lastWall = Date.now();
      timer = setInterval(tick, tickMs);
    },
    stop() {
      clearInterval(timer);
      timer = null;
    },
    /** Reinicia las referencias de tiempo (tras cargar o aplicar offline). */
    resync() {
      lastPerf = performance.now();
      lastWall = Date.now();
    },
    get running() {
      return timer !== null;
    },
  };
}
