// ============================================================
// A Donde Vamos - Client Entry Point
// Orchestrates all modules, message routing, and initialization
// ============================================================

import { state, $ } from './state.js';
import { MSG, PHASES } from '../data.js';
import { initAudio, requestMusicStop, stopTimerWarning } from '../audio.js';
import { connectWS, send, setMessageHandler } from './ws.js';
import { createOverlayTemplates, showScreen, showError, showDisconnectOverlay, hideDisconnectOverlay, updateDisconnectCountdown, showAborted } from './screens.js';
import { haptic } from './utils.js';
import { handleTimerTick, handleTimerExtended } from './timers.js';
import { createLobbyTemplates, setupLobby, handleRoomCreated, handlePlayerJoined } from './lobby.js';
import { createIntroTemplate, showIntroScreen, setupIntro, showPartnerIntroReady } from './intro.js';
import { createReadyTemplate, showReadyScreen, setupReadyCheck, showCountdown } from './ready.js';
import { createInstructionsTemplate, showInstructions, showPartnerInstructionsReady, setupInstructions } from './instructions.js';
import { createMiniGame1Template, showQuestion, setupMiniGame1 } from './miniGame1.js';
import { createMiniGame2Templates, renderMiniGame2Important, setupMiniGame2Important, renderMiniGame2NoWant, setupMiniGame2NoWant } from './miniGame2.js';
import { createMiniGame3Template, renderMiniGame3Sliders, setupMiniGame3 } from './miniGame3.js';
import { createResultsTemplate, showResults, setupShareResults, setupRematch, resetForRematch } from './results.js';

// ============================================================
// Message Router
// ============================================================

function routeMessage(msg) {
  switch (msg.type) {
    case MSG.ROOM_CREATED:      handleRoomCreated(msg); break;
    case MSG.PLAYER_JOINED:     handlePlayerJoined(msg); break;
    case MSG.SHOW_INTRO:        showIntroScreen(); break;
    case MSG.INTRO_ALL_READY:   showReadyScreen(); break;
    case 'partner_intro_ready': showPartnerIntroReady(); break;
    case MSG.BOTH_READY:        showCountdown(); break;
    case MSG.SHOW_INSTRUCTIONS: showInstructions(msg.phase); break;
    case MSG.PHASE_CHANGE:      handlePhaseChange(msg.phase); break;
    case 'partner_instructions_ready': showPartnerInstructionsReady(); break;
    case MSG.QUESTION:          showQuestion(msg); break;
    case MSG.TIMER_TICK:        handleTimerTick(msg); break;
    case MSG.TIMER_EXTENDED:    handleTimerExtended(msg); break;
    case MSG.PARTNER_ANSWERED:  showPartnerAnswered(); break;
    case MSG.RESULTS:           showResults(msg.results); break;
    case MSG.PLAYER_DISCONNECTED: showDisconnectOverlay(msg); break;
    case MSG.PLAYER_RECONNECTED:  hideDisconnectOverlay(); break;
    case MSG.WAITING_RECONNECT:   updateDisconnectCountdown(msg); break;
    case MSG.GAME_ABORTED:      showAborted(); break;
    case MSG.REMATCH_READY:     resetForRematch(); break;
    case MSG.ERROR:             showError(msg.message); break;
    default: break;
  }
}

// ============================================================
// Phase Change Handler
// ============================================================

function handlePhaseChange(phase) {
  state.currentPhase = phase;
  state.partnerAnswered = false;
  state.answered = false;
  state.currentSelections = [];

  stopTimerWarning();

  switch (phase) {
    case PHASES.MG1:           showScreen('screen-mg1'); break;
    case PHASES.MG2_IMPORTANT: showScreen('screen-mg2-important'); renderMiniGame2Important(); break;
    case PHASES.MG2_NOWANT:    showScreen('screen-mg2-nowant'); renderMiniGame2NoWant(); break;
    case PHASES.MG3:           showScreen('screen-mg3'); renderMiniGame3Sliders(); break;
    case PHASES.RESULTS:       showScreen('screen-results'); break;
    default: break;
  }
}

// ============================================================
// Partner Status
// ============================================================

