// ============================================================
// A Donde Vamos - Client Application
// Main client-side module handling WebSocket, UI, and game logic
// ============================================================

import {
  MSG,
  PHASES,
  MG1_QUESTIONS,
  MG2_IMPORTANT_OPTIONS,
  MG2_NOWANT_OPTIONS,
  MG3_SLIDERS,
  INSTRUCTIONS,
  CITIES,
  TAG_LABELS,
  CITY_INFO,
} from './data.js';

import {
  initAudio,
  requestMusicStart,
  requestMusicStop,
  playClick,
  playCelebration,
  playCountdownBeep,
  playCountdownGo,
  startTimerWarning,
  stopTimerWarning,
} from './audio.js';

// ============================================================
// Application State
// ============================================================

const state = {
  ws: null,
  playerId: null,
  roomCode: null,
  soloMode: false,
  currentPhase: PHASES.LOBBY,
  mg1ExtendUsed: {},
  currentSelections: [],
  partnerAnswered: false,
  currentQuestionId: null,
  currentQuestionMaxSelect: 2,
  timerTotal: 0,
  reconnectAttempts: 0,
  maxReconnectAttempts: 3,
  reconnectDelay: 2000,
  instructionTimer: null,
  countdownTimer: null,
  answered: false,
};

// ============================================================
// DOM References (cached for performance)
// ============================================================

const $ = (id) => document.getElementById(id);
const $$ = (sel) => document.querySelectorAll(sel);

// ============================================================
// Haptic Feedback
// ============================================================

function haptic(type = 'light') {
  if (navigator.vibrate) {
    navigator.vibrate(type === 'light' ? 10 : 50);
  }
  // Play subtle click sound on interactions
  playClick();
}

// ============================================================
// WebSocket Connection
// ============================================================

function connectWS() {
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${location.host}`;

  state.ws = new WebSocket(wsUrl);

  state.ws.addEventListener('open', () => {
    state.reconnectAttempts = 0;

    // If we have a room code and player id, attempt rejoin
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
    let msg;
    try {
      msg = JSON.parse(event.data);
    } catch {
      return;
    }
    routeMessage(msg);
  });

  state.ws.addEventListener('close', () => {
    if (state.currentPhase !== PHASES.LOBBY) {
      attemptReconnect();
    }
  });

  state.ws.addEventListener('error', () => {
    // Error will trigger close event, handled there
  });
}

function attemptReconnect() {
  if (state.reconnectAttempts >= state.maxReconnectAttempts) {
    showError('Se perdio la conexion con el servidor. Recarga la pagina para volver a intentar.');
    return;
  }

  state.reconnectAttempts++;

  setTimeout(() => {
    connectWS();
  }, state.reconnectDelay);
}

function send(data) {
  if (state.ws && state.ws.readyState === WebSocket.OPEN) {
    state.ws.send(JSON.stringify(data));
  }
}

// ============================================================
// Message Router
// ============================================================

function routeMessage(msg) {
  switch (msg.type) {
    case MSG.ROOM_CREATED:
      handleRoomCreated(msg);
      break;
    case MSG.PLAYER_JOINED:
      handlePlayerJoined(msg);
      break;
    case MSG.BOTH_READY:
      showCountdown();
      break;
    case MSG.SHOW_INSTRUCTIONS:
      showInstructions(msg.phase);
      break;
    case MSG.PHASE_CHANGE:
      handlePhaseChange(msg.phase);
      break;
    case 'partner_instructions_ready':
      showPartnerInstructionsReady();
      break;
    case MSG.QUESTION:
      showQuestion(msg);
      break;
    case MSG.TIMER_TICK:
      handleTimerTick(msg);
      break;
    case MSG.TIMER_EXTENDED:
      handleTimerExtended(msg);
      break;
    case MSG.PARTNER_ANSWERED:
      showPartnerAnswered();
      break;
    case MSG.RESULTS:
      showResults(msg.results);
      break;
    case MSG.PLAYER_DISCONNECTED:
      showDisconnectOverlay(msg);
      break;
    case MSG.PLAYER_RECONNECTED:
      hideDisconnectOverlay();
      break;
    case MSG.WAITING_RECONNECT:
      updateDisconnectCountdown(msg);
      break;
    case MSG.GAME_ABORTED:
      showAborted();
      break;
    case MSG.REMATCH_READY:
      resetForRematch();
      break;
    case MSG.ERROR:
      showError(msg.message);
      break;
    default:
      break;
  }
}

// ============================================================
// Screen Management
// ============================================================

function showScreen(screenId) {
  const screens = $$('.screen');
  screens.forEach((s) => {
    s.classList.remove('active');
  });

  const target = $(screenId);
  if (target) {
    target.classList.add('active');
  }
}

// ============================================================
// Lobby Handlers
// ============================================================

function setupLobby() {
  $('btn-create').addEventListener('click', () => {
    haptic();
    send({ type: MSG.CREATE_ROOM, name: $('input-name').value.trim() || 'Jugador 1' });
  });

  $('btn-solo').addEventListener('click', () => {
    haptic();
    state.soloMode = true;
    send({ type: MSG.CREATE_SOLO, name: $('input-name').value.trim() || 'Jugador 1' });
  });

  $('btn-join').addEventListener('click', () => {
    haptic();
    const code = $('input-code').value.trim().toUpperCase();
    if (code.length === 4) {
      send({ type: MSG.JOIN_ROOM, code, name: $('input-name').value.trim() || 'Jugador 2' });
    }
  });

  const inputCode = $('input-code');
  inputCode.addEventListener('input', () => {
    inputCode.value = inputCode.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  });

  // Allow Enter key on code input
  inputCode.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      $('btn-join').click();
    }
  });
}

// ============================================================
// Waiting Room
// ============================================================

function handleRoomCreated(data) {
  state.roomCode = data.code;
  state.playerId = data.playerId;
  state.playerName = data.name || $('input-name').value.trim() || 'Jugador 1';

  showScreen('screen-waiting');
  state.currentPhase = PHASES.LOBBY;

  // Display room code
  $('room-code').textContent = data.code;

  // Generate QR code
  const joinUrl = `${location.origin}${location.pathname}?room=${data.code}`;
  const canvas = $('qr-code');
  const qrWrapper = canvas.closest('.qr-wrapper');
  if (typeof QRCode !== 'undefined' && QRCode.toCanvas) {
    QRCode.toCanvas(canvas, joinUrl, {
      width: 200,
      color: { dark: '#1C1917', light: '#FFFFFF' },
    });
    if (qrWrapper) qrWrapper.classList.remove('hidden');
  } else {
    if (qrWrapper) qrWrapper.classList.add('hidden');
  }

  // Update status
  $('waiting-status').textContent = 'Esperando al otro jugador...';
  $('player-count').textContent = '1 / 2 jugadores';

  // Share link button
  setupShareLink(joinUrl);
}

function setupShareLink(url) {
  // WhatsApp direct link
  $('btn-share-whatsapp').addEventListener('click', () => {
    haptic();
    const text = encodeURIComponent(`\u00A1Elige destino de viaje conmigo! \u{1F30D}\n${url}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  });

  // Copy link fallback
  $('btn-share-link').addEventListener('click', async () => {
    haptic();
    await copyToClipboard(url);
    showToast('Link copiado al portapapeles');
  });
}

