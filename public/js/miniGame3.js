// ============================================================
// Mini-Game 3: Sliders
// ============================================================

import { state, $ } from './state.js';
import { MSG, PHASES, MG3_SLIDERS } from '../data.js';
import { send } from './ws.js';
import { haptic } from './utils.js';

export function createMiniGame3Template() {
  const section = document.createElement('section');
  section.id = 'screen-mg3';
  section.className = 'screen';
  section.innerHTML = `
    <div class="screen-content game-content">
      <div class="game-header">
        <span class="phase-indicator">Ronda 3/3 \u2014 Prioridades</span>
      </div>
      <div class="timer-container">
        <div id="mg3-timer-bar" class="timer-bar">
          <div class="timer-bar-fill" style="width: 100%"></div>
        </div>
        <span id="mg3-timer" class="timer-number">40</span>
      </div>
      <div id="mg3-sliders" class="sliders-container"></div>
      <button id="mg3-confirm" class="btn btn-primary">Confirmar</button>
      <div id="mg3-partner-status" class="partner-status hidden">
        <span class="pulse-dot"></span>
        <span>El otro jugador est\u00E1 ajustando...</span>
      </div>
    </div>`;
  return section;
}

export function renderMiniGame3Sliders() {
  state.answered = false;
  state.partnerAnswered = false;

  const container = $('mg3-sliders');
  container.innerHTML = '';

  MG3_SLIDERS.forEach((slider) => {
    const row = document.createElement('div');
    row.className = 'slider-row';

    const label = document.createElement('label');
    label.className = 'slider-label';
    label.textContent = slider.label;
    label.setAttribute('for', `slider-${slider.id}`);

    const inputWrap = document.createElement('div');
    inputWrap.className = 'slider-input-wrap';

    const minLabel = document.createElement('span');
    minLabel.className = 'slider-bound';
    minLabel.textContent = slider.min;

    const input = document.createElement('input');
    input.type = 'range';
    input.id = `slider-${slider.id}`;
    input.className = 'slider-range';
    input.min = slider.min;
    input.max = slider.max;
    input.value = slider.defaultValue;
    input.step = 1;
    input.dataset.tagId = slider.id;

    const maxLabel = document.createElement('span');
    maxLabel.className = 'slider-bound';
    maxLabel.textContent = slider.max;

    const valueDisplay = document.createElement('span');
    valueDisplay.className = 'slider-value';
    valueDisplay.id = `slider-val-${slider.id}`;
    valueDisplay.textContent = slider.defaultValue;

    input.addEventListener('input', () => {
      valueDisplay.textContent = input.value;
      haptic();
      const pct = ((input.value - slider.min) / (slider.max - slider.min)) * 100;
      input.style.setProperty('--slider-pct', `${pct}%`);
    });

    const initialPct = ((slider.defaultValue - slider.min) / (slider.max - slider.min)) * 100;
    input.style.setProperty('--slider-pct', `${initialPct}%`);

    inputWrap.appendChild(minLabel);
    inputWrap.appendChild(input);
    inputWrap.appendChild(maxLabel);

    row.appendChild(label);
    row.appendChild(inputWrap);
    row.appendChild(valueDisplay);
    container.appendChild(row);
  });

  $('mg3-confirm').disabled = false;
  $('mg3-partner-status').classList.add('hidden');
}

export function setupMiniGame3() {
  $('mg3-confirm').addEventListener('click', () => {
    if (state.answered) return;
    haptic('heavy');
    state.answered = true;

    const answer = {};
    MG3_SLIDERS.forEach((slider) => {
      const input = $(`slider-${slider.id}`);
      answer[slider.id] = parseInt(input.value, 10);
    });

    send({ type: MSG.SUBMIT_ANSWER, phase: PHASES.MG3, answer });

    $('mg3-confirm').disabled = true;
    $('mg3-sliders').querySelectorAll('input[type="range"]').forEach((inp) => {
      inp.disabled = true;
    });

    if (!state.partnerAnswered) $('mg3-partner-status').classList.remove('hidden');
  });
}
