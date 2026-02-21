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

export function createMiniGame2Templates() {
  const frag = document.createDocumentFragment();
  const wrap = document.createElement('div');
  wrap.innerHTML = `
    <section id="screen-mg2-important" class="screen">
      <div class="screen-content game-content">
        <div class="game-header">
          <span class="phase-indicator">Ronda 2/3 \u2014 Muy Importante</span>
        </div>
        <div class="timer-container">
          <div id="mg2i-timer-bar" class="timer-bar">
            <div class="timer-bar-fill" style="width: 100%"></div>
          </div>
          <span id="mg2i-timer" class="timer-number">40</span>
        </div>
        <div class="search-wrapper">
          ${SEARCH_SVG}
          <input id="mg2i-search" type="text" class="search-input" placeholder="Buscar...">
        </div>
        <p id="mg2i-count" class="selection-counter">0/3 seleccionadas</p>
        <div id="mg2i-options" class="options-grid scrollable"></div>
        <button id="mg2i-confirm" class="btn btn-primary" disabled>Confirmar</button>
        <div id="mg2i-partner-status" class="partner-status hidden">
          <span class="pulse-dot"></span>
          <span>El otro jugador est\u00E1 eligiendo...</span>
        </div>
      </div>
    </section>
    <section id="screen-mg2-nowant" class="screen">
      <div class="screen-content game-content">
        <div class="game-header">
          <span class="phase-indicator">Ronda 2/3 \u2014 NO Quiero</span>
        </div>
        <div class="timer-container">
          <div id="mg2n-timer-bar" class="timer-bar">
            <div class="timer-bar-fill" style="width: 100%"></div>
          </div>
          <span id="mg2n-timer" class="timer-number">40</span>
        </div>
        <div class="search-wrapper">
          ${SEARCH_SVG}
          <input id="mg2n-search" type="text" class="search-input" placeholder="Buscar...">
        </div>
        <p id="mg2n-count" class="selection-counter">0/3 seleccionadas</p>
        <div id="mg2n-options" class="options-grid scrollable"></div>
        <button id="mg2n-confirm" class="btn btn-primary" disabled>Confirmar</button>
        <div id="mg2n-partner-status" class="partner-status hidden">
          <span class="pulse-dot"></span>
          <span>El otro jugador est\u00E1 eligiendo...</span>
        </div>
      </div>
    </section>`;
  while (wrap.firstChild) frag.appendChild(wrap.firstChild);
  return frag;
}

// ============================================================
// MG2 Important
// ============================================================

export function renderMiniGame2Important() {
  state.currentSelections = [];
  state.answered = false;
  state.partnerAnswered = false;

  const container = $('mg2i-options');
  container.innerHTML = '';

  MG2_IMPORTANT_OPTIONS.forEach((opt) => {
    const chip = document.createElement('button');
    chip.className = 'chip';
    chip.dataset.id = opt.id;
    chip.innerHTML = `<span class="chip-icon">${opt.icon}</span><span class="chip-label">${opt.label}</span>`;
    container.appendChild(chip);
  });

  $('mg2i-search').value = '';
  $('mg2i-count').textContent = '0/3 seleccionadas';
  $('mg2i-confirm').disabled = true;
  $('mg2i-partner-status').classList.add('hidden');
}