function handlePlayerJoined(data) {
  state.playerId = data.playerId || state.playerId;

  // Store partner name for results tab label
  if (data.player1Name) state.player1Name = data.player1Name;
  if (data.player2Name) state.player2Name = data.player2Name;
  if (data.partnerName) state.partnerName = data.partnerName;

  if (data.playerCount === 2 || data.phase === PHASES.READY) {
    // Update player name displays if available
    if (data.player1Name && $('p1-name')) {
      $('p1-name').textContent = data.player1Name || 'Jugador 1';
    }
    if (data.player2Name && $('p2-name')) {
      $('p2-name').textContent = data.player2Name || 'Jugador 2';
    }

    // Both players present, move to ready screen
    showReadyScreen();
  } else {
    // Update waiting room count
    $('player-count').textContent = `${data.playerCount || 1} / 2 jugadores`;
    $('waiting-status').textContent = 'Esperando al otro jugador...';
  }
}

// ============================================================
// Ready Check
// ============================================================

function showReadyScreen() {
  showScreen('screen-ready');
  state.currentPhase = PHASES.READY;

  // Start background music (from ready screen onwards)
  requestMusicStart();

  // Reset ready indicators
  $('p1-ready').classList.remove('ready');
  $('p2-ready').classList.remove('ready');
  $('btn-ready').disabled = false;

  // Hide countdown overlay
  const overlay = $('countdown-overlay');
  overlay.classList.add('hidden');
}

function setupReadyCheck() {
  $('btn-ready').addEventListener('click', () => {
    haptic('heavy');
    send({ type: MSG.PLAYER_READY });
    $('btn-ready').disabled = true;
    $('btn-ready').textContent = 'Esperando...';

    // Mark our player as ready
    const myDot = state.playerId === 'p1' ? $('p1-ready') : $('p2-ready');
    if (myDot) myDot.classList.add('ready');
  });
}

function showCountdown() {
  // Mark both as ready
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
      // Re-trigger animation
      numberEl.classList.remove('animate');
      void numberEl.offsetWidth; // force reflow
      numberEl.classList.add('animate');
    } else {
      clearInterval(state.countdownTimer);
      state.countdownTimer = null;
      overlay.classList.add('hidden');
      playCountdownGo();
      // Server will send show_instructions or phase_change next
    }
  }, 1000);
}

// ============================================================
// Instructions Screen
// ============================================================

function showInstructions(phase) {
  // Map phase to instructions key
  let instrKey;
  if (phase === PHASES.MG1) instrKey = 'mg1';
  else if (phase === PHASES.MG2_IMPORTANT || phase === PHASES.MG2_NOWANT) instrKey = 'mg2';
  else if (phase === PHASES.MG3) instrKey = 'mg3';
  else return;

  const instr = INSTRUCTIONS[instrKey];
  if (!instr) return;

  showScreen('screen-instructions');
  state.instructionsSent = false;

  $('instr-icon').textContent = instr.icon;
  $('instr-title').textContent = instr.title;
  $('instr-subtitle').textContent = instr.subtitle;

  const rulesEl = $('instr-rules');
  rulesEl.innerHTML = '';
  instr.rules.forEach((rule) => {
    const li = document.createElement('li');
    li.textContent = rule;
    rulesEl.appendChild(li);
  });

  // Reset button state
  const btn = $('btn-instr-next');
  btn.disabled = false;
  btn.textContent = 'Siguiente';

  // Hide partner waiting status
  const waitingEl = $('instr-partner-status');
  if (waitingEl) waitingEl.classList.add('hidden');

  // Auto-advance countdown
  let countdownSec = 5;
  const countdownSpan = $('instr-countdown');
  countdownSpan.textContent = countdownSec;

  clearTimers();

  state.instructionTimer = setInterval(() => {
    countdownSec--;
    countdownSpan.textContent = countdownSec;
    if (countdownSec <= 0) {
      clearTimers();
      sendInstructionsDone();
    }
  }, 1000);
}

