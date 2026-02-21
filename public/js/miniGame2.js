// ============================================================
// Mini-Game 2: Important & No Want
// ============================================================

import { state, $ } from './state.js';
import { MSG, PHASES, MG2_IMPORTANT_OPTIONS, MG2_NOWANT_OPTIONS } from '../data.js';
import { send } from './ws.js';
import { haptic } from './utils.js';

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
