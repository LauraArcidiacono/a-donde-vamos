// ============================================================
// Ready Check & Countdown
// ============================================================

import { state, $ } from './state.js';
import { MSG, PHASES } from '../data.js';
import { send } from './ws.js';
import { showScreen } from './screens.js';
import { haptic } from './utils.js';
import {
  requestMusicStart,
  playCountdownBeep,
  playCountdownGo,
} from '../audio.js';

export function createReadyTemplate() {
  const section = document.createElement('section');
  section.id = 'screen-ready';
  section.className = 'screen';
  section.setAttribute('aria-label', 'Sala de espera - Listos para jugar');
  section.innerHTML = `
    <div class="screen-content ready-content">
      <h2 class="screen-heading">\u00A1Jugador conectado!</h2>
      <p class="screen-subheading">Preparados para empezar</p>
      <div class="ready-indicators" role="status" aria-label="Estado de los jugadores">
        <div class="ready-player">
          <div id="p1-ready" class="ready-dot" aria-hidden="true"></div>
          <span class="ready-player-label"><span id="p1-name">Jugador 1</span></span>
        </div>
        <div class="ready-player">
          <div id="p2-ready" class="ready-dot" aria-hidden="true"></div>
          <span class="ready-player-label"><span id="p2-name">Jugador 2</span></span>
        </div>
      </div>
      <button id="btn-ready" class="btn btn-primary btn-pulse">\u00A1Estoy listo!</button>
      <div id="countdown-overlay" class="countdown-overlay hidden" role="status" aria-live="assertive" aria-label="Cuenta atr\u00E1s">
        <span class="countdown-number"></span>
      </div>
    </div>`;
  return section;
}

export function showReadyScreen() {
  showScreen('screen-ready');
  state.currentPhase = PHASES.READY;

  requestMusicStart();

  $('p1-ready').classList.remove('ready');
  $('p2-ready').classList.remove('ready');
  $('btn-ready').disabled = false;

  const overlay = $('countdown-overlay');
  overlay.classList.add('hidden');
}

export function setupReadyCheck() {
  $('btn-ready').addEventListener('click', () => {
    haptic('heavy');
    send({ type: MSG.PLAYER_READY });
    $('btn-ready').disabled = true;
    $('btn-ready').textContent = 'Esperando...';

    const myDot = state.playerId === 'p1' ? $('p1-ready') : $('p2-ready');
    if (myDot) myDot.classList.add('ready');
  });
}

export function showCountdown() {
  $('p1-ready').classList.add('ready');
  $('p2-ready').classList.add('ready');

  const overlay = $('countdown-overlay');
  overlay.classList.remove('hidden');
  const numberEl = overlay.querySelector('.countdown-number');

  let count = 3;
  numberEl.textContent = count;
  numberEl.classList.add('animate');
  playCountdownBeep();

  state.countdownTimer = setInterval(() => {
    count--;
    if (count > 0) {
      numberEl.textContent = count;
      haptic();
      playCountdownBeep();
      numberEl.classList.remove('animate');
      void numberEl.offsetWidth; // force reflow
      numberEl.classList.add('animate');
    } else {
      clearInterval(state.countdownTimer);
      state.countdownTimer = null;
      overlay.classList.add('hidden');
      playCountdownGo();
    }
  }, 1000);
}