function sendInstructionsDone() {
  if (state.instructionsSent) return;
  state.instructionsSent = true;
  send({ type: 'instructions_done', phase: state.currentPhase });

  // Show waiting state
  const btn = $('btn-instr-next');
  btn.disabled = true;
  btn.textContent = 'Esperando...';

  if (!state.soloMode) {
    const waitingEl = $('instr-partner-status');
    if (waitingEl) waitingEl.classList.remove('hidden');
  }
}

function showPartnerInstructionsReady() {
  // Partner clicked next - if we haven't clicked yet, just show a subtle indicator
  const waitingEl = $('instr-partner-status');
  if (waitingEl && !state.instructionsSent) {
    waitingEl.classList.remove('hidden');
    waitingEl.textContent = 'El otro jugador ya est\u00E1 listo';
  }
}

function setupInstructions() {
  $('btn-instr-next').addEventListener('click', () => {
    haptic();
    clearTimers();
    sendInstructionsDone();
  });
}

function clearTimers() {
  if (state.instructionTimer) {
    clearInterval(state.instructionTimer);
    state.instructionTimer = null;
  }
  if (state.countdownTimer) {
    clearInterval(state.countdownTimer);
    state.countdownTimer = null;
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

  // Stop any active timer warning when changing phases
  stopTimerWarning();

  switch (phase) {
    case PHASES.MG1:
      showScreen('screen-mg1');
      break;
    case PHASES.MG2_IMPORTANT:
      showScreen('screen-mg2-important');
      renderMG2Important();
      break;
    case PHASES.MG2_NOWANT:
      showScreen('screen-mg2-nowant');
      renderMG2NoWant();
      break;
    case PHASES.MG3:
      showScreen('screen-mg3');
      renderMG3Sliders();
      break;
    case PHASES.RESULTS:
      showScreen('screen-results');
      break;
    default:
      break;
  }
}

// ============================================================
// Mini-Game 1: Emotional Test
// ============================================================

function showQuestion(data) {
  // Only handle MG1 questions here; MG2/MG3 are rendered via handlePhaseChange
  if (data.phase && data.phase !== PHASES.MG1) return;

  state.currentPhase = PHASES.MG1;
  state.partnerAnswered = false;
  state.answered = false;
  state.currentSelections = [];
  state.currentQuestionId = data.questionId;

  showScreen('screen-mg1');

  // Find question data
  const question = MG1_QUESTIONS.find((q) => q.id === data.questionId);
  if (!question) return;

  state.currentQuestionMaxSelect = question.maxSelect || 2;
  state.timerTotal = data.timer || question.timer || 20;

  // Update header
  const qIndex = MG1_QUESTIONS.indexOf(question);
  $('mg1-counter').textContent = `Pregunta ${qIndex + 1} de ${MG1_QUESTIONS.length}`;
  $('mg1-phase').textContent = 'Ronda 1/3';

  // Update timer
  $('mg1-timer').textContent = state.timerTotal;
  updateTimerBar('mg1', state.timerTotal, state.timerTotal);

  // Update question text
  $('mg1-question').textContent = question.text;

  // Render options
  renderMG1Options(question.options);

  // Reset extend button
  const extendBtn = $('mg1-extend');
  if (state.mg1ExtendUsed[data.questionId]) {
    extendBtn.disabled = true;
    extendBtn.classList.add('used');
  } else {
    extendBtn.disabled = false;
    extendBtn.classList.remove('used');
  }

  // Reset confirm button
  $('mg1-confirm').disabled = true;

  // Hide partner status
  $('mg1-partner-status').classList.add('hidden');
  const partnerText = $('mg1-partner-status').querySelector('span:last-child');
  if (partnerText) partnerText.textContent = 'El otro jugador esta respondiendo...';
}

function renderMG1Options(options) {
  const container = $('mg1-options');
  container.innerHTML = '';

  options.forEach((opt) => {
    const chip = document.createElement('button');
    chip.className = 'chip';
    chip.dataset.id = opt.id;
    chip.innerHTML = `<span class="chip-icon">${opt.icon}</span><span class="chip-label">${opt.label}</span>`;
    container.appendChild(chip);
  });
}

function setupMG1() {
  // Event delegation for chip selection
  $('mg1-options').addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip || chip.classList.contains('disabled') || state.answered) return;

    haptic();
    const optionId = chip.dataset.id;

    if (chip.classList.contains('selected')) {
      // Deselect
      chip.classList.remove('selected');
      state.currentSelections = state.currentSelections.filter((id) => id !== optionId);
      // Re-enable all chips
      $('mg1-options').querySelectorAll('.chip').forEach((c) => {
        c.classList.remove('disabled');
      });
    } else {
      // Select
      if (state.currentSelections.length < state.currentQuestionMaxSelect) {
        chip.classList.add('selected');
        state.currentSelections.push(optionId);

        // If at max, disable unselected
        if (state.currentSelections.length >= state.currentQuestionMaxSelect) {
          $('mg1-options').querySelectorAll('.chip').forEach((c) => {
            if (!c.classList.contains('selected')) {
              c.classList.add('disabled');
            }
          });
        }
      }
    }

    // Update confirm button
    $('mg1-confirm').disabled = state.currentSelections.length < 1;
  });

  // Confirm button
  $('mg1-confirm').addEventListener('click', () => {
    if (state.currentSelections.length < 1 || state.answered) return;
    haptic('heavy');
    state.answered = true;

    send({
      type: MSG.SUBMIT_ANSWER,
      phase: PHASES.MG1,
      questionId: state.currentQuestionId,
      answer: [...state.currentSelections],
    });

    // Disable all interaction
    $('mg1-confirm').disabled = true;
    $('mg1-options').querySelectorAll('.chip').forEach((c) => {
      c.classList.add('disabled');
    });

    // Show waiting if partner not done
    if (!state.partnerAnswered) {
      $('mg1-partner-status').classList.remove('hidden');
    }
  });

  // Extend timer
  $('mg1-extend').addEventListener('click', () => {
    if (state.mg1ExtendUsed[state.currentQuestionId]) return;
    haptic();
    state.mg1ExtendUsed[state.currentQuestionId] = true;
    $('mg1-extend').disabled = true;
    $('mg1-extend').classList.add('used');
    send({
      type: MSG.REQUEST_EXTEND,
      questionId: state.currentQuestionId,
    });
  });
}

