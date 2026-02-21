// ============================================================
// Screen Management & Overlays
// ============================================================

import { $, $$ } from './state.js';

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
