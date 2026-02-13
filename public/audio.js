// ============================================================
// A Donde Vamos - Audio Engine
// Procedural audio using Web Audio API
// Background music + sound effects, with mute toggle
// ============================================================

const STORAGE_KEY = 'adv-audio-muted';

// ============================================================
// Audio Context & State
// ============================================================

let audioCtx = null;
let masterGain = null;
let musicGain = null;
let sfxGain = null;
let isMuted = localStorage.getItem(STORAGE_KEY) === 'true';
let musicPlaying = false;
let musicNodes = [];
let timerWarningActive = false;
let timerWarningNodes = [];
let userHasInteracted = false;
let pendingMusicStart = false;

// ============================================================
// Initialization
// ============================================================

function ensureContext() {
  if (audioCtx) return audioCtx;

  audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  // Master gain (mute control)
  masterGain = audioCtx.createGain();
  masterGain.gain.value = isMuted ? 0 : 1;
  masterGain.connect(audioCtx.destination);

  // Music sub-bus
  musicGain = audioCtx.createGain();
  musicGain.gain.value = 0.25;
  musicGain.connect(masterGain);

  // SFX sub-bus
  sfxGain = audioCtx.createGain();
  sfxGain.gain.value = 0.5;
  sfxGain.connect(masterGain);

  return audioCtx;
}

function resumeContext() {
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

// ============================================================
// Mute / Unmute
// ============================================================

function setMuted(muted) {
  isMuted = muted;
  localStorage.setItem(STORAGE_KEY, String(isMuted));

  if (masterGain) {
    masterGain.gain.setTargetAtTime(isMuted ? 0 : 1, audioCtx.currentTime, 0.05);
  }

  updateMuteButton();
}

function toggleMute() {
  setMuted(!isMuted);
}

function updateMuteButton() {
  const btn = document.getElementById('btn-audio-toggle');
  if (!btn) return;

  const iconEl = btn.querySelector('.audio-icon');
  if (iconEl) {
    iconEl.textContent = isMuted ? '\uD83D\uDD07' : '\uD83D\uDD0A';
  }

  btn.classList.toggle('muted', isMuted);
  btn.setAttribute('aria-label', isMuted ? 'Activar sonido' : 'Silenciar');
}

// ============================================================
// Background Music - Upbeat procedural loop
// Uses layered oscillators to create a pleasant, energetic feel
// ============================================================

function startMusic() {
  if (musicPlaying) return;

  ensureContext();
  resumeContext();

  musicPlaying = true;

  // BPM and timing
  const bpm = 128;
  const beatDur = 60 / bpm;
  const barDur = beatDur * 4;
  const loopBars = 4;
  const loopDur = barDur * loopBars;

  // Musical key: A minor pentatonic base with some major flavour
  // Notes in Hz for an upbeat, enthusiastic feel
  const bassLine = [220, 220, 261.63, 293.66, 220, 220, 329.63, 293.66]; // A3, A3, C4, D4, A3, A3, E4, D4
  const melodyNotes = [
    523.25, 587.33, 659.25, 587.33, // C5, D5, E5, D5
    523.25, 493.88, 440, 493.88,     // C5, B4, A4, B4
    523.25, 587.33, 659.25, 783.99,  // C5, D5, E5, G5
    659.25, 587.33, 523.25, 440,     // E5, D5, C5, A4
  ];
  const chordFreqs = [
    [220, 261.63, 329.63],  // Am
    [261.63, 329.63, 392],   // C
    [293.66, 349.23, 440],   // Dm
    [329.63, 392, 493.88],   // Em
  ];

  function scheduleLoop() {
    if (!musicPlaying) return;

    const now = audioCtx.currentTime;

    // --- Bass (sine, low volume, rhythmic) ---
    bassLine.forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.value = freq / 2; // one octave lower
      gain.gain.value = 0;

      const start = now + (i * beatDur * loopBars / bassLine.length);
      const noteDur = beatDur * 0.8;

      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.35, start + 0.02);
      gain.gain.setValueAtTime(0.35, start + noteDur * 0.7);
      gain.gain.linearRampToValueAtTime(0, start + noteDur);

      osc.connect(gain);
      gain.connect(musicGain);
      osc.start(start);
      osc.stop(start + noteDur + 0.01);

      musicNodes.push(osc, gain);
    });

    // --- Melody (triangle, light and bright) ---
    melodyNotes.forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.value = 0;

      const start = now + (i * loopDur / melodyNotes.length);
      const noteDur = (loopDur / melodyNotes.length) * 0.6;

      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.15, start + 0.01);
      gain.gain.setValueAtTime(0.15, start + noteDur * 0.5);
      gain.gain.exponentialRampToValueAtTime(0.001, start + noteDur);

      osc.connect(gain);
      gain.connect(musicGain);
      osc.start(start);
      osc.stop(start + noteDur + 0.01);

      musicNodes.push(osc, gain);
    });

    // --- Chord pads (soft saw with filter) ---
    chordFreqs.forEach((chord, i) => {
      chord.forEach((freq) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        const filter = audioCtx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.value = freq;
        filter.type = 'lowpass';
        filter.frequency.value = 800;
        filter.Q.value = 1;
        gain.gain.value = 0;

        const start = now + (i * barDur);
        const noteDur = barDur * 0.9;

        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.04, start + 0.1);
        gain.gain.setValueAtTime(0.04, start + noteDur * 0.6);
        gain.gain.linearRampToValueAtTime(0, start + noteDur);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(musicGain);
        osc.start(start);
        osc.stop(start + noteDur + 0.01);

        musicNodes.push(osc, gain, filter);
      });
    });

    // --- Hi-hat pattern (noise burst, rhythmic drive) ---
    for (let i = 0; i < loopBars * 4 * 2; i++) {
      const isAccent = i % 2 === 0;
      const start = now + (i * beatDur / 2);

      // Create short noise burst using oscillator trick
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const filter = audioCtx.createBiquadFilter();

      osc.type = 'square';
      osc.frequency.value = 6000 + Math.random() * 4000;
      filter.type = 'highpass';
      filter.frequency.value = 8000;
      gain.gain.value = 0;

      const vol = isAccent ? 0.06 : 0.03;
      const dur = 0.04;

      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(vol, start + 0.002);
      gain.gain.exponentialRampToValueAtTime(0.001, start + dur);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(musicGain);
      osc.start(start);
      osc.stop(start + dur + 0.01);

      musicNodes.push(osc, gain, filter);
    }

    // Schedule next loop
    const nextTime = (loopDur * 1000) - 50; // slightly early to avoid gaps
    setTimeout(scheduleLoop, nextTime);
  }

  scheduleLoop();
}