// ============================================================
// Mini-Game 2: Important
// ============================================================

function renderMG2Important() {
  state.currentSelections = [];
  state.answered = false;
  state.partnerAnswered = false;

  const container = $('mg2i-options');
  container.innerHTML = '';

  MG2_IMPORTANT_OPTIONS.forEach((opt) => {
    const chip = document.createElement('button');
    chip.className = 'chip';
    chip.dataset.id = opt.id;
    chip.innerHTML = `<span class="chip-icon">${opt.icon}</span><span class="chip-label">${opt.label}</span>`;
    container.appendChild(chip);
  });

  // Reset search
  $('mg2i-search').value = '';

  // Reset counter
  $('mg2i-count').textContent = '0/3 seleccionadas';

  // Reset confirm
  $('mg2i-confirm').disabled = true;

  // Hide partner status
  $('mg2i-partner-status').classList.add('hidden');
}

function setupMG2Important() {
  // Event delegation for chip selection
  $('mg2i-options').addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip || chip.classList.contains('disabled') || state.answered) return;

    haptic();
    const optionId = chip.dataset.id;

    if (chip.classList.contains('selected')) {
      // Deselect
      chip.classList.remove('selected');
      state.currentSelections = state.currentSelections.filter((id) => id !== optionId);
      // Re-enable all visible chips
      $('mg2i-options').querySelectorAll('.chip').forEach((c) => {
        c.classList.remove('disabled');
      });
    } else {
      if (state.currentSelections.length < 3) {
        chip.classList.add('selected');
        state.currentSelections.push(optionId);

        if (state.currentSelections.length >= 3) {
          $('mg2i-options').querySelectorAll('.chip').forEach((c) => {
            if (!c.classList.contains('selected')) {
              c.classList.add('disabled');
            }
          });
        }
      }
    }

    // Update counter
    $('mg2i-count').textContent = `${state.currentSelections.length}/3 seleccionadas`;

    // Confirm enabled only at exactly 3
    $('mg2i-confirm').disabled = state.currentSelections.length !== 3;
  });

  // Search filter
  $('mg2i-search').addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    $('mg2i-options').querySelectorAll('.chip').forEach((chip) => {
      const label = chip.querySelector('.chip-label').textContent.toLowerCase();
      if (query === '' || label.includes(query)) {
        chip.style.display = '';
      } else {
        chip.style.display = 'none';
      }
    });
  });

  // Confirm
  $('mg2i-confirm').addEventListener('click', () => {
    if (state.currentSelections.length !== 3 || state.answered) return;
    haptic('heavy');
    state.answered = true;

    send({
      type: MSG.SUBMIT_ANSWER,
      phase: PHASES.MG2_IMPORTANT,
      answer: [...state.currentSelections],
    });

    $('mg2i-confirm').disabled = true;
    $('mg2i-options').querySelectorAll('.chip').forEach((c) => {
      c.classList.add('disabled');
    });

    if (!state.partnerAnswered) {
      $('mg2i-partner-status').classList.remove('hidden');
    }
  });
}

// ============================================================
// Mini-Game 2: No Want
// ============================================================

function renderMG2NoWant() {
  state.currentSelections = [];
  state.answered = false;
  state.partnerAnswered = false;

  const container = $('mg2n-options');
  container.innerHTML = '';

  MG2_NOWANT_OPTIONS.forEach((opt) => {
    const chip = document.createElement('button');
    chip.className = 'chip chip-nowant';
    chip.dataset.id = opt.id;
    chip.innerHTML = `<span class="chip-icon">${opt.icon}</span><span class="chip-label">${opt.label}</span>`;
    container.appendChild(chip);
  });

  // Reset search
  $('mg2n-search').value = '';

  // Reset counter
  $('mg2n-count').textContent = '0/3 seleccionadas';

  // Reset confirm
  $('mg2n-confirm').disabled = true;

  // Hide partner status
  $('mg2n-partner-status').classList.add('hidden');
}

