// ============================================================
// A Donde Vamos - Game Server
// Node.js HTTP + WebSocket server for real-time 2-player game
// ============================================================

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { WebSocketServer } = require('ws');

// ============================================================
// Game Data (mirrored from public/data.js for server-side scoring)
// ============================================================

const TAGS = [
  'agua_cerca', 'montana_cerca', 'naturaleza_potente', 'caminable',
  'gastronomia', 'tranquilidad', 'paisajes', 'autentica',
  'diferente', 'excursiones_faciles'
];

const TAG_LABELS = {
  agua_cerca: 'Agua cerca',
  montana_cerca: 'Montaña cerca',
  naturaleza_potente: 'Naturaleza potente',
  caminable: 'Caminable',
  gastronomia: 'Gastronomía',
  tranquilidad: 'Tranquilidad',
  paisajes: 'Paisajes',
  autentica: 'Auténtica',
  diferente: 'Diferente',
  excursiones_faciles: 'Excursiones fáciles'
};

const CITIES = [
  { id: 'bilbao', name: 'Bilbao', country: 'España', tags: { agua_cerca: 1, montana_cerca: 2, naturaleza_potente: 2, caminable: 2, gastronomia: 2, tranquilidad: 1, paisajes: 2, autentica: 2, diferente: 1, excursiones_faciles: 2 } },
  { id: 'a_coruna', name: 'A Coruña', country: 'España', tags: { agua_cerca: 2, montana_cerca: 0, naturaleza_potente: 2, caminable: 2, gastronomia: 2, tranquilidad: 2, paisajes: 2, autentica: 2, diferente: 1, excursiones_faciles: 2 } },
  { id: 'santander', name: 'Santander', country: 'España', tags: { agua_cerca: 2, montana_cerca: 2, naturaleza_potente: 2, caminable: 2, gastronomia: 2, tranquilidad: 2, paisajes: 2, autentica: 2, diferente: 1, excursiones_faciles: 2 } },
  { id: 'palma', name: 'Palma de Mallorca', country: 'España', tags: { agua_cerca: 2, montana_cerca: 2, naturaleza_potente: 2, caminable: 2, gastronomia: 1, tranquilidad: 1, paisajes: 2, autentica: 1, diferente: 1, excursiones_faciles: 2 } },
  { id: 'menorca', name: 'Menorca', country: 'España', tags: { agua_cerca: 2, montana_cerca: 1, naturaleza_potente: 2, caminable: 1, gastronomia: 1, tranquilidad: 2, paisajes: 2, autentica: 2, diferente: 2, excursiones_faciles: 2 } },
  { id: 'paris', name: 'París', country: 'Francia', tags: { agua_cerca: 1, montana_cerca: 0, naturaleza_potente: 1, caminable: 2, gastronomia: 1, tranquilidad: 0, paisajes: 2, autentica: 1, diferente: 0, excursiones_faciles: 1 } },
  { id: 'lyon', name: 'Lyon', country: 'Francia', tags: { agua_cerca: 1, montana_cerca: 1, naturaleza_potente: 1, caminable: 2, gastronomia: 2, tranquilidad: 1, paisajes: 1, autentica: 2, diferente: 1, excursiones_faciles: 2 } },
  { id: 'nantes', name: 'Nantes', country: 'Francia', tags: { agua_cerca: 1, montana_cerca: 0, naturaleza_potente: 1, caminable: 2, gastronomia: 1, tranquilidad: 2, paisajes: 1, autentica: 2, diferente: 1, excursiones_faciles: 2 } },
  { id: 'toulouse', name: 'Toulouse', country: 'Francia', tags: { agua_cerca: 1, montana_cerca: 2, naturaleza_potente: 2, caminable: 2, gastronomia: 1, tranquilidad: 2, paisajes: 2, autentica: 2, diferente: 1, excursiones_faciles: 2 } },
  { id: 'estrasburgo', name: 'Estrasburgo', country: 'Francia', tags: { agua_cerca: 1, montana_cerca: 1, naturaleza_potente: 1, caminable: 2, gastronomia: 1, tranquilidad: 2, paisajes: 2, autentica: 1, diferente: 2, excursiones_faciles: 2 } },
  { id: 'bolonia', name: 'Bolonia', country: 'Italia', tags: { agua_cerca: 0, montana_cerca: 1, naturaleza_potente: 1, caminable: 2, gastronomia: 2, tranquilidad: 1, paisajes: 1, autentica: 2, diferente: 1, excursiones_faciles: 2 } },
  { id: 'turin', name: 'Turín', country: 'Italia', tags: { agua_cerca: 0, montana_cerca: 2, naturaleza_potente: 2, caminable: 2, gastronomia: 2, tranquilidad: 2, paisajes: 2, autentica: 2, diferente: 1, excursiones_faciles: 2 } },
  { id: 'ginebra', name: 'Ginebra', country: 'Suiza', tags: { agua_cerca: 2, montana_cerca: 2, naturaleza_potente: 2, caminable: 2, gastronomia: 1, tranquilidad: 2, paisajes: 2, autentica: 1, diferente: 1, excursiones_faciles: 2 } },
  { id: 'praga', name: 'Praga', country: 'República Checa', tags: { agua_cerca: 1, montana_cerca: 1, naturaleza_potente: 1, caminable: 2, gastronomia: 1, tranquilidad: 1, paisajes: 2, autentica: 1, diferente: 2, excursiones_faciles: 2 } },
  { id: 'sofia', name: 'Sofía', country: 'Bulgaria', tags: { agua_cerca: 0, montana_cerca: 2, naturaleza_potente: 2, caminable: 2, gastronomia: 1, tranquilidad: 2, paisajes: 2, autentica: 2, diferente: 2, excursiones_faciles: 2 } }
];

