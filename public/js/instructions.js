// ============================================================
// Instructions Screen
// ============================================================

import { state, $ } from './state.js';
import { PHASES, INSTRUCTIONS } from '../data.js';
import { send } from './ws.js';
import { showScreen } from './screens.js';
import { haptic } from './utils.js';
import { clearTimers } from './timers.js';

export function createInstructionsTemplate() {
  const section = document.createElement('section');
  section.id = 'screen-instructions';
  section.className = 'screen';
  section.innerHTML = `
    <div class="screen-content instructions-content">
      <div id="instr-icon" class="instr-icon"></div>
      <h2 id="instr-title" class="instr-title"></h2>
      <p id="instr-subtitle" class="instr-subtitle"></p>
      <ul id="instr-rules" class="instr-rules"></ul>
      <button id="btn-instr-next" class="btn btn-primary">Siguiente</button>
      <div id="instr-partner-status" class="partner-status hidden">
        <span class="pulse-dot"></span>
        <span>Esperando al otro jugador...</span>
      </div>
      <div class="instr-auto">Avanza autom\u00E1ticamente en <span id="instr-countdown">5</span>s</div>
    </div>`;
  return section;
}

export function showInstructions(phase) {
  let instrKey;
  if (phase === PHASES.MG1) instrKey = 'mg1';
  else if (phase === PHASES.MG2_IMPORTANT || phase === PHASES.MG2_NOWANT) instrKey = 'mg2';
  else if (phase === PHASES.MG3) instrKey = 'mg3';
  else return;

  const instr = INSTRUCTIONS[instrKey];
  if (!instr) return;

  showScreen('screen-instructions');
  state.instructionsSent = false;

  $('instr-icon').textContent = instr.icon;
  $('instr-title').textContent = instr.title;
  $('instr-subtitle').textContent = instr.subtitle;

  const rulesEl = $('instr-rules');
  rulesEl.innerHTML = '';
  instr.rules.forEach((rule) => {
    const li = document.createElement('li');
    li.textContent = rule;
    rulesEl.appendChild(li);
  });

  const btn = $('btn-instr-next');
  btn.disabled = false;
  btn.textContent = 'Siguiente';

  const waitingEl = $('instr-partner-status');
  if (waitingEl) waitingEl.classList.add('hidden');

  const autoEl = document.querySelector('.instr-auto');
  if (autoEl) autoEl.classList.add('hidden');

  clearTimers();
}

function sendInstructionsDone() {
  if (state.instructionsSent) return;
  state.instructionsSent = true;
  send({ type: 'instructions_done', phase: state.currentPhase });

  const btn = $('btn-instr-next');
  btn.disabled = true;
  btn.textContent = 'Esperando...';

  if (!state.soloMode) {
    const waitingEl = $('instr-partner-status');
    if (waitingEl) waitingEl.classList.remove('hidden');
  }
}

export function showPartnerInstructionsReady() {
  const waitingEl = $('instr-partner-status');
  if (waitingEl && !state.instructionsSent) {
    waitingEl.classList.remove('hidden');
    waitingEl.textContent = 'El otro jugador ya est\u00E1 listo';
  }
}

export function setupInstructions() {
  $('btn-instr-next').addEventListener('click', () => {
    haptic();
    clearTimers();
    sendInstructionsDone();
  });
}
