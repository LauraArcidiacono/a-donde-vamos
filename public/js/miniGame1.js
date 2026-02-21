// ============================================================
// Mini-Game 1: Emotional Test
// ============================================================

import { state, $ } from './state.js';
import { MSG, PHASES, MG1_QUESTIONS } from '../data.js';
import { send } from './ws.js';
import { showScreen } from './screens.js';
import { haptic } from './utils.js';
import { updateTimerBar } from './timers.js';

export function showQuestion(data) {
  if (data.phase && data.phase !== PHASES.MG1) return;

  state.currentPhase = PHASES.MG1;
  state.partnerAnswered = false;
  state.answered = false;
  state.currentSelections = [];
  state.currentQuestionId = data.questionId;

  showScreen('screen-mg1');

  const question = MG1_QUESTIONS.find((q) => q.id === data.questionId);
  if (!question) return;

  state.currentQuestionMaxSelect = question.maxSelect || 2;
  state.timerTotal = data.timer || question.timer || 20;

  const qIndex = MG1_QUESTIONS.indexOf(question);
  $('mg1-counter').textContent = `Pregunta ${qIndex + 1} de ${MG1_QUESTIONS.length}`;
  $('mg1-phase').textContent = 'Ronda 1/3';
  $('mg1-timer').textContent = state.timerTotal;
  updateTimerBar('mg1', state.timerTotal, state.timerTotal);
  $('mg1-question').textContent = question.text;

  renderOptions(question.options);

  const extendBtn = $('mg1-extend');
  if (state.mg1ExtendUsed[data.questionId]) {
    extendBtn.disabled = true;
    extendBtn.classList.add('used');
  } else {
    extendBtn.disabled = false;
    extendBtn.classList.remove('used');
  }

  $('mg1-confirm').disabled = true;
  $('mg1-partner-status').classList.add('hidden');
  const partnerText = $('mg1-partner-status').querySelector('span:last-child');
  if (partnerText) partnerText.textContent = 'El otro jugador esta respondiendo...';
}

function renderOptions(options) {
  const container = $('mg1-options');
  container.innerHTML = '';

  options.forEach((opt) => {
    const chip = document.createElement('button');
    chip.className = 'chip';
    chip.dataset.id = opt.id;
    chip.innerHTML = `<span class="chip-icon">${opt.icon}</span><span class="chip-label">${opt.label}</span>`;
    container.appendChild(chip);
  });
}

export function setupMiniGame1() {
  $('mg1-options').addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip || chip.classList.contains('disabled') || state.answered) return;

    haptic();
    const optionId = chip.dataset.id;

    if (chip.classList.contains('selected')) {
      chip.classList.remove('selected');
      state.currentSelections = state.currentSelections.filter((id) => id !== optionId);
      $('mg1-options').querySelectorAll('.chip').forEach((c) => c.classList.remove('disabled'));
    } else {
      if (state.currentSelections.length < state.currentQuestionMaxSelect) {
        chip.classList.add('selected');
        state.currentSelections.push(optionId);

        if (state.currentSelections.length >= state.currentQuestionMaxSelect) {
          $('mg1-options').querySelectorAll('.chip').forEach((c) => {
            if (!c.classList.contains('selected')) c.classList.add('disabled');
          });
        }
      }
    }

    $('mg1-confirm').disabled = state.currentSelections.length < 1;
  });

  $('mg1-confirm').addEventListener('click', () => {
    if (state.currentSelections.length < 1 || state.answered) return;
    haptic('heavy');
    state.answered = true;

    send({
      type: MSG.SUBMIT_ANSWER,
      phase: PHASES.MG1,
      questionId: state.currentQuestionId,
      answer: [...state.currentSelections],
    });

    $('mg1-confirm').disabled = true;
    $('mg1-options').querySelectorAll('.chip').forEach((c) => c.classList.add('disabled'));

    if (!state.partnerAnswered) {
      $('mg1-partner-status').classList.remove('hidden');
    }
  });

  $('mg1-extend').addEventListener('click', () => {
    if (state.mg1ExtendUsed[state.currentQuestionId]) return;
    haptic();
    state.mg1ExtendUsed[state.currentQuestionId] = true;
    $('mg1-extend').disabled = true;
    $('mg1-extend').classList.add('used');
    send({ type: MSG.REQUEST_EXTEND, questionId: state.currentQuestionId });
  });
}