const MG1_QUESTIONS = [
  {
    id: 'q1', text: 'Que imagen te atrae mas?', maxSelect: 2, timer: 20,
    options: [
      { id: 'agua', label: 'Agua', icon: '🌊', tags: { agua_cerca: 1.0 } },
      { id: 'calles_bonitas', label: 'Calles bonitas', icon: '🏘️', tags: { caminable: 0.7, paisajes: 0.3 } },
      { id: 'naturaleza', label: 'Naturaleza', icon: '🌿', tags: { naturaleza_potente: 1.0 } },
      { id: 'comida', label: 'Comida', icon: '🍽️', tags: { gastronomia: 1.0 } }
    ]
  },
  {
    id: 'q2', text: 'Tu ritmo ideal?', maxSelect: 2, timer: 20,
    options: [
      { id: 'muy_tranquilo', label: 'Muy tranquilo', icon: '😌', tags: { tranquilidad: 1.0 } },
      { id: 'tranquilo_activo', label: 'Tranquilo pero activo', icon: '🚶', tags: { caminable: 0.6, excursiones_faciles: 0.4 } },
      { id: 'explorar_bastante', label: 'Explorar bastante', icon: '🧭', tags: { excursiones_faciles: 0.6, diferente: 0.4 } }
    ]
  },
  {
    id: 'q3', text: 'Que te atrae mas?', maxSelect: 2, timer: 20,
    options: [
      { id: 'bonito_visual', label: 'Bonito visualmente', icon: '✨', tags: { paisajes: 0.7, caminable: 0.3 } },
      { id: 'autentico', label: 'Auténtico', icon: '🏺', tags: { autentica: 1.0 } },
      { id: 'diferente', label: 'Diferente', icon: '🗺️', tags: { diferente: 1.0 } }
    ]
  },
  {
    id: 'q4', text: 'Que te gustaria tener cerca?', maxSelect: 2, timer: 20,
    options: [
      { id: 'mar', label: 'Mar', icon: '🏖️', tags: { agua_cerca: 1.0 } },
      { id: 'montana', label: 'Montaña', icon: '⛰️', tags: { montana_cerca: 1.0 } },
      { id: 'pueblos', label: 'Pueblos', icon: '🏡', tags: { excursiones_faciles: 0.6, paisajes: 0.4 } },
      { id: 'me_da_igual', label: 'Me da igual', icon: '🤷', tags: {} }
    ]
  },
  {
    id: 'q5', text: 'Que te ilusiona mas?', maxSelect: 2, timer: 20,
    options: [
      { id: 'pasear', label: 'Pasear sin rumbo', icon: '👣', tags: { caminable: 0.7, paisajes: 0.3 } },
      { id: 'paisajes', label: 'Ver paisajes', icon: '🏞️', tags: { paisajes: 1.0 } },
      { id: 'comer', label: 'Comer bien', icon: '🧑‍🍳', tags: { gastronomia: 1.0 } }
    ]
  }
];

const MG2_IMPORTANT_OPTIONS = [
  { id: 'imp_naturaleza', label: 'Naturaleza cerca', icon: '🌿', tags: { naturaleza_potente: 1.0 } },
  { id: 'imp_montana', label: 'Montaña cerca', icon: '⛰️', tags: { montana_cerca: 1.0 } },
  { id: 'imp_agua', label: 'Agua cerca (mar/lago/río)', icon: '🌊', tags: { agua_cerca: 1.0 } },
  { id: 'imp_paisajes', label: 'Ver paisajes', icon: '🏞️', tags: { paisajes: 1.0 } },
  { id: 'imp_caminar', label: 'Caminar mucho', icon: '🚶', tags: { caminable: 1.0 } },
  { id: 'imp_tranquilidad', label: 'Tranquilidad', icon: '😌', tags: { tranquilidad: 1.0 } },
  { id: 'imp_autentico', label: 'Sentirlo auténtico', icon: '🏺', tags: { autentica: 1.0 } },
  { id: 'imp_diferente', label: 'Algo diferente', icon: '🗺️', tags: { diferente: 1.0 } },
  { id: 'imp_comer', label: 'Comer muy bien', icon: '🍽️', tags: { gastronomia: 1.0 } },
  { id: 'imp_excursiones', label: 'Excursiones fáciles cerca', icon: '🚌', tags: { excursiones_faciles: 1.0 } },
  { id: 'imp_sin_coche', label: 'Ciudad cómoda sin coche', icon: '🚶‍♀️', tags: { caminable: 0.6, excursiones_faciles: 0.4 } },
  { id: 'imp_transporte', label: 'Buen transporte público', icon: '🚇', tags: { caminable: 0.5, excursiones_faciles: 0.5 } },
  { id: 'imp_relajada', label: 'Escapada relajada', icon: '🧘', tags: { excursiones_faciles: 0.6, tranquilidad: 0.4 } },
  { id: 'imp_precio', label: 'Buena relación calidad/precio', icon: '💰', tags: {} },
  { id: 'imp_compacta', label: 'Ciudad mediana/compacta', icon: '🏘️', tags: { caminable: 1.0 } }
];

const MG2_NOWANT_OPTIONS = [
  { id: 'no_masificacion', label: 'Mucha masificación turística', icon: '👥', penalty: { autentica: 0.04, tranquilidad: 0.04 } },
  { id: 'no_grande', label: 'Ciudad muy grande', icon: '🏙️', penalty: { caminable: 0.03, tranquilidad: 0.03 }, affectedCities: ['paris'] },
  { id: 'no_caro', label: 'Destino caro', icon: '💸', penalty: {}, affectedCities: ['ginebra', 'paris'], cityPenalty: 0.08 },
  { id: 'no_coche', label: 'Tener que usar coche sí o sí', icon: '🚗', penalty: { caminable: 0.05 } },
  { id: 'no_traslados', label: 'Demasiados traslados largos', icon: '🛣️', penalty: { excursiones_faciles: 0.05 } },
  { id: 'no_aburrido', label: 'Lugar demasiado tranquilo', icon: '😴', penalty: { tranquilidad: -0.05 } },
  { id: 'no_postal', label: 'Mucho "de postal" y poco auténtico', icon: '📸', penalty: { autentica: 0.05 } },
  { id: 'no_comida', label: 'Comida poco interesante', icon: '😕', penalty: { gastronomia: 0.05 } },
  { id: 'no_urbano', label: 'Demasiado urbano sin naturaleza', icon: '🏢', penalty: { naturaleza_potente: 0.05 } },
  { id: 'no_cuestas', label: 'Demasiadas cuestas/esfuerzo', icon: '🥵', penalty: { caminable: 0.03 } },
  { id: 'no_frio', label: 'Clima muy frío', icon: '🥶', penalty: {} },
  { id: 'no_lluvia', label: 'Lluvia frecuente', icon: '🌧️', penalty: {} },
  { id: 'no_pie', label: 'Dificultad de moverse a pie', icon: '🦶', penalty: { caminable: 0.05 } },
  { id: 'no_paseos', label: 'Pocas opciones de paseos', icon: '🚷', penalty: { paisajes: 0.03, excursiones_faciles: 0.03 } },
  { id: 'no_conocido', label: 'Destino "muy conocido"', icon: '🌍', penalty: {}, boostTag: 'diferente', boostAmount: 0.05 }
];

const SCORING_WEIGHTS = { mg1: 0.30, mg2: 0.40, mg3: 0.30 };
const EPSILON = 0.0001;

// Timer durations (seconds)
const TIMERS = {
  MG1_PER_QUESTION: 30,
  MG2_IMPORTANT: 60,
  MG2_NOWANT: 60,
  MG3: 60,
  INSTRUCTIONS: 5,
  COUNTDOWN_AFTER_READY: 3,
  RECONNECT: 60,
  BOT_READY_DELAY: 1000,
  BOT_ANSWER_MIN: 1000,
  BOT_ANSWER_MAX: 3000
};