function setupMG2NoWant() {
  // Event delegation for chip selection
  $('mg2n-options').addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip || chip.classList.contains('disabled') || state.answered) return;

    haptic();
    const optionId = chip.dataset.id;

    if (chip.classList.contains('selected')) {
      // Deselect
      chip.classList.remove('selected');
      state.currentSelections = state.currentSelections.filter((id) => id !== optionId);
      // Re-enable all visible chips
      $('mg2n-options').querySelectorAll('.chip').forEach((c) => {
        c.classList.remove('disabled');
      });
    } else {
      if (state.currentSelections.length < 3) {
        chip.classList.add('selected');
        state.currentSelections.push(optionId);

        if (state.currentSelections.length >= 3) {
          $('mg2n-options').querySelectorAll('.chip').forEach((c) => {
            if (!c.classList.contains('selected')) {
              c.classList.add('disabled');
            }
          });
        }
      }
    }

    // Update counter
    $('mg2n-count').textContent = `${state.currentSelections.length}/3 seleccionadas`;

    // Confirm enabled only at exactly 3
    $('mg2n-confirm').disabled = state.currentSelections.length !== 3;
  });

  // Search filter
  $('mg2n-search').addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    $('mg2n-options').querySelectorAll('.chip').forEach((chip) => {
      const label = chip.querySelector('.chip-label').textContent.toLowerCase();
      if (query === '' || label.includes(query)) {
        chip.style.display = '';
      } else {
        chip.style.display = 'none';
      }
    });
  });

  // Confirm
  $('mg2n-confirm').addEventListener('click', () => {
    if (state.currentSelections.length !== 3 || state.answered) return;
    haptic('heavy');
    state.answered = true;

    send({
      type: MSG.SUBMIT_ANSWER,
      phase: PHASES.MG2_NOWANT,
      answer: [...state.currentSelections],
    });

    $('mg2n-confirm').disabled = true;
    $('mg2n-options').querySelectorAll('.chip').forEach((c) => {
      c.classList.add('disabled');
    });

    if (!state.partnerAnswered) {
      $('mg2n-partner-status').classList.remove('hidden');
    }
  });
}

// ============================================================
// Mini-Game 3: Sliders
// ============================================================

function renderMG3Sliders() {
  state.answered = false;
  state.partnerAnswered = false;

  const container = $('mg3-sliders');
  container.innerHTML = '';

  MG3_SLIDERS.forEach((slider) => {
    const row = document.createElement('div');
    row.className = 'slider-row';

    const label = document.createElement('label');
    label.className = 'slider-label';
    label.textContent = slider.label;
    label.setAttribute('for', `slider-${slider.id}`);

    const inputWrap = document.createElement('div');
    inputWrap.className = 'slider-input-wrap';

    const minLabel = document.createElement('span');
    minLabel.className = 'slider-bound';
    minLabel.textContent = slider.min;

    const input = document.createElement('input');
    input.type = 'range';
    input.id = `slider-${slider.id}`;
    input.className = 'slider-range';
    input.min = slider.min;
    input.max = slider.max;
    input.value = slider.defaultValue;
    input.step = 1;
    input.dataset.tagId = slider.id;

    const maxLabel = document.createElement('span');
    maxLabel.className = 'slider-bound';
    maxLabel.textContent = slider.max;

    const valueDisplay = document.createElement('span');
    valueDisplay.className = 'slider-value';
    valueDisplay.id = `slider-val-${slider.id}`;
    valueDisplay.textContent = slider.defaultValue;

    // Update value on input
    input.addEventListener('input', () => {
      valueDisplay.textContent = input.value;
      haptic();
      // Update the CSS custom property for filled track (cross-browser)
      const pct = ((input.value - slider.min) / (slider.max - slider.min)) * 100;
      input.style.setProperty('--slider-pct', `${pct}%`);
    });

    // Set initial CSS custom property
    const initialPct = ((slider.defaultValue - slider.min) / (slider.max - slider.min)) * 100;
    input.style.setProperty('--slider-pct', `${initialPct}%`);

    inputWrap.appendChild(minLabel);
    inputWrap.appendChild(input);
    inputWrap.appendChild(maxLabel);

    row.appendChild(label);
    row.appendChild(inputWrap);
    row.appendChild(valueDisplay);

    container.appendChild(row);
  });

  // Reset confirm
  $('mg3-confirm').disabled = false;

  // Hide partner status
  $('mg3-partner-status').classList.add('hidden');
}

function setupMG3() {
  $('mg3-confirm').addEventListener('click', () => {
    if (state.answered) return;
    haptic('heavy');
    state.answered = true;

    // Collect all slider values
    const answer = {};
    MG3_SLIDERS.forEach((slider) => {
      const input = $(`slider-${slider.id}`);
      answer[slider.id] = parseInt(input.value, 10);
    });

    send({
      type: MSG.SUBMIT_ANSWER,
      phase: PHASES.MG3,
      answer,
    });

    $('mg3-confirm').disabled = true;
    // Disable all sliders
    $('mg3-sliders').querySelectorAll('input[type="range"]').forEach((inp) => {
      inp.disabled = true;
    });

    if (!state.partnerAnswered) {
      $('mg3-partner-status').classList.remove('hidden');
    }
  });
}

// ============================================================
// Timer Updates
// ============================================================

function handleTimerTick(data) {
  const remaining = data.remaining;
  const total = data.total || state.timerTotal || remaining;
  state.timerTotal = total;

  // Determine which prefix to use based on current phase
  let prefix;
  switch (state.currentPhase) {
    case PHASES.MG1:
      prefix = 'mg1';
      break;
    case PHASES.MG2_IMPORTANT:
      prefix = 'mg2i';
      break;
    case PHASES.MG2_NOWANT:
      prefix = 'mg2n';
      break;
    case PHASES.MG3:
      prefix = 'mg3';
      break;
    default:
      return;
  }

  updateTimerBar(prefix, remaining, total);
}

function updateTimerBar(prefix, remaining, total) {
  const timerEl = $(`${prefix}-timer`);
  const timerBarEl = $(`${prefix}-timer-bar`);

  if (timerEl) {
    timerEl.textContent = remaining;
  }

  if (timerBarEl) {
    const fill = timerBarEl.querySelector('.timer-bar-fill');
    if (fill) {
      const pct = total > 0 ? (remaining / total) * 100 : 0;

      requestAnimationFrame(() => {
        fill.style.width = `${pct}%`;

        // Color thresholds
        fill.classList.remove('timer-warning', 'timer-danger');
        if (remaining <= 5) {
          fill.classList.add('timer-danger');
          // Start urgency sound and shake at 5 seconds
          if (remaining === 5) {
            timerBarEl.classList.add('shake');
            haptic('heavy');
            startTimerWarning();
            setTimeout(() => timerBarEl.classList.remove('shake'), 500);
          }
        } else if (remaining <= 10) {
          fill.classList.add('timer-warning');
        }

        // Stop timer warning when timer resets or finishes
        if (remaining > 5 || remaining <= 0) {
          stopTimerWarning();
        }
      });
    }
  }
}

