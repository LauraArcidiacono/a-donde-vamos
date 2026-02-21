// ============================================================
// Screen Management & Overlays
// ============================================================

import { $, $$ } from './state.js';

export function createOverlayTemplates() {
  const frag = document.createDocumentFragment();
  const wrap = document.createElement('div');
  wrap.innerHTML = `
    <div id="overlay-disconnect" class="overlay hidden">
      <div class="overlay-card">
        <div class="overlay-icon">\u26A0\uFE0F</div>
        <h3>Conexi\u00F3n perdida</h3>
        <p>El otro jugador se ha desconectado</p>
        <div class="overlay-status">
          <span class="pulse-dot"></span>
          <span>Esperando reconexi\u00F3n...</span>
        </div>
        <span id="disconnect-countdown" class="disconnect-countdown">30</span>
      </div>
    </div>
    <div id="overlay-error" class="overlay hidden">
      <div class="overlay-card">
        <div class="overlay-icon">\u274C</div>
        <p id="error-message" class="error-message">Ha ocurrido un error</p>
        <button id="btn-back-lobby" class="btn btn-primary">Volver al inicio</button>
      </div>
    </div>`;
  while (wrap.firstChild) frag.appendChild(wrap.firstChild);
  return frag;
}

export function showScreen(screenId) {
  const screens = $$('.screen');
  screens.forEach((s) => {
    s.classList.remove('active');
  });

  const target = $(screenId);
  if (target) {
    target.classList.add('active');
  }
}

export function showDisconnectOverlay(data) {
  const overlay = $('overlay-disconnect');
  overlay.classList.remove('hidden');

  if (data && data.countdown) {
    $('disconnect-countdown').textContent = data.countdown;
  }
}

export function hideDisconnectOverlay() {
  $('overlay-disconnect').classList.add('hidden');
}

export function updateDisconnectCountdown(data) {
  if (data && data.remaining !== undefined) {
    $('disconnect-countdown').textContent = data.remaining;
  }
}

export function showAborted() {
  showError('El otro jugador se ha desconectado definitivamente. La partida ha terminado.');
}

export function showError(message) {
  $('overlay-disconnect').classList.add('hidden');
  $('error-message').textContent = message || 'Ha ocurrido un error';
  $('overlay-error').classList.remove('hidden');
}
