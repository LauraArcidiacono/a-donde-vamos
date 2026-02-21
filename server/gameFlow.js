import {
  PHASES,
  MSG,
  TAGS,
  TAG_LABELS,
  MG1_QUESTIONS,
  MG2_IMPORTANT_OPTIONS,
  MG2_NOWANT_OPTIONS,
} from '../public/data.js';
import { TIMERS, clearRoomTimer, startTimer } from './timers.js';
import {
  broadcast,
  send,
  sendToPlayer,
  getPartner,
  findRoomByWs,
  cleanupRoom,
} from './rooms.js';
import { computeResults } from './scoring.js';
import {
  scheduleBotAnswerMG1,
  scheduleBotAnswerMG2Important,
  scheduleBotAnswerMG2NoWant,
  scheduleBotAnswerMG3,
  fillBotAnswersForCurrentPhase,
} from './bot.js';

// ============================================================
// Intro & Ready
// ============================================================

export function handleIntroDone(room, player) {
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

export function checkBothReady(room) {
  if (room.players.length < 2) return false;
  return room.players.every(p => p.ready);
}

export function startGameSequence(room) {
  room.phase = PHASES.READY;
  broadcast(room, MSG.BOTH_READY);

  // 3-second countdown then start game
  setTimeout(() => {
    if (room.aborted) return;
    broadcast(room, MSG.GAME_START);
    startMiniGame(room, PHASES.MG1);
  }, TIMERS.COUNTDOWN_AFTER_READY * 1000);
}

// ============================================================
// Instructions
// ============================================================

function startMiniGame(room, phase) {
  if (room.aborted) return;

  room.phase = PHASES.INSTRUCTIONS;
  room.instructionsReady.clear();
  room.pendingPhase = phase;
  broadcast(room, MSG.SHOW_INSTRUCTIONS, { phase });
  // No auto-advance: players must click "Siguiente" to proceed
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

export function handleInstructionsDone(room, player) {
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

// ============================================================
// MG1: Emotional Test (one question at a time)
// ============================================================

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
    scheduleBotAnswerMG1(room, question, handleSubmitAnswer);
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

// ============================================================
// MG2 Important
// ============================================================

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
    scheduleBotAnswerMG2Important(room, handleSubmitAnswer);
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
    scheduleBotAnswerMG2NoWant(room, handleSubmitAnswer);
  }

  startTimer(room, TIMERS.MG2_NOWANT,
    (remaining) => broadcast(room, MSG.TIMER_TICK, { remaining }),
    () => onMG2NoWantTimerExpire(room)
  );
}

// ============================================================
// MG2 No Want
// ============================================================

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

// ============================================================
// MG3: Sliders
// ============================================================

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
    scheduleBotAnswerMG3(room, handleSubmitAnswer);
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

export function handleSubmitAnswer(room, player, data) {
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

export function handleRequestExtend(room, player, data) {
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
// Disconnection Handling
// ============================================================

export function handleDisconnection(ws) {
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
  fillBotAnswersForCurrentPhase(room, disconnectedPlayer, handleSubmitAnswer);

  if (partner && !partner.isBot) {
    sendToPlayer(room, partner.id, MSG.PLAYER_RECONNECTED); // repurpose: partner continues
  }
}

export function handleReconnection(room, player, ws) {
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

export function handleRematch(room, player) {
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