function handleTimerExtended(data) {
  // Server confirms timer was extended, update total
  if (data.total) {
    state.timerTotal = data.total;
  }
  if (data.remaining) {
    handleTimerTick({ remaining: data.remaining, total: data.total || state.timerTotal });
  }
}

// ============================================================
// Partner Status
// ============================================================

function showPartnerAnswered() {
  state.partnerAnswered = true;

  // Show checkmark in the appropriate partner-status element
  let statusEl;
  switch (state.currentPhase) {
    case PHASES.MG1:
      statusEl = $('mg1-partner-status');
      break;
    case PHASES.MG2_IMPORTANT:
      statusEl = $('mg2i-partner-status');
      break;
    case PHASES.MG2_NOWANT:
      statusEl = $('mg2n-partner-status');
      break;
    case PHASES.MG3:
      statusEl = $('mg3-partner-status');
      break;
    default:
      return;
  }

  if (statusEl) {
    statusEl.classList.remove('hidden');
    const textSpan = statusEl.querySelector('span:last-child');
    if (textSpan) {
      textSpan.textContent = 'El otro jugador ha respondido';
    }
    // Replace pulse dot with checkmark
    const dotSpan = statusEl.querySelector('.pulse-dot');
    if (dotSpan) {
      dotSpan.classList.remove('pulse-dot');
      dotSpan.classList.add('check-mark');
      dotSpan.textContent = '';
    }
  }
}

// ============================================================
// Results Screen
// ============================================================

function showResults(results) {
  state.currentPhase = PHASES.RESULTS;
  showScreen('screen-results');
  haptic('heavy');

  // Stop timer warning if active, play celebration fanfare
  stopTimerWarning();
  playCelebration();

  // Render tabs content
  const p1Cities = (results.player1 && results.player1.top4) || results.player1 || [];
  const p2Cities = (results.player2 && results.player2.top4) || results.player2 || [];
  const combinedCities = (results.combined && results.combined.top5) || results.combined || [];
  renderResultsPanel('results-p1', p1Cities, results.coincidences || []);
  renderResultsPanel('results-p2', p2Cities, results.coincidences || []);
  renderResultsPanel('results-combined', combinedCities, results.coincidences || []);

  // Render coincidences
  renderCoincidences(results.coincidences || []);

  // Render penalties (server sends { player1: [...], player2: [...] })
  const allPenalties = [
    ...(results.penalties && results.penalties.player1 || []),
    ...(results.penalties && results.penalties.player2 || []),
  ];
  renderPenalties(allPenalties);

  // Set default tab to combined
  // Set default tab to player's own results
  activateTab('p1');

  // Setup tab switching
  setupResultsTabs();
}

