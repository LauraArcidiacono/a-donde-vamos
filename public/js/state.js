// ============================================================
// Application State & DOM Helpers
// ============================================================

import { PHASES } from '../data.js';

export const state = {
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

export const $ = (id) => document.getElementById(id);
export const $$ = (sel) => document.querySelectorAll(sel);