export function setupMiniGame2Important() {
  $('mg2i-options').addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip || chip.classList.contains('disabled') || state.answered) return;

    haptic();
    const optionId = chip.dataset.id;

    if (chip.classList.contains('selected')) {
      chip.classList.remove('selected');
      state.currentSelections = state.currentSelections.filter((id) => id !== optionId);
      $('mg2i-options').querySelectorAll('.chip').forEach((c) => c.classList.remove('disabled'));
    } else {
      if (state.currentSelections.length < 3) {
        chip.classList.add('selected');
        state.currentSelections.push(optionId);
        if (state.currentSelections.length >= 3) {
          $('mg2i-options').querySelectorAll('.chip').forEach((c) => {
            if (!c.classList.contains('selected')) c.classList.add('disabled');
          });
        }
      }
    }

    $('mg2i-count').textContent = `${state.currentSelections.length}/3 seleccionadas`;
    $('mg2i-confirm').disabled = state.currentSelections.length !== 3;
  });

  $('mg2i-search').addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    $('mg2i-options').querySelectorAll('.chip').forEach((chip) => {
      const label = chip.querySelector('.chip-label').textContent.toLowerCase();
      chip.style.display = (query === '' || label.includes(query)) ? '' : 'none';
    });
  });

  $('mg2i-confirm').addEventListener('click', () => {
    if (state.currentSelections.length !== 3 || state.answered) return;
    haptic('heavy');
    state.answered = true;

    send({ type: MSG.SUBMIT_ANSWER, phase: PHASES.MG2_IMPORTANT, answer: [...state.currentSelections] });

    $('mg2i-confirm').disabled = true;
    $('mg2i-options').querySelectorAll('.chip').forEach((c) => c.classList.add('disabled'));

    if (!state.partnerAnswered) $('mg2i-partner-status').classList.remove('hidden');
  });
}

// ============================================================
// MG2 No Want
// ============================================================

export function renderMiniGame2NoWant() {
  state.currentSelections = [];
  state.answered = false;
  state.partnerAnswered = false;

  const container = $('mg2n-options');
  container.innerHTML = '';

  MG2_NOWANT_OPTIONS.forEach((opt) => {
    const chip = document.createElement('button');
    chip.className = 'chip chip-nowant';
    chip.dataset.id = opt.id;
    chip.innerHTML = `<span class="chip-icon">${opt.icon}</span><span class="chip-label">${opt.label}</span>`;
    container.appendChild(chip);
  });

  $('mg2n-search').value = '';
  $('mg2n-count').textContent = '0/3 seleccionadas';
  $('mg2n-confirm').disabled = true;
  $('mg2n-partner-status').classList.add('hidden');
}

export function setupMiniGame2NoWant() {
  $('mg2n-options').addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip || chip.classList.contains('disabled') || state.answered) return;

    haptic();
    const optionId = chip.dataset.id;

    if (chip.classList.contains('selected')) {
      chip.classList.remove('selected');
      state.currentSelections = state.currentSelections.filter((id) => id !== optionId);
      $('mg2n-options').querySelectorAll('.chip').forEach((c) => c.classList.remove('disabled'));
    } else {
      if (state.currentSelections.length < 3) {
        chip.classList.add('selected');
        state.currentSelections.push(optionId);
        if (state.currentSelections.length >= 3) {
          $('mg2n-options').querySelectorAll('.chip').forEach((c) => {
            if (!c.classList.contains('selected')) c.classList.add('disabled');
          });
        }
      }
    }

    $('mg2n-count').textContent = `${state.currentSelections.length}/3 seleccionadas`;
    $('mg2n-confirm').disabled = state.currentSelections.length !== 3;
  });

  $('mg2n-search').addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    $('mg2n-options').querySelectorAll('.chip').forEach((chip) => {
      const label = chip.querySelector('.chip-label').textContent.toLowerCase();
      chip.style.display = (query === '' || label.includes(query)) ? '' : 'none';
    });
  });

  $('mg2n-confirm').addEventListener('click', () => {
    if (state.currentSelections.length !== 3 || state.answered) return;
    haptic('heavy');
    state.answered = true;

    send({ type: MSG.SUBMIT_ANSWER, phase: PHASES.MG2_NOWANT, answer: [...state.currentSelections] });

    $('mg2n-confirm').disabled = true;
    $('mg2n-options').querySelectorAll('.chip').forEach((c) => c.classList.add('disabled'));

    if (!state.partnerAnswered) $('mg2n-partner-status').classList.remove('hidden');
  });
}