// Message types (must match data.js MSG exactly)
const MSG = {
  CREATE_ROOM: 'create_room',
  JOIN_ROOM: 'join_room',
  PLAYER_READY: 'player_ready',
  SUBMIT_ANSWER: 'submit_answer',
  REQUEST_EXTEND: 'request_extend',
  REMATCH: 'rematch',
  CREATE_SOLO: 'create_solo',
  ROOM_CREATED: 'room_created',
  PLAYER_JOINED: 'player_joined',
  PLAYER_DISCONNECTED: 'player_disconnected',
  PLAYER_RECONNECTED: 'player_reconnected',
  BOTH_READY: 'both_ready',
  GAME_START: 'game_start',
  SHOW_INSTRUCTIONS: 'show_instructions',
  QUESTION: 'question',
  TIMER_TICK: 'timer_tick',
  TIMER_EXTENDED: 'timer_extended',
  PARTNER_ANSWERED: 'partner_answered',
  PHASE_CHANGE: 'phase_change',
  RESULTS: 'results',
  WAITING_RECONNECT: 'waiting_reconnect',
  GAME_ABORTED: 'game_aborted',
  REMATCH_READY: 'rematch_ready',
  SHOW_INTRO: 'show_intro',
  INTRO_ALL_READY: 'intro_all_ready',
  ERROR: 'error'
};

const PHASES = {
  LOBBY: 'lobby',
  INTRO: 'intro',
  READY: 'ready',
  INSTRUCTIONS: 'instructions',
  MG1: 'mg1',
  MG2_IMPORTANT: 'mg2_important',
  MG2_NOWANT: 'mg2_nowant',
  MG3: 'mg3',
  RESULTS: 'results'
};

// ============================================================
// Room Management
// ============================================================

const rooms = new Map();

function generateRoomCode() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // Excludes O, 0, I, 1, L
  let code;
  do {
    code = '';
    for (let i = 0; i < 4; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
  } while (rooms.has(code));
  return code;
}

function generatePlayerId() {
  return 'p_' + Math.random().toString(36).substring(2, 10);
}

function createRoom(soloMode = false) {
  const code = generateRoomCode();
  const room = {
    code,
    players: [],
    phase: PHASES.LOBBY,
    currentQuestion: null,
    currentQuestionIndex: 0,
    timer: null,
    timerRemaining: 0,
    extendUsed: new Map(),
    botMode: soloMode,
    rematchRequests: new Set(),
    reconnectTimers: new Map(),
    aborted: false,
    instructionsReady: new Set(),
    instructionsTimer: null,
    introReady: new Set()
  };
  rooms.set(code, room);
  return room;
}

function addPlayer(room, ws, name) {
  const id = generatePlayerId();
  const player = {
    ws,
    id,
    name: name || `Jugador ${room.players.length + 1}`,
    ready: false,
    answers: {},
    connected: true,
    isBot: false
  };
  room.players.push(player);
  return player;
}

function addBotPlayer(room) {
  const id = generatePlayerId();
  const player = {
    ws: null,
    id,
    name: 'Bot',
    ready: false,
    answers: {},
    connected: true,
    isBot: true
  };
  room.players.push(player);
  return player;
}

function findRoomByWs(ws) {
  for (const [, room] of rooms) {
    const player = room.players.find(p => p.ws === ws);
    if (player) return { room, player };
  }
  return { room: null, player: null };
}

function findRoomByCode(code) {
  return rooms.get(code.toUpperCase()) || null;
}

function getPartner(room, playerId) {
  return room.players.find(p => p.id !== playerId) || null;
}

function cleanupRoom(code) {
  const room = rooms.get(code);
  if (!room) return;
  clearRoomTimer(room);
  for (const [, timer] of room.reconnectTimers) {
    clearInterval(timer.interval);
    clearTimeout(timer.timeout);
  }
  rooms.delete(code);
}

// ============================================================
// WebSocket Helpers
// ============================================================

function send(ws, type, data = {}) {
  if (ws && ws.readyState === 1) { // WebSocket.OPEN
    try {
      ws.send(JSON.stringify({ type, ...data }));
    } catch (err) {
      console.error(`[WS] Send error: ${err.message}`);
    }
  }
}

function broadcast(room, type, data = {}) {
  for (const player of room.players) {
    if (!player.isBot && player.connected) {
      send(player.ws, type, data);
    }
  }
}

function sendToPlayer(room, playerId, type, data = {}) {
  const player = room.players.find(p => p.id === playerId);
  if (player && !player.isBot && player.connected) {
    send(player.ws, type, data);
  }
}

function sendError(ws, message) {
  send(ws, MSG.ERROR, { message });
}

// ============================================================
// Timer Management
// ============================================================

function clearRoomTimer(room) {
  if (room.timer) {
    clearInterval(room.timer);
    room.timer = null;
  }
  room.timerRemaining = 0;
}

function startTimer(room, seconds, onTick, onExpire) {
  clearRoomTimer(room);
  room.timerRemaining = seconds;

  // Send initial tick immediately
  onTick(room.timerRemaining);

  room.timer = setInterval(() => {
    room.timerRemaining--;
    if (room.timerRemaining <= 0) {
      clearRoomTimer(room);
      onExpire();
    } else {
      onTick(room.timerRemaining);
    }
  }, 1000);
}

// ============================================================
// Game Flow
// ============================================================

function handleIntroDone(room, player) {
  if (room.phase !== PHASES.INTRO) return;
  room.introReady.add(player.id);

  // Notify partner that this player is ready
  room.players.forEach(p => {
    if (p.id !== player.id && !p.isBot) {
      send(p.ws, 'partner_intro_ready', {});
    }
  });

  // Bot auto-readies
  if (room.botMode) {
    const bot = room.players.find(p => p.isBot);
    if (bot) room.introReady.add(bot.id);
  }

  // If both ready, move to the ready screen
  if (room.introReady.size >= room.players.length) {
    room.phase = PHASES.READY;
    broadcast(room, MSG.INTRO_ALL_READY);

    // In bot mode, auto-ready the bot for the game
    if (room.botMode) {
      const bot = room.players.find(p => p.isBot);
      if (bot) {
        setTimeout(() => {
          bot.ready = true;
          if (checkBothReady(room)) {
            startGameSequence(room);
          }
        }, TIMERS.BOT_READY_DELAY);
      }
    }
  }
}

function checkBothReady(room) {
  if (room.players.length < 2) return false;
  return room.players.every(p => p.ready);
}

function startGameSequence(room) {
  room.phase = PHASES.READY;
  broadcast(room, MSG.BOTH_READY);

  // 3-second countdown then start game
  setTimeout(() => {
    if (room.aborted) return;
    broadcast(room, MSG.GAME_START);
    startMiniGame(room, PHASES.MG1);
  }, TIMERS.COUNTDOWN_AFTER_READY * 1000);
}

function startMiniGame(room, phase) {
  if (room.aborted) return;

  room.phase = PHASES.INSTRUCTIONS;
  room.instructionsReady.clear();
  room.pendingPhase = phase;
  broadcast(room, MSG.SHOW_INSTRUCTIONS, { phase });

  // Auto-advance after timeout (fallback if players don't click)
  if (room.instructionsTimer) clearTimeout(room.instructionsTimer);
  room.instructionsTimer = setTimeout(() => {
    advanceFromInstructions(room);
  }, TIMERS.INSTRUCTIONS * 1000);
}

function advanceFromInstructions(room) {
  if (room.aborted || room.phase !== PHASES.INSTRUCTIONS) return;
  if (room.instructionsTimer) {
    clearTimeout(room.instructionsTimer);
    room.instructionsTimer = null;
  }

  const phase = room.pendingPhase;
  room.phase = phase;
  broadcast(room, MSG.PHASE_CHANGE, { phase });

  switch (phase) {
    case PHASES.MG1:
      startMG1(room);
      break;
    case PHASES.MG2_IMPORTANT:
      startMG2Important(room);
      break;
    case PHASES.MG2_NOWANT:
      startMG2NoWant(room);
      break;
    case PHASES.MG3:
      startMG3(room);
      break;
  }
}

