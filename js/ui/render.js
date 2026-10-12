// Renderizado de la interfaz. Refresca la barra superior a ~10 Hz y las vistas
// visibles a ~4 Hz, cambiando solo los nodos cuyo contenido ha variado.
// La interfaz representa el estado: no guarda ninguna economía propia.

import { $, el, clear, setText, setAttr } from './dom.js';
import { isViewVisible } from './navigation.js';
import { getTotalRate, getClickValue, getPrestigeMultiplier, getModifiers, isIdleBonusActive } from '../core/economy.js';
import { getCurrentDepartment, isFeatureUnlocked } from '../core/progression.js';
import { canPrestige } from '../systems/prestige.js';
import { formatNumber, formatPercent } from '../utils/format.js';
import { createBuildingsView } from './views/buildingsView.js';
import { createUpgradesView } from './views/upgradesView.js';
import { createMissionsView } from './views/missionsView.js';
import { createTalentsView } from './views/talentsView.js';
import { createAchievementsView } from './views/achievementsView.js';
import { createPrestigeView } from './views/prestigeView.js';
import { createStatsView } from './views/statsView.js';

const HEADLINES = {
  basement: [
    'ÚLTIMA HORA: el sótano se inunda de formularios; los becarios aprenden a nadar en papel',
    'La impresora vuelve a funcionar tras una sesión de terapia',
    'Estudio revela que el 99 % de los sellos no sirven para nada; el 1 % restante, tampoco',
  ],
  exploitation: [
    'Las palomas contables exigen migas en nómina',
    'Récord de reuniones: 14 seguidas sin decidir nada',
    'Nuevo protocolo: para pedir un bolígrafo hay que rellenar el formulario B-1',
  ],
  hellHR: [
    'RR. HH. confirma que el infierno cumple la normativa de seguridad laboral (más o menos)',
    'El jefe se clona otra vez; el original pide un clon de vacaciones',
    'El reactor burocrático alcanza masa crítica de expedientes',
  ],
  multinational: [
    'La empresa abre sede en una dimensión donde el lunes no existe',
    'Los becarios interdimensionales reclaman dietas en seis monedas',
    'Accionistas aplauden: el multiverso es el nuevo mercado emergente',
  ],
  adminGod: [
    'Dios pide cita previa. Le dan para dentro de tres eternidades',
    'El universo entra en mantenimiento programado de 3:00 a 5:00',
    'Se busca: alguien que sepa dónde está el formulario 404-B original',
  ],
};

