// ============================================================
// Timer Updates
// ============================================================

import { state, $ } from './state.js';
import { PHASES } from '../data.js';
import { haptic } from './utils.js';
import { startTimerWarning, stopTimerWarning } from '../audio.js';

// Cached DOM references — refreshed when prefix (phase) changes
let cachedPrefix = null;
let cachedTimerEl = null;
let cachedTimerBarEl = null;
let cachedFillEl = null;

function cacheTimerRefs(prefix) {
  if (prefix === cachedPrefix) return;
  cachedPrefix = prefix;
  cachedTimerEl = $(`${prefix}-timer`);
  cachedTimerBarEl = $(`${prefix}-timer-bar`);
  cachedFillEl = cachedTimerBarEl ? cachedTimerBarEl.querySelector('.timer-bar-fill') : null;
}

export function handleTimerTick(data) {
  const remaining = data.remaining;
  const total = data.total || state.timerTotal || remaining;
  state.timerTotal = total;

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

export function updateTimerBar(prefix, remaining, total) {
  cacheTimerRefs(prefix);

  if (cachedTimerEl) {
    cachedTimerEl.textContent = remaining;
  }

  if (cachedFillEl) {
    const percentage = total > 0 ? (remaining / total) * 100 : 0;

    requestAnimationFrame(() => {
      cachedFillEl.style.width = `${percentage}%`;

      cachedFillEl.classList.remove('timer-warning', 'timer-danger');
      if (remaining <= 5) {
        cachedFillEl.classList.add('timer-danger');
        if (remaining === 5) {
          cachedTimerBarEl.classList.add('shake');
          haptic('heavy');
          startTimerWarning();
          setTimeout(() => cachedTimerBarEl.classList.remove('shake'), 500);
        }
      } else if (remaining <= 10) {
        cachedFillEl.classList.add('timer-warning');
      }

      if (remaining > 5 || remaining <= 0) {
        stopTimerWarning();
      }
    });
  }
}

export function handleTimerExtended(data) {
  if (data.total) {
    state.timerTotal = data.total;
  }
  if (data.remaining) {
    handleTimerTick({ remaining: data.remaining, total: data.total || state.timerTotal });
  }
}

export function clearTimers() {
  if (state.instructionTimer) {
    clearInterval(state.instructionTimer);
    state.instructionTimer = null;
  }
  if (state.countdownTimer) {
    clearInterval(state.countdownTimer);
    state.countdownTimer = null;
  }
}
