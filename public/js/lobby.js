// ============================================================
// Lobby & Waiting Room
// ============================================================

import { state, $ } from './state.js';
import { MSG, PHASES } from '../data.js';
import { send, sendOrReconnect, connectWS } from './ws.js';
import { showScreen } from './screens.js';
import { haptic, copyToClipboard, showToast } from './utils.js';

export function setupLobby() {
  $('btn-create').addEventListener('click', () => {
    haptic();
    const msg = { type: MSG.CREATE_ROOM, name: $('input-name').value.trim() || 'Jugador 1' };
    sendOrReconnect(msg);
  });

  $('btn-solo').addEventListener('click', () => {
    haptic();
    state.soloMode = true;
    const msg = { type: MSG.CREATE_SOLO, name: $('input-name').value.trim() || 'Jugador 1' };
    sendOrReconnect(msg);
  });

  $('btn-join').addEventListener('click', () => {
    haptic();
    const code = $('input-code').value.trim().toUpperCase();
    if (code.length !== 4) return;

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
