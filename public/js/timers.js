// ============================================================
// Timer Updates
// ============================================================

import { state, $ } from './state.js';
import { PHASES } from '../data.js';
import { haptic } from './utils.js';
import { startTimerWarning, stopTimerWarning } from '../audio.js';

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

        fill.classList.remove('timer-warning', 'timer-danger');
        if (remaining <= 5) {
          fill.classList.add('timer-danger');
          if (remaining === 5) {
            timerBarEl.classList.add('shake');
            haptic('heavy');
            startTimerWarning();
            setTimeout(() => timerBarEl.classList.remove('shake'), 500);
          }
        } else if (remaining <= 10) {
          fill.classList.add('timer-warning');
        }

        if (remaining > 5 || remaining <= 0) {
          stopTimerWarning();
        }
      });
    }
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