function handleInstructionsDone(room, player) {
  if (room.phase !== PHASES.INSTRUCTIONS) return;
  room.instructionsReady.add(player.id);

  // Notify the other player that this one is ready
  room.players.forEach(p => {
    if (p.id !== player.id && !p.isBot) {
      send(p.ws, 'partner_instructions_ready', {});
    }
  });

  // Bot auto-readies
  if (room.botMode) {
    const bot = room.players.find(p => p.isBot);
    if (bot) room.instructionsReady.add(bot.id);
  }

  // If both players ready, advance immediately
  const humanAndBotCount = room.players.length;
  if (room.instructionsReady.size >= humanAndBotCount) {
    advanceFromInstructions(room);
  }
}

// --- MG1: Emotional Test (one question at a time) ---

function startMG1(room) {
  room.currentQuestionIndex = 0;
  sendMG1Question(room);
}

function sendMG1Question(room) {
  if (room.aborted) return;

  const idx = room.currentQuestionIndex;
  if (idx >= MG1_QUESTIONS.length) {
    // MG1 complete, move to MG2 important
    startMiniGame(room, PHASES.MG2_IMPORTANT);
    return;
  }

  const question = MG1_QUESTIONS[idx];
  room.currentQuestion = question.id;

  // Clear per-question answer tracking
  for (const player of room.players) {
    delete player.answers[`mg1_${question.id}`];
  }

  broadcast(room, MSG.QUESTION, {
    phase: PHASES.MG1,
    questionId: question.id,
    questionData: question,
    timerSeconds: TIMERS.MG1_PER_QUESTION
  });

  // Schedule bot answer
  if (room.botMode) {
    scheduleBotAnswerMG1(room, question);
  }

  // Start timer
  startTimer(room, TIMERS.MG1_PER_QUESTION,
    (remaining) => broadcast(room, MSG.TIMER_TICK, { remaining }),
    () => onMG1TimerExpire(room)
  );
}

function onMG1TimerExpire(room) {
  if (room.aborted) return;

  // Auto-submit empty answers for players who haven't answered
  const question = MG1_QUESTIONS[room.currentQuestionIndex];
  for (const player of room.players) {
    const key = `mg1_${question.id}`;
    if (!player.answers[key]) {
      player.answers[key] = [];
    }
  }
  advanceMG1(room);
}

function advanceMG1(room) {
  room.currentQuestionIndex++;
  sendMG1Question(room);
}

function checkMG1BothAnswered(room) {
  const question = MG1_QUESTIONS[room.currentQuestionIndex];
  if (!question) return false;
  const key = `mg1_${question.id}`;
  return room.players.every(p => p.answers[key] !== undefined);
}

// --- MG2 Important ---

function startMG2Important(room) {
  room.currentQuestion = 'mg2_important';

  // Clear answers
  for (const player of room.players) {
    delete player.answers.mg2_important;
  }

  broadcast(room, MSG.QUESTION, {
    phase: PHASES.MG2_IMPORTANT,
    questionId: 'mg2_important',
    questionData: { options: MG2_IMPORTANT_OPTIONS, maxSelect: 3 },
    timerSeconds: TIMERS.MG2_IMPORTANT
  });

  if (room.botMode) {
    scheduleBotAnswerMG2Important(room);
  }

  startTimer(room, TIMERS.MG2_IMPORTANT,
    (remaining) => broadcast(room, MSG.TIMER_TICK, { remaining }),
    () => onMG2ImportantTimerExpire(room)
  );
}

function onMG2ImportantTimerExpire(room) {
  if (room.aborted) return;
  for (const player of room.players) {
    if (!player.answers.mg2_important) {
      player.answers.mg2_important = [];
    }
  }
  // Move to MG2 no-want (no instructions screen between important and no-want)
  startMG2NoWantDirect(room);
}

function startMG2NoWantDirect(room) {
  room.phase = PHASES.MG2_NOWANT;
  room.currentQuestion = 'mg2_nowant';

  for (const player of room.players) {
    delete player.answers.mg2_nowant;
  }

  broadcast(room, MSG.PHASE_CHANGE, { phase: PHASES.MG2_NOWANT });

  broadcast(room, MSG.QUESTION, {
    phase: PHASES.MG2_NOWANT,
    questionId: 'mg2_nowant',
    questionData: { options: MG2_NOWANT_OPTIONS, maxSelect: 3 },
    timerSeconds: TIMERS.MG2_NOWANT
  });

  if (room.botMode) {
    scheduleBotAnswerMG2NoWant(room);
  }

  startTimer(room, TIMERS.MG2_NOWANT,
    (remaining) => broadcast(room, MSG.TIMER_TICK, { remaining }),
    () => onMG2NoWantTimerExpire(room)
  );
}

// --- MG2 No Want ---

function startMG2NoWant(room) {
  // This is called from the mini-game flow with instructions.
  // But MG2 no-want doesn't need its own instructions since it's part of MG2.
  // We handle it via startMG2NoWantDirect instead.
  startMG2NoWantDirect(room);
}

function onMG2NoWantTimerExpire(room) {
  if (room.aborted) return;
  for (const player of room.players) {
    if (!player.answers.mg2_nowant) {
      player.answers.mg2_nowant = [];
    }
  }
  startMiniGame(room, PHASES.MG3);
}

// --- MG3: Sliders ---

function startMG3(room) {
  room.currentQuestion = 'mg3';

  for (const player of room.players) {
    delete player.answers.mg3;
  }

  const sliders = TAGS.map(tag => ({
    id: tag,
    label: TAG_LABELS[tag],
    min: 1,
    max: 5,
    defaultValue: 3
  }));

  broadcast(room, MSG.QUESTION, {
    phase: PHASES.MG3,
    questionId: 'mg3',
    questionData: { sliders },
    timerSeconds: TIMERS.MG3
  });

  if (room.botMode) {
    scheduleBotAnswerMG3(room);
  }

  startTimer(room, TIMERS.MG3,
    (remaining) => broadcast(room, MSG.TIMER_TICK, { remaining }),
    () => onMG3TimerExpire(room)
  );
}

function onMG3TimerExpire(room) {
  if (room.aborted) return;
  // Auto-submit default values (3) for players who haven't answered
  const defaultAnswers = {};
  for (const tag of TAGS) {
    defaultAnswers[tag] = 3;
  }
  for (const player of room.players) {
    if (!player.answers.mg3) {
      player.answers.mg3 = { ...defaultAnswers };
    }
  }
  finishGame(room);
}

function finishGame(room) {
  if (room.aborted) return;
  clearRoomTimer(room);

  const results = computeResults(room);
  room.phase = PHASES.RESULTS;
  broadcast(room, MSG.RESULTS, { results });
}

// ============================================================
// Answer Submission
// ============================================================

