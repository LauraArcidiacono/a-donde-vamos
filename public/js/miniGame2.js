// ============================================================
// Mini-Game 2: Important & No Want
// ============================================================

import { state, $ } from './state.js';
import { MSG, PHASES, MG2_IMPORTANT_OPTIONS, MG2_NOWANT_OPTIONS } from '../data.js';
import { send } from './ws.js';
import { haptic } from './utils.js';

const SEARCH_SVG = `<svg class="search-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="11" cy="11" r="8"/>
  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
</svg>`;

const MG2_CONFIGS = {
  important: {
    screenId: 'screen-mg2-important',
    prefix: 'mg2i',
    headerText: 'Ronda 2/3 \u2014 Muy Importante',
    options: MG2_IMPORTANT_OPTIONS,
    chipClass: 'chip',
    phase: PHASES.MG2_IMPORTANT,
  },
  nowant: {
    screenId: 'screen-mg2-nowant',
    prefix: 'mg2n',
    headerText: 'Ronda 2/3 \u2014 NO Quiero',
    options: MG2_NOWANT_OPTIONS,
    chipClass: 'chip chip-nowant',
    phase: PHASES.MG2_NOWANT,
  },
};

function createMG2Screen(cfg) {
  return `
    <section id="${cfg.screenId}" class="screen">
      <div class="screen-content game-content">
        <div class="game-header">
          <span class="phase-indicator">${cfg.headerText}</span>
        </div>
        <div class="timer-container">
          <div id="${cfg.prefix}-timer-bar" class="timer-bar">
            <div class="timer-bar-fill" style="width: 100%"></div>
          </div>
          <span id="${cfg.prefix}-timer" class="timer-number">40</span>
        </div>
        <div class="search-wrapper">
          ${SEARCH_SVG}
          <input id="${cfg.prefix}-search" type="text" class="search-input" placeholder="Buscar...">
        </div>
        <p id="${cfg.prefix}-count" class="selection-counter">0/3 seleccionadas</p>
        <div id="${cfg.prefix}-options" class="options-grid scrollable"></div>
        <button id="${cfg.prefix}-confirm" class="btn btn-primary" disabled>Confirmar</button>
        <div id="${cfg.prefix}-partner-status" class="partner-status hidden">
          <span class="pulse-dot"></span>
          <span>El otro jugador est\u00E1 eligiendo...</span>
        </div>
      </div>
    </section>`;
}

export function createMiniGame2Templates() {
  const frag = document.createDocumentFragment();
  const wrap = document.createElement('div');
  wrap.innerHTML = createMG2Screen(MG2_CONFIGS.important) + createMG2Screen(MG2_CONFIGS.nowant);
  while (wrap.firstChild) frag.appendChild(wrap.firstChild);
  return frag;
}

function renderMG2(cfg) {
  state.currentSelections = [];
  state.answered = false;
  state.partnerAnswered = false;

  const container = $(`${cfg.prefix}-options`);
  container.innerHTML = '';

  cfg.options.forEach((opt) => {
    const chip = document.createElement('button');
    chip.className = cfg.chipClass;
    chip.dataset.id = opt.id;
    chip.innerHTML = `<span class="chip-icon">${opt.icon}</span><span class="chip-label">${opt.label}</span>`;
    container.appendChild(chip);
  });

  $(`${cfg.prefix}-search`).value = '';
  $(`${cfg.prefix}-count`).textContent = '0/3 seleccionadas';
  $(`${cfg.prefix}-confirm`).disabled = true;
  $(`${cfg.prefix}-partner-status`).classList.add('hidden');
}

function setupMG2(cfg) {
  $(`${cfg.prefix}-options`).addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip || chip.classList.contains('disabled') || state.answered) return;

    haptic();
    const optionId = chip.dataset.id;

    if (chip.classList.contains('selected')) {
      chip.classList.remove('selected');
      state.currentSelections = state.currentSelections.filter((id) => id !== optionId);
      $(`${cfg.prefix}-options`).querySelectorAll('.chip').forEach((c) => c.classList.remove('disabled'));
    } else {
      if (state.currentSelections.length < 3) {
        chip.classList.add('selected');
        state.currentSelections.push(optionId);
        if (state.currentSelections.length >= 3) {
          $(`${cfg.prefix}-options`).querySelectorAll('.chip').forEach((c) => {
            if (!c.classList.contains('selected')) c.classList.add('disabled');
          });
        }
      }
    }

    $(`${cfg.prefix}-count`).textContent = `${state.currentSelections.length}/3 seleccionadas`;
    $(`${cfg.prefix}-confirm`).disabled = state.currentSelections.length !== 3;
  });

  $(`${cfg.prefix}-search`).addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    $(`${cfg.prefix}-options`).querySelectorAll('.chip').forEach((chip) => {
      const label = chip.querySelector('.chip-label').textContent.toLowerCase();
      chip.style.display = (query === '' || label.includes(query)) ? '' : 'none';
    });
  });

  $(`${cfg.prefix}-confirm`).addEventListener('click', () => {
    if (state.currentSelections.length !== 3 || state.answered) return;
    haptic('heavy');
    state.answered = true;

    send({ type: MSG.SUBMIT_ANSWER, phase: cfg.phase, answer: [...state.currentSelections] });

    $(`${cfg.prefix}-confirm`).disabled = true;
    $(`${cfg.prefix}-options`).querySelectorAll('.chip').forEach((c) => c.classList.add('disabled'));

    if (!state.partnerAnswered) $(`${cfg.prefix}-partner-status`).classList.remove('hidden');
  });
}

export function renderMiniGame2Important() { renderMG2(MG2_CONFIGS.important); }
export function renderMiniGame2NoWant()    { renderMG2(MG2_CONFIGS.nowant); }
export function setupMiniGame2Important()  { setupMG2(MG2_CONFIGS.important); }
export function setupMiniGame2NoWant()     { setupMG2(MG2_CONFIGS.nowant); }
