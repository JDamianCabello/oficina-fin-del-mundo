// Misiones activas, lista de departamentos y objetivo principal (panel derecho).

import { el, $, clear, setText, setAttr, setDisabled } from '../dom.js';
import { getActiveMissions, isMissionComplete, describeMissionReward, getMissionRewardAmount } from '../../systems/missions.js';
import { MISSIONS } from '../../config/missions.data.js';
import { DEPARTMENTS } from '../../config/departments.data.js';
import {
  isFeatureUnlocked, getNextDepartment, describeRequirementWithProgress, requirementRatio, checkRequirement,
} from '../../core/progression.js';
import { UPGRADES_BY_ID } from '../../config/upgrades.data.js';
import { getUpgradeCost } from '../../systems/upgrades.js';
import { canPrestige, getPrestigeGain } from '../../systems/prestige.js';
import { canMerge, getMergerGain } from '../../systems/merger.js';
import { formatNumber } from '../../utils/format.js';

export function createMissionsView({ getState, actions }) {
  const list = $('#mission-list');
  const counter = $('#missions-count');
  const depList = $('#department-list');
  const objective = $('#objective');
  let key = '';
  let depKey = '';
  let refs = [];

  function build(state, missions) {
    clear(list);
    refs = [];
    if (!isFeatureUnlocked(state, 'missions')) {
      list.append(el('li', { class: 'empty', text: 'Las misiones llegan con la Planta de Explotación Laboral (nivel 2).' }));
      return;
    }
    if (!missions.length) {
      list.append(el('li', { class: 'empty', text: '¡Has completado todas las misiones de este ciclo! Asciende para repetirlas.' }));
      return;
    }
    for (const m of missions) {
      const bar = el('div', { class: 'progress__bar' });
      const progressText = el('div', { class: 'mission__desc' });
      const reward = el('div', { class: 'mission__reward' });
      const button = el('button', { type: 'button', class: 'btn btn--primary btn--small', text: 'Reclamar', onClick: () => actions.claimMission(m.id) });
      const node = el('li', { class: 'mission', dataset: { id: m.id } }, [
        el('div', {}, [
          el('div', { class: 'mission__name', text: m.name }),
          el('div', { class: 'mission__desc', text: m.description }),
          progressText,
          reward,
        ]),
        button,
        el('div', { class: 'progress', role: 'progressbar', 'aria-label': `Progreso: ${m.name}` }, [bar]),
      ]);
      list.append(node);
      refs.push({ m, node, bar, progressText, reward, button });
    }
  }

  function buildDepartments(state) {
    clear(depList);
    for (const d of DEPARTMENTS) {
      const unlocked = state.unlockedDepartments.includes(d.id);
      const isNext = getNextDepartment(state)?.id === d.id;
      depList.append(el('li', { class: `department-item${isNext ? ' department-item--next' : ''}`, dataset: { unlocked: String(unlocked) } }, [
        el('div', { class: 'department-item__name', text: `${d.title}` }),
        el('div', { class: 'department-item__desc', text: `${d.name}: ${d.description}` }),
        !unlocked && d.requirements.length
          ? el('div', { class: 'department-item__how', text: `Cómo desbloquearlo: ${d.howToUnlock}` })
          : null,
        !unlocked && d.requirements.length
          ? el('div', { class: 'department-item__desc', text: `Progreso: ${d.requirements.map((r) => describeRequirementWithProgress(state, r)).join(' · ')}` })
          : null,
        unlocked && d.finalGoal && !state.upgrades.includes('form405C')
          ? el('div', { class: 'department-item__how', text: d.finalGoal })
          : null,
      ]));
    }
  }

  function update(state, { visible }) {
    const missions = getActiveMissions(state);
    const k = `${isFeatureUnlocked(state, 'missions')}|${missions.map((m) => m.id).join(',')}`;
    if (k !== key) {
      key = k;
      build(state, missions);
    }
    setText(counter, `${state.missions.claimed.length}/${MISSIONS.length} en este ciclo`);
    for (const r of refs) {
      const done = isMissionComplete(state, r.m.id);
      r.node.dataset.complete = String(done);
      const ratio = requirementRatio(state, r.m.requirement);
      r.bar.style.width = `${Math.round(ratio * 100)}%`;
      setAttr(r.bar.parentElement, 'aria-valuenow', Math.round(ratio * 100));
      setText(r.progressText, describeRequirementWithProgress(state, r.m.requirement));
      const amount = getMissionRewardAmount(state, r.m);
      setText(r.reward, `Recompensa: ${amount > 0 ? `${formatNumber(amount)} de papeleo` : describeMissionReward(r.m)}`);
      setDisabled(r.button, !done);
      setText(r.button, done ? 'Reclamar' : 'En curso');
    }
    if (visible) {
      const dk = `${state.unlockedDepartments.join(',')}|${Math.floor(Date.now() / 2000)}`;
      if (dk !== depKey) {
        depKey = dk;
        buildDepartments(state);
      }
    }
    updateObjective(state);
  }

  let objectiveKey = '';

  /** Tarjeta «Objetivo actual» con el siguiente departamento o meta final. */
  function updateObjective(state) {
    const next = getNextDepartment(state);
    let label;
    let title;
    let items = [];
    let note = '';
    let how = '';
    if (next) {
      label = `Cómo pasar al nivel ${next.level}`;
      title = next.title;
      how = next.howToUnlock;
      items = next.requirements.map((r) => [checkRequirement(state, r), describeRequirementWithProgress(state, r)]);
    } else if (!state.upgrades.includes('form405C')) {
      const finalDept = DEPARTMENTS[DEPARTMENTS.length - 1];
      const final = UPGRADES_BY_ID.form405C;
      const cost = getUpgradeCost(state, 'form405C');
      label = 'Meta final del juego';
      title = 'Firmar el Formulario 405-C';
      how = finalDept.finalGoal;
      items = final.requirements.map((r) => [checkRequirement(state, r), describeRequirementWithProgress(state, r)]);
      items.push([state.resources.paperwork >= cost, `Reunir ${formatNumber(cost)} de papeleo`]);
    } else {
      label = 'Meta';
      title = 'Has recurrido el fin del mundo. ¿Y ahora?';
      note = canMerge(state)
        ? `Fusiónate con el multiverso (pestaña Prestigio) para ganar ${formatNumber(getMergerGain(state))} Acciones.`
        : canPrestige(state)
          ? `Asciende para ganar ${formatNumber(getPrestigeGain(state))} de Influencia y acercarte a tu próxima Acción.`
          : 'Completa los logros, talentos y ventajas del Consejo pendientes.';
    }
    const k = JSON.stringify([label, title, how, items, note]);
    if (k === objectiveKey) return;
    objectiveKey = k;
    clear(objective);
    const reqs = el('ul', { class: 'objective__reqs' }, items.map(([done, text]) => el('li', { dataset: { done: String(done) }, text })));
    objective.append(...[
      el('div', { class: 'objective__label', text: label }),
      el('div', { class: 'objective__title', text: title }),
      how ? el('p', { class: 'objective__how', text: how }) : null,
      items.length ? reqs : null,
      note ? el('p', { class: 'mission__desc', text: note }) : null,
    ].filter(Boolean));
  }

  function completeCount(state) {
    return getActiveMissions(state).filter((m) => isMissionComplete(state, m.id)).length;
  }

  return { update, completeCount, invalidate: () => { key = ''; depKey = ''; } };
}