function handleSubmitAnswer(room, player, data) {
  const { phase, questionId, answer } = data;

  switch (phase) {
    case PHASES.MG1: {
      const key = `mg1_${questionId}`;
      if (player.answers[key] !== undefined) {
        return; // Already answered
      }
      // Validate: answer should be an array of option IDs
      if (!Array.isArray(answer)) return;
      player.answers[key] = answer;

      // Notify partner
      const partner = getPartner(room, player.id);
      if (partner && !partner.isBot) {
        sendToPlayer(room, partner.id, MSG.PARTNER_ANSWERED);
      }

      if (checkMG1BothAnswered(room)) {
        clearRoomTimer(room);
        // Small delay before advancing so clients see the partner_answered
        setTimeout(() => advanceMG1(room), 500);
      }
      break;
    }

    case PHASES.MG2_IMPORTANT: {
      if (player.answers.mg2_important !== undefined) return;
      if (!Array.isArray(answer)) return;
      player.answers.mg2_important = answer;

      const partner = getPartner(room, player.id);
      if (partner && !partner.isBot) {
        sendToPlayer(room, partner.id, MSG.PARTNER_ANSWERED);
      }

      if (room.players.every(p => p.answers.mg2_important !== undefined)) {
        clearRoomTimer(room);
        setTimeout(() => startMG2NoWantDirect(room), 500);
      }
      break;
    }

    case PHASES.MG2_NOWANT: {
      if (player.answers.mg2_nowant !== undefined) return;
      if (!Array.isArray(answer)) return;
      player.answers.mg2_nowant = answer;

      const partner = getPartner(room, player.id);
      if (partner && !partner.isBot) {
        sendToPlayer(room, partner.id, MSG.PARTNER_ANSWERED);
      }

      if (room.players.every(p => p.answers.mg2_nowant !== undefined)) {
        clearRoomTimer(room);
        setTimeout(() => startMiniGame(room, PHASES.MG3), 500);
      }
      break;
    }

    case PHASES.MG3: {
      if (player.answers.mg3 !== undefined) return;
      if (typeof answer !== 'object' || answer === null) return;
      player.answers.mg3 = answer;

      const partner = getPartner(room, player.id);
      if (partner && !partner.isBot) {
        sendToPlayer(room, partner.id, MSG.PARTNER_ANSWERED);
      }

      if (room.players.every(p => p.answers.mg3 !== undefined)) {
        clearRoomTimer(room);
        setTimeout(() => finishGame(room), 500);
      }
      break;
    }
  }
}

// ============================================================
// Timer Extension
// ============================================================

function handleRequestExtend(room, player, data) {
  const { questionId } = data;

  // Only allow in MG1
  if (room.phase !== PHASES.MG1) return;

  const extendKey = `${player.id}_${questionId}`;
  if (room.extendUsed.has(extendKey)) {
    sendToPlayer(room, player.id, MSG.ERROR, { message: 'Ya usaste +10s en esta pregunta' });
    return;
  }

  room.extendUsed.set(extendKey, true);
  room.timerRemaining += 10;

  broadcast(room, MSG.TIMER_EXTENDED, {
    remaining: room.timerRemaining,
    playerId: player.id
  });
}

// ============================================================
// Bot Player Logic
// ============================================================

function randomDelay() {
  return TIMERS.BOT_ANSWER_MIN + Math.random() * (TIMERS.BOT_ANSWER_MAX - TIMERS.BOT_ANSWER_MIN);
}

function pickRandom(arr, count) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function scheduleBotAnswerMG1(room, question) {
  const bot = room.players.find(p => p.isBot);
  if (!bot) return;

  setTimeout(() => {
    if (room.aborted) return;
    const numPicks = 1 + Math.floor(Math.random() * Math.min(2, question.maxSelect));
    const picks = pickRandom(question.options, numPicks).map(o => o.id);
    handleSubmitAnswer(room, bot, {
      phase: PHASES.MG1,
      questionId: question.id,
      answer: picks
    });
  }, randomDelay());
}

function scheduleBotAnswerMG2Important(room) {
  const bot = room.players.find(p => p.isBot);
  if (!bot) return;

  setTimeout(() => {
    if (room.aborted) return;
    const picks = pickRandom(MG2_IMPORTANT_OPTIONS, 3).map(o => o.id);
    handleSubmitAnswer(room, bot, {
      phase: PHASES.MG2_IMPORTANT,
      questionId: 'mg2_important',
      answer: picks
    });
  }, randomDelay());
}

function scheduleBotAnswerMG2NoWant(room) {
  const bot = room.players.find(p => p.isBot);
  if (!bot) return;

  setTimeout(() => {
    if (room.aborted) return;
    const picks = pickRandom(MG2_NOWANT_OPTIONS, 3).map(o => o.id);
    handleSubmitAnswer(room, bot, {
      phase: PHASES.MG2_NOWANT,
      questionId: 'mg2_nowant',
      answer: picks
    });
  }, randomDelay());
}

function scheduleBotAnswerMG3(room) {
  const bot = room.players.find(p => p.isBot);
  if (!bot) return;

  setTimeout(() => {
    if (room.aborted) return;
    const sliderAnswers = {};
    for (const tag of TAGS) {
      sliderAnswers[tag] = 1 + Math.floor(Math.random() * 5);
    }
    handleSubmitAnswer(room, bot, {
      phase: PHASES.MG3,
      questionId: 'mg3',
      answer: sliderAnswers
    });
  }, randomDelay());
}

// ============================================================
// Scoring Engine
// ============================================================

function computeResults(room) {
  const [player1, player2] = room.players;

  const p1Scores = computePlayerScores(player1);
  const p2Scores = computePlayerScores(player2);

  // Build result objects
  const p1Top4 = getTopCities(p1Scores, 4);
  const p2Top4 = getTopCities(p2Scores, 4);

  // Combined scores
  const combinedScores = {};
  for (const city of CITIES) {
    combinedScores[city.id] = ((p1Scores[city.id] || 0) + (p2Scores[city.id] || 0)) / 2;
  }
  const combinedTop5 = getTopCities(combinedScores, 5);

  // Find coincidences
  const p1Top4Ids = new Set(p1Top4.map(c => c.cityId));
  const p2Top4Ids = new Set(p2Top4.map(c => c.cityId));
  const coincidences = [...p1Top4Ids].filter(id => p2Top4Ids.has(id));

  // Build tag profiles
  const p1Profile = buildTagProfile(player1);
  const p2Profile = buildTagProfile(player2);

  // Build penalty explanations
  const p1Penalties = buildPenaltyExplanation(player1);
  const p2Penalties = buildPenaltyExplanation(player2);

  return {
    player1: { id: player1.id, name: player1.name, top4: p1Top4, tagProfile: p1Profile },
    player2: { id: player2.id, name: player2.name, top4: p2Top4, tagProfile: p2Profile },
    combined: { top5: combinedTop5 },
    coincidences,
    penalties: { player1: p1Penalties, player2: p2Penalties }
  };
}

