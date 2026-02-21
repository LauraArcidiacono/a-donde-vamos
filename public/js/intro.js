// ============================================================
// Intro / Onboarding Screen
// ============================================================

import { state, $ } from './state.js';
import { PHASES } from '../data.js';
import { send } from './ws.js';
import { showScreen } from './screens.js';
import { haptic } from './utils.js';
import { requestMusicStart } from '../audio.js';

export function showIntroScreen() {
  showScreen('screen-intro');
  state.currentPhase = PHASES.INTRO;
  state.introDone = false;

  requestMusicStart();

  const btn = $('btn-intro-done');
  btn.disabled = false;
  btn.textContent = '\u00A1Entendido!';

  const waitingEl = $('intro-partner-status');
  if (waitingEl) waitingEl.classList.add('hidden');
}

export function setupIntro() {
  $('btn-intro-done').addEventListener('click', () => {
    haptic('heavy');
    if (state.introDone) return;
    state.introDone = true;

    send({ type: 'intro_done' });

    const btn = $('btn-intro-done');
    btn.disabled = true;
    btn.textContent = 'Esperando...';

    if (!state.soloMode) {
      const waitingEl = $('intro-partner-status');
      if (waitingEl) waitingEl.classList.remove('hidden');
    }
  });
}

export function showPartnerIntroReady() {
  const waitingEl = $('intro-partner-status');
  if (waitingEl && !state.introDone) {
    waitingEl.classList.remove('hidden');
    waitingEl.querySelector('span:last-child').textContent = 'El otro jugador ya est\u00E1 listo';
  }
}
