import { PHASES, MSG } from '../public/data.js';
import {
  createRoom,
  addPlayer,
  addBotPlayer,
  findRoomByWs,
  findRoomByCode,
  send,
  sendError,
  broadcast,
  touchRoom,
} from './rooms.js';
import {
  handleSubmitAnswer,
  handleRequestExtend,
  handleRematch,
  handleIntroDone,
  handleInstructionsDone,
  startGameSequence,
  checkBothReady,
  handleReconnection,
} from './gameFlow.js';

export function handleMessage(ws, rawData) {
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

      break;
    }

    case MSG.JOIN_ROOM: {
      const code = (data.code || '').toUpperCase();
      const room = findRoomByCode(code);

      if (!room) {
        sendError(ws, 'Sala no encontrada');
        return;
      }

      touchRoom(room);

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
      touchRoom(room);

      if (room.phase !== PHASES.LOBBY && room.phase !== PHASES.READY) {
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
      touchRoom(room);
      handleSubmitAnswer(room, player, data);
      break;
    }

    case MSG.REQUEST_EXTEND: {
      const { room, player } = findRoomByWs(ws);
      if (!room || !player) {
        sendError(ws, 'No estas en una sala');
        return;
      }
      touchRoom(room);
      handleRequestExtend(room, player, data);
      break;
    }

    case MSG.REMATCH: {
      const { room, player } = findRoomByWs(ws);
      if (!room || !player) {
        sendError(ws, 'No estas en una sala');
        return;
      }
      touchRoom(room);
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
        touchRoom(instrRoom);
        handleInstructionsDone(instrRoom, instrPlayer);
      }
      break;
    }

    case 'intro_done': {
      const { room: introRoom, player: introPlayer } = findRoomByWs(ws);
      if (introRoom && introPlayer) {
        touchRoom(introRoom);
        handleIntroDone(introRoom, introPlayer);
      }
      break;
    }

    default:
      sendError(ws, `Tipo de mensaje desconocido: ${type}`);
  }
}