function computePlayerScores(player) {
  const scores = {};

  // Build preference vectors for each mini-game
  const mg1Prefs = buildMG1Preferences(player);
  const mg2Prefs = buildMG2ImportantPreferences(player);
  const mg3Prefs = buildMG3Preferences(player);

  // Build no-want data
  const noWantData = getNoWantData(player);

  for (const city of CITIES) {
    // Normalize city tags: t_i = T_i / 2 (0..2 -> 0..1)
    const normalizedCityTags = {};
    for (const tag of TAGS) {
      normalizedCityTags[tag] = (city.tags[tag] || 0) / 2;
    }

    // Partial scores per mini-game
    const s1 = computeSimilarity(mg1Prefs, normalizedCityTags);
    const s2 = computeSimilarity(mg2Prefs, normalizedCityTags);
    const s3 = computeSimilarity(mg3Prefs, normalizedCityTags);

    // Weighted combination
    let finalScore = SCORING_WEIGHTS.mg1 * s1 + SCORING_WEIGHTS.mg2 * s2 + SCORING_WEIGHTS.mg3 * s3;

    // Apply no-want penalties
    finalScore = applyNoWantPenalties(finalScore, city, normalizedCityTags, noWantData);

    scores[city.id] = finalScore;
  }

  return scores;
}

function buildMG1Preferences(player) {
  const prefs = {};
  for (const tag of TAGS) {
    prefs[tag] = 0;
  }

  for (const question of MG1_QUESTIONS) {
    const key = `mg1_${question.id}`;
    const selectedIds = player.answers[key] || [];
    for (const optId of selectedIds) {
      const option = question.options.find(o => o.id === optId);
      if (option && option.tags) {
        for (const [tag, weight] of Object.entries(option.tags)) {
          prefs[tag] = (prefs[tag] || 0) + weight;
        }
      }
    }
  }

  // Normalize so max = 1.0
  return normalizePrefs(prefs);
}

function buildMG2ImportantPreferences(player) {
  const prefs = {};
  for (const tag of TAGS) {
    prefs[tag] = 0;
  }

  const selectedIds = player.answers.mg2_important || [];
  for (const optId of selectedIds) {
    const option = MG2_IMPORTANT_OPTIONS.find(o => o.id === optId);
    if (option && option.tags) {
      for (const [tag, weight] of Object.entries(option.tags)) {
        prefs[tag] = (prefs[tag] || 0) + weight;
      }
    }
  }

  return normalizePrefs(prefs);
}

function buildMG3Preferences(player) {
  const prefs = {};
  const sliderValues = player.answers.mg3 || {};

  for (const tag of TAGS) {
    // p_i = (slider_value - 1) / 4  (1..5 -> 0..1)
    const val = sliderValues[tag] !== undefined ? sliderValues[tag] : 3;
    prefs[tag] = (val - 1) / 4;
  }

  return prefs;
}

function normalizePrefs(prefs) {
  let maxVal = 0;
  for (const tag of TAGS) {
    if ((prefs[tag] || 0) > maxVal) {
      maxVal = prefs[tag];
    }
  }
  if (maxVal > 0) {
    for (const tag of TAGS) {
      prefs[tag] = (prefs[tag] || 0) / maxVal;
    }
  }
  return prefs;
}

function computeSimilarity(prefs, cityTags) {
  let numerator = 0;
  let denominator = 0;

  for (const tag of TAGS) {
    const p = prefs[tag] || 0;
    const t = cityTags[tag] || 0;
    numerator += p * t;
    denominator += p;
  }

  return numerator / (denominator + EPSILON);
}

function getNoWantData(player) {
  const selectedIds = player.answers.mg2_nowant || [];
  const selections = [];

  for (const optId of selectedIds) {
    const option = MG2_NOWANT_OPTIONS.find(o => o.id === optId);
    if (option) {
      selections.push(option);
    }
  }

  return selections;
}

function applyNoWantPenalties(score, city, normalizedCityTags, noWantSelections) {
  let totalPenalty = 0;

  for (const option of noWantSelections) {
    // Tag-based penalties
    if (option.penalty) {
      for (const [tag, penaltyAmount] of Object.entries(option.penalty)) {
        const cityTagValue = normalizedCityTags[tag] || 0;

        if (penaltyAmount < 0) {
          // Negative penalty (e.g., no_aburrido): penalize cities WITH this tag
          // Higher tag value = more penalty
          totalPenalty += Math.abs(penaltyAmount) * cityTagValue;
        } else {
          // Positive penalty: penalize cities WITHOUT this tag (low tag value = more penalty)
          totalPenalty += penaltyAmount * (1 - cityTagValue);
        }
      }
    }

    // Direct city penalty
    if (option.affectedCities && option.affectedCities.includes(city.id)) {
      totalPenalty += option.cityPenalty || 0.05;
    }

    // Boost tag (inverted penalty - boosts instead of penalizes)
    if (option.boostTag) {
      const boostAmount = option.boostAmount || 0.05;
      const cityTagValue = normalizedCityTags[option.boostTag] || 0;
      // Boost cities high in this tag (reduce penalty)
      totalPenalty -= boostAmount * cityTagValue;
    }
  }

  // Cap total penalty at 0.15 (15%)
  totalPenalty = Math.max(0, Math.min(totalPenalty, 0.15));

  return score * (1 - totalPenalty);
}

function getTopCities(scores, count) {
  return Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([cityId, score]) => {
      const city = CITIES.find(c => c.id === cityId);
      return {
        cityId,
        name: city ? city.name : cityId,
        country: city ? city.country : '',
        score: Math.round(score * 1000) / 1000,
        topTags: getTopTagsForCity(city, score)
      };
    });
}

function getTopTagsForCity(city, _score) {
  if (!city) return [];
  return Object.entries(city.tags)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .filter(([, val]) => val > 0)
    .map(([tag]) => ({ tag, label: TAG_LABELS[tag] || tag }));
}

function buildTagProfile(player) {
  const profile = {};

  // Combine all preference signals
  const mg1 = buildMG1Preferences(player);
  const mg2 = buildMG2ImportantPreferences(player);
  const mg3 = buildMG3Preferences(player);

  for (const tag of TAGS) {
    const combined = (SCORING_WEIGHTS.mg1 * (mg1[tag] || 0))
                   + (SCORING_WEIGHTS.mg2 * (mg2[tag] || 0))
                   + (SCORING_WEIGHTS.mg3 * (mg3[tag] || 0));
    profile[tag] = {
      tag,
      label: TAG_LABELS[tag] || tag,
      score: Math.round(combined * 1000) / 1000
    };
  }

  return profile;
}

function buildPenaltyExplanation(player) {
  const selectedIds = player.answers.mg2_nowant || [];
  const explanations = [];

  for (const optId of selectedIds) {
    const option = MG2_NOWANT_OPTIONS.find(o => o.id === optId);
    if (option) {
      explanations.push({
        id: option.id,
        label: option.label,
        affectedCities: option.affectedCities || [],
        penaltyTags: Object.keys(option.penalty || {}),
        boostTag: option.boostTag || null
      });
    }
  }

  return explanations;
}

// ============================================================
// Disconnection Handling
// ============================================================

