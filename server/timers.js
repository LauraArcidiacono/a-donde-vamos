// Timer durations (seconds)
export const TIMERS = {
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

export function clearRoomTimer(room) {
  if (room.timer) {
    clearInterval(room.timer);
    room.timer = null;
  }
  room.timerRemaining = 0;
}

export function startTimer(room, seconds, onTick, onExpire) {
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