function renderResultsPanel(panelId, cities, coincidences) {
  const panel = $(panelId);
  if (!panel) return;
  panel.innerHTML = '';

  const coincidenceIds = coincidences.map((c) => (typeof c === 'string' ? c : c.id));

  cities.forEach((entry, index) => {
    const city = CITIES.find((c) => c.id === entry.cityId) || {};
    const isCoincidence = coincidenceIds.includes(entry.cityId);
    const scorePercent = Math.round((entry.score || 0) * 100);

    const card = document.createElement('div');
    card.className = `result-card${isCoincidence ? ' coincidence' : ''}`;

    // Rank badge
    const rank = document.createElement('span');
    rank.className = 'result-rank';
    rank.textContent = `${index + 1}`;

    // City info
    const info = document.createElement('div');
    info.className = 'result-info';

    const nameEl = document.createElement('h4');
    nameEl.className = 'result-city-name';
    nameEl.textContent = `${city.name || entry.cityId}`;

    const country = document.createElement('span');
    country.className = 'result-country';
    country.textContent = city.country || '';

    const scoreBar = document.createElement('div');
    scoreBar.className = 'result-score-bar';
    const scoreFill = document.createElement('div');
    scoreFill.className = 'result-score-fill';
    scoreFill.style.width = `${scorePercent}%`;
    scoreBar.appendChild(scoreFill);

    const scoreLabel = document.createElement('span');
    scoreLabel.className = 'result-score-label';
    scoreLabel.textContent = `${scorePercent}%`;

    // Top tags
    const tagsRow = document.createElement('div');
    tagsRow.className = 'result-tags';
    const topTags = (entry.topTags || []).slice(0, 3);
    topTags.forEach((t) => {
      const tagChip = document.createElement('span');
      tagChip.className = 'tag-chip';
      // Handle both string IDs and { tag, label } objects from server
      const tagId = typeof t === 'string' ? t : t.tag;
      const label = typeof t === 'string' ? (TAG_LABELS[t] || t) : (t.label || TAG_LABELS[t.tag] || t.tag);
      tagChip.textContent = label;
      tagsRow.appendChild(tagChip);
    });

    // Coincidence badge
    if (isCoincidence) {
      const badge = document.createElement('span');
      badge.className = 'coincidence-badge';
      badge.textContent = 'Coincidencia';
      info.appendChild(badge);
    }

    info.appendChild(nameEl);
    info.appendChild(country);
    info.appendChild(scoreBar);
    info.appendChild(scoreLabel);
    info.appendChild(tagsRow);

    // Inner wrapper for flip
    const inner = document.createElement('div');
    inner.className = 'result-card-inner';

    // Front face (existing content)
    const front = document.createElement('div');
    front.className = 'result-card-front';
    front.appendChild(rank);
    front.appendChild(info);

    // Back face (city info)
    const back = document.createElement('div');
    back.className = 'result-card-back';

    const cityInfo = CITY_INFO[entry.cityId];
    if (cityInfo) {
      const sections = [
        { key: 'pros', title: '\u{1F44D} Lo mejor', cssClass: 'pros' },
        { key: 'cons', title: '\u{1F44E} Lo peor', cssClass: 'cons' },
        { key: 'nature', title: '\u{1F33F} Naturaleza cerca', cssClass: 'nature' },
        { key: 'dishes', title: '\u{1F37D}\uFE0F Platos t\u00EDpicos', cssClass: 'dishes' },
      ];

      sections.forEach(({ key, title, cssClass }) => {
        const items = cityInfo[key];
        if (items && items.length > 0) {
          const section = document.createElement('div');
          section.className = `city-info-section ${cssClass}`;
          const h5 = document.createElement('h5');
          h5.textContent = title;
          section.appendChild(h5);
          items.forEach(item => {
            const p = document.createElement('div');
            p.className = 'city-info-item';
            p.textContent = item;
            section.appendChild(p);
          });
          back.appendChild(section);
        }
      });
      // Flight link
      if (cityInfo.flights) {
        const flightLink = document.createElement('a');
        flightLink.className = 'city-flight-link';
        flightLink.href = cityInfo.flights;
        flightLink.target = '_blank';
        flightLink.rel = 'noopener noreferrer';
        flightLink.innerHTML = '\u2708\uFE0F Ver vuelos';
        flightLink.addEventListener('click', (e) => e.stopPropagation());
        back.appendChild(flightLink);
      }
    } else {
      const noInfo = document.createElement('p');
      noInfo.textContent = 'Info no disponible';
      noInfo.style.color = 'rgba(255,255,255,0.5)';
      back.appendChild(noInfo);
    }

    inner.appendChild(front);
    inner.appendChild(back);
    card.appendChild(inner);

    // Add flip hint under the front
    const hint = document.createElement('div');
    hint.className = 'flip-hint';
    hint.innerHTML = 'Toca para ver m\u00E1s info <span class="flip-hint-icon">\u2192</span>';
    front.appendChild(hint);

    // Click to flip
    card.addEventListener('click', () => {
      card.classList.toggle('flipped');
    });

    panel.appendChild(card);
  });
}

function renderCoincidences(coincidences) {
  const container = $('results-coincidences');
  if (!container) return;
  container.innerHTML = '';

  if (coincidences.length === 0) {
    const msg = document.createElement('p');
    msg.className = 'no-coincidences';
    msg.textContent = 'No hay coincidencias directas, pero aqui va el top combinado';
    container.appendChild(msg);
    return;
  }

  const heading = document.createElement('h3');
  heading.className = 'coincidences-heading';
  heading.textContent = 'Coincidencias';
  container.appendChild(heading);

  const list = document.createElement('div');
  list.className = 'coincidence-list';

  coincidences.forEach((c) => {
    const cityId = typeof c === 'string' ? c : c.id;
    const city = CITIES.find((ci) => ci.id === cityId);

    const badge = document.createElement('div');
    badge.className = 'coincidence-item';
    badge.innerHTML = `<span class="coincidence-icon">&#127942;</span><span class="coincidence-name">${city ? city.name : cityId}</span>`;
    list.appendChild(badge);
  });

  container.appendChild(list);
}

function renderPenalties(penalties) {
  const container = $('results-penalties');
  if (!container) return;

  const content = container.querySelector('.penalties-content');
  if (!content) return;
  content.innerHTML = '';

  if (!penalties || penalties.length === 0) {
    const msg = document.createElement('p');
    msg.textContent = 'No se aplicaron ajustes.';
    content.appendChild(msg);
    return;
  }

  penalties.forEach((p) => {
    const item = document.createElement('div');
    item.className = 'penalty-item';

    const reason = document.createElement('span');
    reason.className = 'penalty-reason';
    reason.textContent = p.reason || p.label || '';

    const effect = document.createElement('span');
    effect.className = 'penalty-effect';
    effect.textContent = p.effect || '';

    item.appendChild(reason);
    item.appendChild(effect);
    content.appendChild(item);
  });
}

function setupResultsTabs() {
  const tabContainer = $('results-tabs');
  if (!tabContainer) return;

  // Remove old listeners by cloning
  const tabs = tabContainer.querySelectorAll('.tab');
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      haptic();
      activateTab(tab.dataset.tab);
    });
  });
}

function activateTab(tabName) {
  // Update tab buttons
  const tabs = $('results-tabs').querySelectorAll('.tab');
  tabs.forEach((t) => {
    t.classList.toggle('active', t.dataset.tab === tabName);
  });

  // Update panels
  const panelMap = { p1: 'results-p1', p2: 'results-p2', combined: 'results-combined' };
  Object.entries(panelMap).forEach(([key, panelId]) => {
    const panel = $(panelId);
    if (panel) {
      panel.classList.toggle('active', key === tabName);
    }
  });
}

// ============================================================
// Share Results
// ============================================================