function handleDisconnection(ws) {
  const { room, player } = findRoomByWs(ws);
  if (!room || !player) return;

  player.connected = false;
  player.ws = null;

  // If still in lobby, just remove the player
  if (room.phase === PHASES.LOBBY) {
    room.players = room.players.filter(p => p.id !== player.id);
    if (room.players.length === 0) {
      cleanupRoom(room.code);
    }
    return;
  }

  // If in results phase, just mark disconnected - no need for reconnect timer
  if (room.phase === PHASES.RESULTS) {
    return;
  }

  const partner = getPartner(room, player.id);
  if (partner && !partner.isBot) {
    sendToPlayer(room, partner.id, MSG.PLAYER_DISCONNECTED, { waitSeconds: TIMERS.RECONNECT });
  }

  // Start reconnect countdown
  let remaining = TIMERS.RECONNECT;

  const interval = setInterval(() => {
    remaining--;
    if (partner && !partner.isBot) {
      sendToPlayer(room, partner.id, MSG.WAITING_RECONNECT, { remaining });
    }
    if (remaining <= 0) {
      clearInterval(interval);
      room.reconnectTimers.delete(player.id);
      handleReconnectTimeout(room, player);
    }
  }, 1000);

  room.reconnectTimers.set(player.id, {
    interval,
    timeout: null,
    remaining
  });
}

function handleReconnectTimeout(room, disconnectedPlayer) {
  // The disconnected player didn't come back in time
  // Convert them to a bot and continue
  disconnectedPlayer.isBot = true;
  disconnectedPlayer.connected = true;

  const partner = getPartner(room, disconnectedPlayer.id);

  // Fill any remaining answers with bot logic for current phase
  fillBotAnswersForCurrentPhase(room, disconnectedPlayer);

  if (partner && !partner.isBot) {
    sendToPlayer(room, partner.id, MSG.PLAYER_RECONNECTED); // repurpose: partner continues
  }
}

function fillBotAnswersForCurrentPhase(room, player) {
  // Depending on current phase, schedule bot answers for remaining questions
  switch (room.phase) {
    case PHASES.MG1: {
      const question = MG1_QUESTIONS[room.currentQuestionIndex];
      if (question) {
        const key = `mg1_${question.id}`;
        if (player.answers[key] === undefined) {
          scheduleBotAnswerMG1(room, question);
        }
      }
      break;
    }
    case PHASES.MG2_IMPORTANT:
      if (player.answers.mg2_important === undefined) {
        scheduleBotAnswerMG2Important(room);
      }
      break;
    case PHASES.MG2_NOWANT:
      if (player.answers.mg2_nowant === undefined) {
        scheduleBotAnswerMG2NoWant(room);
      }
      break;
    case PHASES.MG3:
      if (player.answers.mg3 === undefined) {
        scheduleBotAnswerMG3(room);
      }
      break;
  }
}

function handleReconnection(room, player, ws) {
  player.ws = ws;
  player.connected = true;
  player.isBot = false;

  // Clear reconnect timer
  const timerData = room.reconnectTimers.get(player.id);
  if (timerData) {
    clearInterval(timerData.interval);
    room.reconnectTimers.delete(player.id);
  }

  // Notify partner
  const partner = getPartner(room, player.id);
  if (partner && !partner.isBot) {
    sendToPlayer(room, partner.id, MSG.PLAYER_RECONNECTED);
  }

  // Send current game state to reconnected player
  sendGameStateToPlayer(room, player);
}

function sendGameStateToPlayer(room, player) {
  // Bring the player up to date with the current game state
  send(player.ws, MSG.PHASE_CHANGE, { phase: room.phase });

  switch (room.phase) {
    case PHASES.MG1: {
      const question = MG1_QUESTIONS[room.currentQuestionIndex];
      if (question) {
        send(player.ws, MSG.QUESTION, {
          phase: PHASES.MG1,
          questionId: question.id,
          questionData: question,
          timerSeconds: room.timerRemaining
        });
        send(player.ws, MSG.TIMER_TICK, { remaining: room.timerRemaining });
      }
      break;
    }
    case PHASES.MG2_IMPORTANT:
      send(player.ws, MSG.QUESTION, {
        phase: PHASES.MG2_IMPORTANT,
        questionId: 'mg2_important',
        questionData: { options: MG2_IMPORTANT_OPTIONS, maxSelect: 3 },
        timerSeconds: room.timerRemaining
      });
      send(player.ws, MSG.TIMER_TICK, { remaining: room.timerRemaining });
      break;
    case PHASES.MG2_NOWANT:
      send(player.ws, MSG.QUESTION, {
        phase: PHASES.MG2_NOWANT,
        questionId: 'mg2_nowant',
        questionData: { options: MG2_NOWANT_OPTIONS, maxSelect: 3 },
        timerSeconds: room.timerRemaining
      });
      send(player.ws, MSG.TIMER_TICK, { remaining: room.timerRemaining });
      break;
    case PHASES.MG3: {
      const sliders = TAGS.map(tag => ({
        id: tag, label: TAG_LABELS[tag], min: 1, max: 5, defaultValue: 3
      }));
      send(player.ws, MSG.QUESTION, {
        phase: PHASES.MG3,
        questionId: 'mg3',
        questionData: { sliders },
        timerSeconds: room.timerRemaining
      });
      send(player.ws, MSG.TIMER_TICK, { remaining: room.timerRemaining });
      break;
    }
    case PHASES.RESULTS: {
      const results = computeResults(room);
      send(player.ws, MSG.RESULTS, { results });
      break;
    }
  }
}

// ============================================================
// Rematch Handling
// ============================================================

function handleRematch(room, player) {
  room.rematchRequests.add(player.id);

  broadcast(room, MSG.REMATCH_READY, {
    playerId: player.id,
    count: room.rematchRequests.size,
    needed: 2
  });

  // If bot mode, auto-rematch for bot
  if (room.botMode) {
    const bot = room.players.find(p => p.isBot);
    if (bot) {
      room.rematchRequests.add(bot.id);
    }
  }

  if (room.rematchRequests.size >= 2) {
    resetRoomForRematch(room);
  }
}

function resetRoomForRematch(room) {
  clearRoomTimer(room);
  room.phase = PHASES.LOBBY;
  room.currentQuestion = null;
  room.currentQuestionIndex = 0;
  room.timerRemaining = 0;
  room.extendUsed = new Map();
  room.rematchRequests = new Set();
  room.introReady = new Set();
  room.aborted = false;

  for (const player of room.players) {
    player.ready = false;
    player.answers = {};
  }

  // Notify players they're back in lobby
  broadcast(room, MSG.PHASE_CHANGE, { phase: PHASES.LOBBY });

  // In bot mode, auto-ready the bot after a short delay
  if (room.botMode) {
    const bot = room.players.find(p => p.isBot);
    if (bot) {
      setTimeout(() => {
        bot.ready = true;
        // Check if human is already ready
        if (checkBothReady(room)) {
          startGameSequence(room);
        }
      }, TIMERS.BOT_READY_DELAY);
    }
  }
}

// ============================================================
// WebSocket Message Handler
// ============================================================

