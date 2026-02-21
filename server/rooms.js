import { PHASES, MSG } from '../public/data.js';
import { clearRoomTimer } from './timers.js';

export const rooms = new Map();

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

export function createRoom(soloMode = false) {
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

export function addPlayer(room, ws, name) {
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

export function addBotPlayer(room) {
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

export function findRoomByWs(ws) {
  for (const [, room] of rooms) {
    const player = room.players.find(p => p.ws === ws);
    if (player) return { room, player };
  }
  return { room: null, player: null };
}

export function findRoomByCode(code) {
  return rooms.get(code.toUpperCase()) || null;
}

export function getPartner(room, playerId) {
  return room.players.find(p => p.id !== playerId) || null;
}

export function cleanupRoom(code) {
  const room = rooms.get(code);
  if (!room) return;
  clearRoomTimer(room);
  for (const [, timer] of room.reconnectTimers) {
    clearInterval(timer.interval);
    clearTimeout(timer.timeout);
  }
  rooms.delete(code);
}

// WebSocket helpers

export function send(ws, type, data = {}) {
  if (ws && ws.readyState === 1) { // WebSocket.OPEN
    try {
      ws.send(JSON.stringify({ type, ...data }));
    } catch (err) {
      console.error(`[WS] Send error: ${err.message}`);
    }
  }
}

export function broadcast(room, type, data = {}) {
  for (const player of room.players) {
    if (!player.isBot && player.connected) {
      send(player.ws, type, data);
    }
  }
}

export function sendToPlayer(room, playerId, type, data = {}) {
  const player = room.players.find(p => p.id === playerId);
  if (player && !player.isBot && player.connected) {
    send(player.ws, type, data);
  }
}

export function sendError(ws, message) {
  send(ws, MSG.ERROR, { message });
}