export function createRenderer({ getState, actions }) {
  const refs = {
    paperwork: $('#res-paperwork'),
    rate: $('#res-rate'),
    influence: $('#res-influence'),
    influenceBonus: $('#res-influence-bonus'),
    clickValue: $('#click-value'),
    depLevel: $('#department-level'),
    depName: $('#department-name'),
    tempEffects: $('#temp-effects'),
    golden: $('#golden-form'),
    ticker: $('#ticker'),
    hint: $('#scene-hint'),
    badges: {
      upgrades: $('#badge-upgrades'),
      talents: $('#badge-talents'),
      achievements: $('#badge-achievements'),
      missions: $('#badge-missions'),
      prestige: $('#badge-prestige'),
    },
    tabs: {
      talents: $('#tab-talents'),
      prestige: $('#tab-prestige'),
      missions: $('#tab-missions'),
    },
  };

  const views = {
    buildings: createBuildingsView({ getState, actions }),
    upgrades: createUpgradesView({ getState, actions }),
    missions: createMissionsView({ getState, actions }),
    talents: createTalentsView({ getState, actions }),
    achievements: createAchievementsView({ getState, actions }),
    prestige: createPrestigeView({ getState, actions }),
    stats: createStatsView({ getState, actions }),
  };

  let tickerKey = '';
  let tempKey = '';
  let seenAchievements = null;
  let lastPanels = 0;

  function updateTopbar(state) {
    setText(refs.paperwork, formatNumber(state.resources.paperwork));
    setText(refs.rate, formatNumber(getTotalRate(state)));
    setText(refs.influence, formatNumber(Math.floor(state.resources.influence)));
    const bonus = getPrestigeMultiplier(state) - 1;
    setText(refs.influenceBonus, `+${formatPercent(bonus)} prod.`);
    const mods = getModifiers(state);
    const crit = mods.critChance > 0 ? ` · ${formatPercent(mods.critChance)} crítico` : '';
    const idle = isIdleBonusActive(state) ? ' · bonus de inactividad activo' : '';
    setText(refs.clickValue, `+${formatNumber(getClickValue(state))} por clic${crit}${idle}`);
  }

  function updateScenePanel(state) {
    const dep = getCurrentDepartment(state);
    setText(refs.depLevel, `Nivel ${dep.level}`);
    setText(refs.depName, dep.name);
    // Efectos temporales
    const k = state.temp.effects.map((e) => `${e.id}:${Math.ceil(e.remaining)}`).join(',');
    if (k !== tempKey) {
      tempKey = k;
      clear(refs.tempEffects);
      for (const e of state.temp.effects) {
        const bad = e.effects.some((x) => typeof x.value === 'number' && x.value < 1);
        refs.tempEffects.append(el('li', { class: `temp-effect ${bad ? 'temp-effect--bad' : 'temp-effect--good'}`, text: `${e.label} · ${Math.ceil(e.remaining)} s` }));
      }
    }
    // Formulario dorado
    const g = state.temp.golden;
    if (g) {
      refs.golden.hidden = false;
      refs.golden.style.left = `${g.x * 100}%`;
      refs.golden.style.top = `${g.y * 100}%`;
    } else if (!refs.golden.hidden) {
      refs.golden.hidden = true;
    }
    // Pista inicial
    refs.hint.hidden = state.statistics.totalClicks >= 15;
    // Teletipo
    const tk = dep.id;
    if (tk !== tickerKey) {
      tickerKey = tk;
      setText(refs.ticker, (HEADLINES[dep.id] ?? HEADLINES.basement).join('   ✦   '));
    }
  }

  function setBadge(node, value) {
    if (!node) return;
    const show = Boolean(value);
    if (node.hidden === show) node.hidden = !show;
    if (show) setText(node, value === true ? '!' : value);
  }

  function updateBadges(state) {
    setBadge(refs.badges.upgrades, views.upgrades.affordableCount(state));
    setBadge(refs.badges.missions, views.missions.completeCount(state));
    setBadge(refs.badges.talents, views.talents.availableCount(state));
    setBadge(refs.badges.prestige, canPrestige(state) ? true : 0);
    const unlockedCount = Object.keys(state.achievements).length;
    if (seenAchievements === null) seenAchievements = unlockedCount;
    if (isViewVisible('achievements')) seenAchievements = unlockedCount;
    setBadge(refs.badges.achievements, Math.max(0, unlockedCount - seenAchievements));
    setAttr(refs.tabs.talents, 'data-locked', String(!isFeatureUnlocked(state, 'talents')));
    setAttr(refs.tabs.prestige, 'data-locked', String(!isFeatureUnlocked(state, 'prestige')));
    setAttr(refs.tabs.missions, 'data-locked', String(!isFeatureUnlocked(state, 'missions')));
  }

  function updatePanels(state) {
    for (const [name, view] of Object.entries(views)) {
      const visible = isViewVisible(name);
      // Edificios y mejoras: solo si se ven. Misiones: siempre (alimenta el objetivo).
      if (name === 'missions' || visible || name === 'achievements') view.update(state, { visible });
    }
    updateBadges(state);
  }

  return {
    /** Llamar ~10 veces por segundo. */
    frame(force = false) {
      const state = getState();
      updateTopbar(state);
      updateScenePanel(state);
      const now = performance.now();
      if (force || now - lastPanels > 250) {
        lastPanels = now;
        updatePanels(state);
      }
    },
    /** Fuerza la reconstrucción de las listas (cambio de estructura). */
    invalidate() {
      for (const v of Object.values(views)) v.invalidate?.();
      tempKey = '';
      tickerKey = '';
      lastPanels = 0;
    },
    resetAchievementBadge() {
      seenAchievements = null;
    },
  };
}