function stopMusic() {
  musicPlaying = false;

  musicNodes.forEach((node) => {
    try {
      if (node.stop) node.stop();
      if (node.disconnect) node.disconnect();
    } catch {
      // Already stopped
    }
  });
  musicNodes = [];
}

// ============================================================
// Sound Effects
// ============================================================

/**
 * Subtle click/tick sound for button interactions
 */
function playClick() {
  ensureContext();
  resumeContext();

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = 'sine';
  osc.frequency.value = 1200;
  gain.gain.value = 0;

  const now = audioCtx.currentTime;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.3, now + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

  osc.frequency.setValueAtTime(1200, now);
  osc.frequency.exponentialRampToValueAtTime(800, now + 0.06);

  osc.connect(gain);
  gain.connect(sfxGain);
  osc.start(now);
  osc.stop(now + 0.08);
}

/**
 * Timer urgency sound - a subtle pulsing tone
 * Call startTimerWarning() when timer <= 5s, stopTimerWarning() when done
 */
function startTimerWarning() {
  if (timerWarningActive) return;
  timerWarningActive = true;

  ensureContext();
  resumeContext();

  function tick() {
    if (!timerWarningActive) return;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.value = 0;

    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(sfxGain);
    osc.start(now);
    osc.stop(now + 0.18);

    timerWarningNodes.push(
      setTimeout(tick, 600)
    );
  }

  tick();
}

function stopTimerWarning() {
  timerWarningActive = false;
  timerWarningNodes.forEach((id) => clearTimeout(id));
  timerWarningNodes = [];
}

/**
 * Celebration fanfare for results reveal
 */
