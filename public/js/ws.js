// ============================================================
// WebSocket Connection
// ============================================================

import { state } from './state.js';
import { MSG, PHASES } from '../data.js';
import { showError } from './screens.js';

let messageHandler = null;

export function setMessageHandler(handler) {
  messageHandler = handler;
}

export function connectWS() {
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${location.host}`;

  state.ws = new WebSocket(wsUrl);

  state.ws.addEventListener('open', () => {
    state.reconnectAttempts = 0;

    if (state.roomCode && state.playerId) {
      send({
        type: MSG.JOIN_ROOM,
        code: state.roomCode,
        playerId: state.playerId,
        rejoin: true,
      });
    }
  });

  state.ws.addEventListener('message', (event) => {
    let message;
    try {
      message = JSON.parse(event.data);
    } catch {
      return;
    }
    if (messageHandler) messageHandler(message);
  });

  state.ws.addEventListener('close', () => {
    if (state.currentPhase !== PHASES.LOBBY) {
      attemptReconnect();
    }
  });

  state.ws.addEventListener('error', () => {
    // Error will trigger close event
  });
}

function attemptReconnect() {
  if (state.reconnectAttempts >= state.maxReconnectAttempts) {
    showError('Se perdio la conexion con el servidor. Recarga la pagina para volver a intentar.');
    return;
  }

  state.reconnectAttempts++;
  setTimeout(() => connectWS(), state.reconnectDelay);
}

export function send(data) {
  if (state.ws && state.ws.readyState === WebSocket.OPEN) {
    state.ws.send(JSON.stringify(data));
  }
}

export function sendOrReconnect(data) {
  if (state.ws && state.ws.readyState === WebSocket.OPEN) {
    send(data);
    return;
  }
  connectWS();
  const onOpen = () => {
    send(data);
    state.ws.removeEventListener('open', onOpen);
  };
  state.ws.addEventListener('open', onOpen);
}