function setupShareResults() {
  $('btn-share-results').addEventListener('click', async () => {
    haptic();

    // Build share text from combined results
    const combinedPanel = $('results-combined');
    const cards = combinedPanel ? combinedPanel.querySelectorAll('.result-card') : [];

    let text = '🎯 ¿A Donde Vamos? — Resultados\n\n🏆 Top combinado:\n';

    cards.forEach((card, i) => {
      const name = card.querySelector('.result-city-name');
      const country = card.querySelector('.result-country');
      const score = card.querySelector('.result-score-label');
      const tags = card.querySelectorAll('.tag-chip');

      const cityStr = name ? name.textContent : '';
      const countryStr = country ? ` (${country.textContent})` : '';
      const scoreStr = score ? ` — ${score.textContent}` : '';
      const tagStrs = Array.from(tags).map((t) => t.textContent).join(', ');

      text += `${i + 1}. ${cityStr}${countryStr}${scoreStr}\n`;
      if (tagStrs) {
        text += `   ✨ ${tagStrs}\n`;
      }
    });

    // Coincidences
    const coincItems = $('results-coincidences') ? $('results-coincidences').querySelectorAll('.coincidence-name') : [];
    if (coincItems.length > 0) {
      const names = Array.from(coincItems).map((el) => el.textContent);
      text += `\n🤝 Coincidencias: ${names.join(', ')}\n`;
    }

    text += `\n¡Juega tu tambien! ${location.origin}${location.pathname}`;

    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch {
        // User cancelled
      }
    } else {
      await copyToClipboard(text);
      showToast('Resultado copiado al portapapeles');
    }
  });
}

// ============================================================
// Rematch
// ============================================================

function setupRematch() {
  $('btn-rematch').addEventListener('click', () => {
    haptic();
    send({ type: MSG.REMATCH });
    $('btn-rematch').disabled = true;
    $('btn-rematch').textContent = 'Esperando...';
  });
}

function resetForRematch() {
  // Reset all game state
  state.mg1ExtendUsed = {};
  state.currentSelections = [];
  state.partnerAnswered = false;
  state.currentQuestionId = null;
  state.answered = false;

  // Reset rematch button
  $('btn-rematch').disabled = false;
  $('btn-rematch').textContent = 'Revancha';

  // Go to ready screen
  showReadyScreen();
  $('btn-ready').disabled = false;
  $('btn-ready').textContent = '¡Estoy listo!';
}

// ============================================================
// Disconnection & Error Overlays
// ============================================================

function showDisconnectOverlay(data) {
  const overlay = $('overlay-disconnect');
  overlay.classList.remove('hidden');

  if (data && data.countdown) {
    $('disconnect-countdown').textContent = data.countdown;
  }
}

function hideDisconnectOverlay() {
  $('overlay-disconnect').classList.add('hidden');
}

function updateDisconnectCountdown(data) {
  if (data && data.remaining !== undefined) {
    $('disconnect-countdown').textContent = data.remaining;
  }
}

function showAborted() {
  showError('El otro jugador se ha desconectado definitivamente. La partida ha terminado.');
}

function showError(message) {
  $('overlay-disconnect').classList.add('hidden');
  $('error-message').textContent = message || 'Ha ocurrido un error';
  $('overlay-error').classList.remove('hidden');
}

function setupErrorOverlay() {
  $('btn-back-lobby').addEventListener('click', () => {
    haptic();
    $('overlay-error').classList.add('hidden');

    // Stop music and any active sounds when returning to lobby
    requestMusicStop();
    stopTimerWarning();

    // Clean up state
    state.roomCode = null;
    state.playerId = null;
    state.soloMode = false;
    state.currentPhase = PHASES.LOBBY;
    state.mg1ExtendUsed = {};
    state.currentSelections = [];
    state.partnerAnswered = false;
    state.answered = false;

    showScreen('screen-lobby');

    // Clear URL params
    const url = new URL(location.href);
    url.searchParams.delete('room');
    url.searchParams.delete('solo');
    history.replaceState(null, '', url.pathname);

    // Reconnect WebSocket if needed
    if (!state.ws || state.ws.readyState !== WebSocket.OPEN) {
      connectWS();
    }
  });
}

// ============================================================
// Utility Functions
// ============================================================

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
    } catch {
      // Copy failed silently
    }
    document.body.removeChild(textarea);
    return true;
  }
}

function showToast(message, duration = 2500) {
  // Remove existing toast if any
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    toast.classList.add('toast-visible');
  });

  setTimeout(() => {
    toast.classList.remove('toast-visible');
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    // Fallback removal
    setTimeout(() => {
      if (toast.parentNode) toast.remove();
    }, 500);
  }, duration);
}

// ============================================================
// URL Parameter Handling
// ============================================================

function handleURLParams() {
  const params = new URLSearchParams(location.search);

  const roomCode = params.get('room');
  if (roomCode) {
    const input = $('input-code');
    input.value = roomCode.toUpperCase();
    // Auto-join after WS connects
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
// Initialization
// ============================================================

function init() {
  // Initialize audio engine (creates mute button, sets up interaction listeners)
  initAudio();

  // Connect WebSocket
  connectWS();

  // Setup all event listeners
  setupLobby();
  setupReadyCheck();
  setupInstructions();
  setupMG1();
  setupMG2Important();
  setupMG2NoWant();
  setupMG3();
  setupShareResults();
  setupRematch();
  setupErrorOverlay();

  // Handle URL params (auto-join, solo mode)
  handleURLParams();

  // Prevent iOS bounce/overscroll
  document.body.addEventListener(
    'touchmove',
    (e) => {
      // Allow scrolling inside scrollable containers
      if (e.target.closest('.scrollable') || e.target.closest('.sliders-container') || e.target.closest('.results-content')) {
        return;
      }
    },
    { passive: true }
  );
}

// Start app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