function handleMessage(ws, rawData) {
  let data;
  try {
    data = JSON.parse(rawData);
  } catch {
    sendError(ws, 'Invalid JSON');
    return;
  }

  const { type } = data;

  switch (type) {
    case MSG.CREATE_ROOM: {
      const room = createRoom(false);
      const player = addPlayer(room, ws, data.name);
      send(ws, MSG.ROOM_CREATED, {
        code: room.code,
        playerId: player.id,
        soloMode: false
      });
      break;
    }

    case MSG.CREATE_SOLO: {
      const room = createRoom(true);
      const player = addPlayer(room, ws, data.name);
      const bot = addBotPlayer(room);

      send(ws, MSG.ROOM_CREATED, {
        code: room.code,
        playerId: player.id,
        soloMode: true
      });

      // Notify player count with names
      send(ws, MSG.PLAYER_JOINED, {
        playerCount: 2,
        player1Name: player.name,
        player2Name: bot.name
      });

      // Show intro screen (bot auto-readies intro)
      room.phase = PHASES.INTRO;
      room.introReady.clear();
      room.introReady.add(bot.id);
      send(ws, MSG.SHOW_INTRO);

      // Bot auto-readies game after delay (used after intro completes)
      break;
    }

    case MSG.JOIN_ROOM: {
      const code = (data.code || '').toUpperCase();
      const room = findRoomByCode(code);

      if (!room) {
        sendError(ws, 'Sala no encontrada');
        return;
      }

      // Check if this is a reconnection
      const existingPlayer = room.players.find(p =>
        !p.isBot && !p.connected && data.playerId && p.id === data.playerId
      );

      if (existingPlayer) {
        // Reconnection
        handleReconnection(room, existingPlayer, ws);
        return;
      }

      // New player joining
      if (room.players.filter(p => !p.isBot).length >= 2) {
        sendError(ws, 'La sala esta llena');
        return;
      }

      if (room.phase !== PHASES.LOBBY) {
        sendError(ws, 'La partida ya ha empezado');
        return;
      }

      const player = addPlayer(room, ws, data.name);
      send(ws, MSG.ROOM_CREATED, {
        code: room.code,
        playerId: player.id,
        soloMode: false
      });

      // Notify all players of the new count (include names when both are present)
      const joinData = { playerCount: room.players.length };
      if (room.players.length === 2) {
        joinData.player1Name = room.players[0].name;
        joinData.player2Name = room.players[1].name;
      }
      broadcast(room, MSG.PLAYER_JOINED, joinData);

      // When both players have joined, show intro screen
      if (room.players.length === 2) {
        room.phase = PHASES.INTRO;
        room.introReady.clear();
        broadcast(room, MSG.SHOW_INTRO);
      }
      break;
    }

    case MSG.PLAYER_READY: {
      const { room, player } = findRoomByWs(ws);
      if (!room || !player) {
        sendError(ws, 'No estas en una sala');
        return;
      }

      if (room.phase !== PHASES.LOBBY) {
        sendError(ws, 'La partida ya ha empezado');
        return;
      }

      player.ready = true;

      if (checkBothReady(room)) {
        startGameSequence(room);
      }
      break;
    }

    case MSG.SUBMIT_ANSWER: {
      const { room, player } = findRoomByWs(ws);
      if (!room || !player) {
        sendError(ws, 'No estas en una sala');
        return;
      }
      handleSubmitAnswer(room, player, data);
      break;
    }

    case MSG.REQUEST_EXTEND: {
      const { room, player } = findRoomByWs(ws);
      if (!room || !player) {
        sendError(ws, 'No estas en una sala');
        return;
      }
      handleRequestExtend(room, player, data);
      break;
    }

    case MSG.REMATCH: {
      const { room, player } = findRoomByWs(ws);
      if (!room || !player) {
        sendError(ws, 'No estas en una sala');
        return;
      }
      if (room.phase !== PHASES.RESULTS) {
        sendError(ws, 'Solo se puede pedir revancha en la pantalla de resultados');
        return;
      }
      handleRematch(room, player);
      break;
    }

    case 'instructions_done': {
      const { room: instrRoom, player: instrPlayer } = findRoomByWs(ws);
      if (instrRoom && instrPlayer) {
        handleInstructionsDone(instrRoom, instrPlayer);
      }
      break;
    }

    case 'intro_done': {
      const { room: introRoom, player: introPlayer } = findRoomByWs(ws);
      if (introRoom && introPlayer) {
        handleIntroDone(introRoom, introPlayer);
      }
      break;
    }

    default:
      sendError(ws, `Tipo de mensaje desconocido: ${type}`);
  }
}

// ============================================================
// HTTP Server (Static File Serving)
// ============================================================

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.webm': 'video/webm',
  '.mp4': 'video/mp4'
};

const PUBLIC_DIR = path.join(__dirname, 'public');

function serveStaticFile(req, res) {
  // Only handle GET requests
  if (req.method !== 'GET') {
    res.writeHead(405, { 'Content-Type': 'text/plain' });
    res.end('Method Not Allowed');
    return;
  }

  // Parse URL and sanitize
  let urlPath = req.url.split('?')[0]; // Strip query string
  urlPath = decodeURIComponent(urlPath);

  // Default to index.html
  if (urlPath === '/') {
    urlPath = '/index.html';
  }

  // Prevent directory traversal
  const filePath = path.normalize(path.join(PUBLIC_DIR, urlPath));
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // Try serving index.html for SPA-style routing
        const indexPath = path.join(PUBLIC_DIR, 'index.html');
        fs.readFile(indexPath, (indexErr, indexData) => {
          if (indexErr) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not Found');
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(indexData);
          }
        });
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
      }
      return;
    }

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

// ============================================================
// Server Startup
// ============================================================

const PORT = parseInt(process.env.PORT, 10) || 3000;

const httpServer = http.createServer(serveStaticFile);

const wss = new WebSocketServer({ server: httpServer });

wss.on('connection', (ws) => {
  ws.on('message', (rawData) => {
    handleMessage(ws, rawData.toString());
  });

  ws.on('close', () => {
    handleDisconnection(ws);
  });

  ws.on('error', (err) => {
    console.error(`[WS] Connection error: ${err.message}`);
    handleDisconnection(ws);
  });
});

function getLocalIPs() {
  const interfaces = os.networkInterfaces();
  const ips = [];

  for (const [, addrs] of Object.entries(interfaces)) {
    for (const addr of addrs) {
      if (addr.family === 'IPv4' && !addr.internal) {
        ips.push(addr.address);
      }
    }
  }

  return ips;
}

httpServer.listen(PORT, () => {
  const localIPs = getLocalIPs();

  console.log('');
  console.log('  A Donde Vamos server running!');
  console.log('');
  console.log(`  Local:    http://localhost:${PORT}`);

  for (const ip of localIPs) {
    console.log(`  Network:  http://${ip}:${PORT}`);
  }

  console.log('');
  console.log('  Share the network URL with the other player!');
  console.log('');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n  Shutting down...');
  wss.clients.forEach((ws) => {
    ws.close(1001, 'Server shutting down');
  });
  httpServer.close(() => {
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  wss.clients.forEach((ws) => {
    ws.close(1001, 'Server shutting down');
  });
  httpServer.close(() => {
    process.exit(0);
  });
});
