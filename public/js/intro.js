// ============================================================
// Intro / Onboarding Screen
// ============================================================

import { state, $ } from './state.js';
import { PHASES } from '../data.js';
import { send } from './ws.js';
import { showScreen } from './screens.js';
import { haptic } from './utils.js';
import { requestMusicStart } from '../audio.js';

export function createIntroTemplate() {
  const section = document.createElement('section');
  section.id = 'screen-intro';
  section.className = 'screen';
  section.innerHTML = `
    <div class="screen-content intro-content">
      <h2 class="screen-heading">\u00BFC\u00F3mo funciona?</h2>
      <p class="screen-subheading">3 rondas r\u00E1pidas para encontrar vuestro destino ideal</p>
      <div class="intro-rounds">
        <div class="intro-round">
          <span class="intro-round-icon">\u{1F9E0}</span>
          <div class="intro-round-info">
            <h4>Ronda 1 \u2014 Vibraciones</h4>
            <p>5 preguntas r\u00E1pidas sobre qu\u00E9 os atrae: agua, monta\u00F1a, gastronom\u00EDa...</p>
          </div>
        </div>
        <div class="intro-round">
          <span class="intro-round-icon">\u2764\uFE0F</span>
          <div class="intro-round-info">
            <h4>Ronda 2 \u2014 Prioridades</h4>
            <p>Elegid lo que m\u00E1s os importa y lo que NO quer\u00E9is en vuestro viaje.</p>
          </div>
        </div>
        <div class="intro-round">
          <span class="intro-round-icon">\u2696\uFE0F</span>
          <div class="intro-round-info">
            <h4>Ronda 3 \u2014 Ajuste fino</h4>
            <p>Deslizadores para afinar vuestras preferencias. Luego ver\u00E9is el resultado combinado.</p>
          </div>
        </div>
      </div>
      <button id="btn-intro-done" class="btn btn-primary">\u00A1Entendido!</button>
      <div id="intro-partner-status" class="partner-status hidden">
        <span class="pulse-dot"></span>
        <span>Esperando al otro jugador...</span>
      </div>
    </div>`;
  return section;
}

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
