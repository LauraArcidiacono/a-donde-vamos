// ============================================================
// Lobby & Waiting Room
// ============================================================

import { state, $ } from './state.js';
import { MSG, PHASES } from '../data.js';
import { send, sendOrReconnect, connectWS } from './ws.js';
import { showScreen } from './screens.js';
import { haptic, copyToClipboard, showToast } from './utils.js';

export function createLobbyTemplates() {
  const fragment = document.createDocumentFragment();
  const wrapper = document.createElement('div');
  wrapper.innerHTML = `
    <section id="screen-lobby" class="screen active" aria-label="Lobby - Inicio del juego">
      <div class="screen-content lobby-content">
        <div class="lobby-header">
          <h1 class="app-title">\u00BFA D\u00F3nde Vamos?</h1>
          <p class="app-subtitle">Descubrid juntos vuestro destino ideal</p>
        </div>
        <div class="lobby-actions">
          <label for="input-name" class="sr-only">Tu nombre</label>
          <input type="text" id="input-name" class="name-input" placeholder="Tu nombre" maxlength="15" autocomplete="off">
          <button id="btn-create" class="btn btn-primary">Crear sala</button>
          <button id="btn-solo" class="btn btn-small btn-ghost">Modo prueba</button>
          <div class="divider"><span>\u2014 o \u2014</span></div>
          <div class="join-group">
            <label class="join-label" for="input-code">Unirse a sala</label>
            <div class="join-row">
              <input id="input-code" type="text" class="input-code" maxlength="4" placeholder="ABCD" autocomplete="off" autocapitalize="characters" spellcheck="false" aria-describedby="code-error">
              <button id="btn-join" class="btn btn-secondary">Entrar</button>
            </div>
            <span id="code-error" class="sr-only" aria-live="assertive"></span>
          </div>
        </div>
      </div>
    </section>
    <section id="screen-waiting" class="screen" aria-label="Sala de espera">
      <div class="screen-content waiting-content">
        <h2 class="screen-heading">Tu sala est\u00E1 lista</h2>
        <div class="room-code-box">
          <span class="room-code-label">C\u00F3digo de sala</span>
          <span id="room-code" class="room-code">----</span>
        </div>
        <div class="qr-wrapper hidden">
          <span class="qr-label">Escanea para unirte</span>
          <canvas id="qr-code" role="img" aria-label="C\u00F3digo QR para unirse a la sala"></canvas>
        </div>
        <div class="share-buttons">
          <button id="btn-share-whatsapp" class="btn btn-whatsapp btn-small">
            <span class="btn-icon">\u{1F4AC}</span>
            Enviar por WhatsApp
          </button>
          <button id="btn-share-link" class="btn btn-secondary btn-small">
            <svg class="btn-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/>
              <polyline points="16 6 12 2 8 6"/>
              <line x1="12" y1="2" x2="12" y2="15"/>
            </svg>
            Copiar link
          </button>
        </div>
        <div class="waiting-status-box">
          <span class="pulse-dot"></span>
          <span id="waiting-status" aria-live="polite">Esperando al otro jugador...</span>
        </div>
        <div id="player-count" class="player-count" aria-live="polite">1 / 2 jugadores</div>
      </div>
    </section>`;
  while (wrapper.firstChild) fragment.appendChild(wrapper.firstChild);
  return fragment;
}

export function setupLobby() {
  $('btn-create').addEventListener('click', () => {
    haptic();
    const message = { type: MSG.CREATE_ROOM, name: $('input-name').value.trim() || 'Jugador 1' };
    sendOrReconnect(message);
  });

  $('btn-solo').addEventListener('click', () => {
    haptic();
    state.soloMode = true;
    const message = { type: MSG.CREATE_SOLO, name: $('input-name').value.trim() || 'Jugador 1' };
    sendOrReconnect(message);
  });

  $('btn-join').addEventListener('click', () => {
    haptic();
    const code = $('input-code').value.trim().toUpperCase();
    if (code.length !== 4) {
      const inputEl = $('input-code');
      inputEl.classList.add('shake');
      setTimeout(() => inputEl.classList.remove('shake'), 500);
      const errorEl = $('code-error');
      if (errorEl) errorEl.textContent = 'El código debe tener 4 caracteres';
      showToast('El código debe tener 4 caracteres');
      return;
    }

    state.isJoining = true;
    if (!state.ws || state.ws.readyState !== WebSocket.OPEN) {
      connectWS();
      const onOpen = () => {
        send({ type: MSG.JOIN_ROOM, code, name: $('input-name').value.trim() || 'Jugador 2' });
        state.ws.removeEventListener('open', onOpen);
      };
      state.ws.addEventListener('open', onOpen);
      return;
    }

    state.isJoining = true;
    send({ type: MSG.JOIN_ROOM, code, name: $('input-name').value.trim() || 'Jugador 2' });
  });

  const inputCode = $('input-code');
  inputCode.addEventListener('input', () => {
    inputCode.value = inputCode.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  });

  inputCode.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      $('btn-join').click();
    }
  });
}

export function handleRoomCreated(data) {
  state.roomCode = data.code;
  state.playerId = data.playerId;
  state.playerName = data.name || $('input-name').value.trim() || 'Jugador 1';

  // Solo mode and joiners skip the waiting screen
  if (data.soloMode || state.isJoining) {
    state.currentPhase = PHASES.LOBBY;
    return;
  }

  showScreen('screen-waiting');
  state.currentPhase = PHASES.LOBBY;

  $('room-code').textContent = data.code;

  // Generate QR code - force https for share URLs
  let joinUrl = `${location.origin}${location.pathname}?room=${data.code}`;
  const shareUrl = joinUrl.replace(/^http:\/\//, 'https://');
  const canvas = $('qr-code');
  const qrWrapper = canvas.closest('.qr-wrapper');
  if (typeof QRCode !== 'undefined' && QRCode.toCanvas) {
    QRCode.toCanvas(canvas, shareUrl, {
      width: 200,
      color: { dark: '#1C1917', light: '#FFFFFF' },
    });
    if (qrWrapper) qrWrapper.classList.remove('hidden');
  } else {
    if (qrWrapper) qrWrapper.classList.add('hidden');
  }

  $('waiting-status').textContent = 'Esperando al otro jugador...';
  $('player-count').textContent = '1 / 2 jugadores';

  setupShareLink(shareUrl);
}

function setupShareLink(url) {
  $('btn-share-whatsapp').addEventListener('click', () => {
    haptic();
    const text = encodeURIComponent(`\u00A1Elige destino de viaje conmigo! \u{1F30D}\n${url}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  });

  $('btn-share-link').addEventListener('click', async () => {
    haptic();
    await copyToClipboard(url);
    showToast('Link copiado al portapapeles');
  });
}

export function handlePlayerJoined(data) {
  state.playerId = data.playerId || state.playerId;

  if (data.player1Name) state.player1Name = data.player1Name;
  if (data.player2Name) state.player2Name = data.player2Name;
  if (data.partnerName) state.partnerName = data.partnerName;

  if (data.playerCount === 2 || data.phase === PHASES.READY) {
    if (data.player1Name && $('p1-name')) {
      $('p1-name').textContent = data.player1Name || 'Jugador 1';
    }
    if (data.player2Name && $('p2-name')) {
      $('p2-name').textContent = data.player2Name || 'Jugador 2';
    }
  } else {
    $('player-count').textContent = `${data.playerCount || 1} / 2 jugadores`;
    $('waiting-status').textContent = 'Esperando al otro jugador...';
  }
}