function playCelebration() {
  ensureContext();
  resumeContext();

  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
  const now = audioCtx.currentTime;

  notes.forEach((freq, i) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'triangle';
    osc.frequency.value = freq;
    gain.gain.value = 0;

    const start = now + i * 0.12;
    const dur = 0.4;

    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.35, start + 0.02);
    gain.gain.setValueAtTime(0.35, start + dur * 0.4);
    gain.gain.exponentialRampToValueAtTime(0.001, start + dur);

    osc.connect(gain);
    gain.connect(sfxGain);
    osc.start(start);
    osc.stop(start + dur + 0.05);
  });

  // Add a shimmer/sparkle layer
  for (let i = 0; i < 6; i++) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.value = 1500 + Math.random() * 2000;
    gain.gain.value = 0;

    const start = now + 0.3 + i * 0.08;
    const dur = 0.15;

    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.1, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, start + dur);

    osc.connect(gain);
    gain.connect(sfxGain);
    osc.start(start);
    osc.stop(start + dur + 0.02);
  }
}

/**
 * Countdown beep (3, 2, 1)
 */
function playCountdownBeep() {
  ensureContext();
  resumeContext();

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = 'sine';
  osc.frequency.value = 660;
  gain.gain.value = 0;

  const now = audioCtx.currentTime;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.25, now + 0.01);
  gain.gain.setValueAtTime(0.25, now + 0.08);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

  osc.connect(gain);
  gain.connect(sfxGain);
  osc.start(now);
  osc.stop(now + 0.25);
}

/**
 * "Go" beep at end of countdown (higher pitch)
 */
function playCountdownGo() {
  ensureContext();
  resumeContext();

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = 'sine';
  osc.frequency.value = 1320;
  gain.gain.value = 0;

  const now = audioCtx.currentTime;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.3, now + 0.01);
  gain.gain.setValueAtTime(0.3, now + 0.15);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

  osc.connect(gain);
  gain.connect(sfxGain);
  osc.start(now);
  osc.stop(now + 0.45);
}

// ============================================================
// User Interaction Handler (autoplay policy)
// ============================================================

function handleFirstInteraction() {
  if (userHasInteracted) return;
  userHasInteracted = true;

  ensureContext();
  resumeContext();

  if (pendingMusicStart) {
    pendingMusicStart = false;
    startMusic();
  }

  // Remove listeners after first interaction
  document.removeEventListener('click', handleFirstInteraction);
  document.removeEventListener('touchstart', handleFirstInteraction);
  document.removeEventListener('keydown', handleFirstInteraction);
}

// ============================================================
// Public API
// ============================================================

/**
 * Initialize the audio engine. Call once on app start.
 * Creates the mute button and sets up interaction listeners.
 */
export function initAudio() {
  // Listen for first user interaction (browser autoplay policy)
  document.addEventListener('click', handleFirstInteraction);
  document.addEventListener('touchstart', handleFirstInteraction);
  document.addEventListener('keydown', handleFirstInteraction);

  // Create and insert mute button
  createMuteButton();
  updateMuteButton();
}

/**
 * Request music to start. If user hasn't interacted yet,
 * it will be queued and start on first interaction.
 */
export function requestMusicStart() {
  if (userHasInteracted) {
    startMusic();
  } else {
    pendingMusicStart = true;
  }
}

export function requestMusicStop() {
  pendingMusicStart = false;
  stopMusic();
}

export { playClick, playCelebration, playCountdownBeep, playCountdownGo };
export { startTimerWarning, stopTimerWarning };
export { toggleMute, isMuted };

// ============================================================
// DOM: Create Mute Button
// ============================================================

function createMuteButton() {
  // Avoid duplicate
  if (document.getElementById('btn-audio-toggle')) return;

  const btn = document.createElement('button');
  btn.id = 'btn-audio-toggle';
  btn.className = 'audio-toggle-btn';
  btn.setAttribute('aria-label', isMuted ? 'Activar sonido' : 'Silenciar');
  btn.setAttribute('type', 'button');

  btn.innerHTML = `<span class="audio-icon">${isMuted ? '\uD83D\uDD07' : '\uD83D\uDD0A'}</span>`;

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMute();
  });

  document.body.appendChild(btn);
}