function showPartnerAnswered() {
  state.partnerAnswered = true;

  const statusMap = {
    [PHASES.MG1]: 'mg1-partner-status',
    [PHASES.MG2_IMPORTANT]: 'mg2i-partner-status',
    [PHASES.MG2_NOWANT]: 'mg2n-partner-status',
    [PHASES.MG3]: 'mg3-partner-status',
  };

  const statusEl = $(statusMap[state.currentPhase]);
  if (!statusEl) return;

  statusEl.classList.remove('hidden');
  const textSpan = statusEl.querySelector('span:last-child');
  if (textSpan) textSpan.textContent = 'El otro jugador ha respondido';
  const dotSpan = statusEl.querySelector('.pulse-dot');
  if (dotSpan) {
    dotSpan.classList.remove('pulse-dot');
    dotSpan.classList.add('check-mark');
    dotSpan.textContent = '';
  }
}

// ============================================================
// URL Parameter Handling
// ============================================================

function handleURLParams() {
  const params = new URLSearchParams(location.search);

  const roomCode = params.get('room');
  if (roomCode) {
    $('input-code').value = roomCode.toUpperCase();
    const onOpen = () => {
      send({ type: MSG.JOIN_ROOM, code: roomCode.toUpperCase() });
      state.ws.removeEventListener('open', onOpen);
    };
    if (state.ws && state.ws.readyState === WebSocket.OPEN) {
      send({ type: MSG.JOIN_ROOM, code: roomCode.toUpperCase() });
    } else if (state.ws) {
      state.ws.addEventListener('open', onOpen);
    }
    return;
  }

  const solo = params.get('solo');
  if (solo === 'true') {
    state.soloMode = true;
    const onOpen = () => {
      send({ type: MSG.CREATE_SOLO });
      state.ws.removeEventListener('open', onOpen);
    };
    if (state.ws && state.ws.readyState === WebSocket.OPEN) {
      send({ type: MSG.CREATE_SOLO });
    } else if (state.ws) {
      state.ws.addEventListener('open', onOpen);
    }
  }
}

// ============================================================
// Error Overlay Setup
// ============================================================

function setupErrorOverlay() {
  $('btn-back-lobby').addEventListener('click', () => {
    haptic();
    $('overlay-error').classList.add('hidden');

    requestMusicStop();
    stopTimerWarning();

    state.roomCode = null;
    state.playerId = null;
    state.soloMode = false;
    state.currentPhase = PHASES.LOBBY;
    state.mg1ExtendUsed = {};
    state.currentSelections = [];
    state.partnerAnswered = false;
    state.answered = false;

    showScreen('screen-lobby');

    const url = new URL(location.href);
    url.searchParams.delete('room');
    url.searchParams.delete('solo');
    history.replaceState(null, '', url.pathname);

    if (!state.ws || state.ws.readyState !== WebSocket.OPEN) {
      connectWS();
    }
  });
}

// ============================================================
// Initialization
// ============================================================

function init() {
  // Mount all screen templates before any setup
  const app = $('app');
  app.appendChild(createLobbyTemplates());
  app.appendChild(createIntroTemplate());
  app.appendChild(createReadyTemplate());
  app.appendChild(createInstructionsTemplate());
  app.appendChild(createMiniGame1Template());
  app.appendChild(createMiniGame2Templates());
  app.appendChild(createMiniGame3Template());
  app.appendChild(createResultsTemplate());

  // Overlays on body, before script tag
  const scriptTag = document.body.querySelector('script');
  document.body.insertBefore(createOverlayTemplates(), scriptTag);

  initAudio();
  setMessageHandler(routeMessage);
  connectWS();

  setupLobby();
  setupReadyCheck();
  setupIntro();
  setupInstructions();
  setupMiniGame1();
  setupMiniGame2Important();
  setupMiniGame2NoWant();
  setupMiniGame3();
  setupShareResults();
  setupRematch();
  setupErrorOverlay();

  handleURLParams();

  document.body.addEventListener(
    'touchmove',
    (e) => {
      if (e.target.closest('.scrollable') || e.target.closest('.sliders-container') || e.target.closest('.results-content')) {
        return;
      }
    },
    { passive: true }
  );
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
