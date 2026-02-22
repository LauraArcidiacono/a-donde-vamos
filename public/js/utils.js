// ============================================================
// Utility Functions
// ============================================================

import { playClick } from '../audio.js';

export function haptic(type = 'light') {
  if (navigator.vibrate) {
    navigator.vibrate(type === 'light' ? 10 : 50);
  }
  playClick();
}

export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
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

let srAnnouncer = null;

export function announceToScreenReader(message, priority = 'polite') {
  if (!srAnnouncer) {
    srAnnouncer = document.createElement('div');
    srAnnouncer.className = 'sr-only';
    srAnnouncer.setAttribute('aria-live', 'assertive');
    srAnnouncer.setAttribute('aria-atomic', 'true');
    document.body.appendChild(srAnnouncer);
  }
  srAnnouncer.setAttribute('aria-live', priority);
  srAnnouncer.textContent = '';
  requestAnimationFrame(() => {
    srAnnouncer.textContent = message;
  });
}

export function showToast(message, duration = 2500) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add('toast-visible');
  });

  setTimeout(() => {
    toast.classList.remove('toast-visible');
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    setTimeout(() => {
      if (toast.parentNode) toast.remove();
    }, 500);
  }, duration);
}
