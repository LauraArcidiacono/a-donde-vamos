// ============================================================
// Screen Management & Overlays
// ============================================================

import { $, $$ } from './state.js';

let previouslyFocused = null;

export function createOverlayTemplates() {
  const fragment = document.createDocumentFragment();
  const wrapper = document.createElement('div');
  wrapper.innerHTML = `
    <div id="overlay-disconnect" class="overlay hidden" role="dialog" aria-modal="true" aria-label="Conexi\u00F3n perdida">
      <div class="overlay-card">
        <div class="overlay-icon" aria-hidden="true">\u26A0\uFE0F</div>
        <h3>Conexi\u00F3n perdida</h3>
        <p>El otro jugador se ha desconectado</p>
        <div class="overlay-status">
          <span class="pulse-dot"></span>
          <span>Esperando reconexi\u00F3n...</span>
        </div>
        <span id="disconnect-countdown" class="disconnect-countdown" aria-live="assertive" aria-label="Cuenta atr\u00E1s para desconexi\u00F3n">30</span>
      </div>
    </div>
    <div id="overlay-error" class="overlay hidden" role="dialog" aria-modal="true" aria-label="Error">
      <div class="overlay-card">
        <div class="overlay-icon" aria-hidden="true">\u274C</div>
        <p id="error-message" class="error-message" aria-live="assertive">Ha ocurrido un error</p>
        <button id="btn-back-lobby" class="btn btn-primary">Volver al inicio</button>
      </div>
    </div>`;
  while (wrapper.firstChild) fragment.appendChild(wrapper.firstChild);
  return fragment;
}

function trapFocus(overlay) {
  const focusable = overlay.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  if (focusable.length === 0) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  first.focus();

  overlay._trapHandler = (e) => {
    if (e.key !== 'Tab') return;
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };
  overlay.addEventListener('keydown', overlay._trapHandler);
}

function releaseFocus(overlay) {
  if (overlay._trapHandler) {
    overlay.removeEventListener('keydown', overlay._trapHandler);
    overlay._trapHandler = null;
  }
  if (previouslyFocused && previouslyFocused.focus) {
    previouslyFocused.focus();
    previouslyFocused = null;
  }
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
  previouslyFocused = document.activeElement;
  const overlay = $('overlay-disconnect');
  overlay.classList.remove('hidden');
  trapFocus(overlay);

  if (data && data.countdown) {
    $('disconnect-countdown').textContent = data.countdown;
  }
}

export function hideDisconnectOverlay() {
  const overlay = $('overlay-disconnect');
  overlay.classList.add('hidden');
  releaseFocus(overlay);
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
  const disconnectOverlay = $('overlay-disconnect');
  disconnectOverlay.classList.add('hidden');
  releaseFocus(disconnectOverlay);

  previouslyFocused = document.activeElement;
  $('error-message').textContent = message || 'Ha ocurrido un error';
  const errorOverlay = $('overlay-error');
  errorOverlay.classList.remove('hidden');
  trapFocus(errorOverlay);
}

export function hideErrorOverlay() {
  const overlay = $('overlay-error');
  overlay.classList.add('hidden');
  releaseFocus(overlay);
}
