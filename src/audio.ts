/**
 * Time-up sound. Browsers (especially iOS Safari) only allow audio that was
 * "unlocked" by a user gesture, so primeAudio() is called from the Ready button.
 * Every failure is swallowed: sound is never essential (the UI also flashes
 * and vibrates where supported).
 */
let audio: HTMLAudioElement | null = null;

function getAudio(): HTMLAudioElement | null {
  if (typeof Audio === 'undefined') return null;
  if (!audio) {
    audio = new Audio('/sounds/time-up.wav');
    audio.preload = 'auto';
  }
  return audio;
}

/** Call inside a click/tap handler. */
export function primeAudio(): void {
  const a = getAudio();
  if (!a) return;
  try {
    a.muted = true;
    const p = a.play();
    const done = () => {
      a.pause();
      a.currentTime = 0;
      a.muted = false;
    };
    if (p && typeof p.then === 'function') p.then(done).catch(() => (a.muted = false));
    else done();
  } catch {
    /* ignore */
  }
}

export function playTimeUp(enabled: boolean): void {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate?.([200, 100, 200]);
  } catch {
    /* ignore */
  }
  if (!enabled) return;
  const a = getAudio();
  if (!a) return;
  try {
    a.muted = false;
    a.currentTime = 0;
    void a.play().catch(() => {
      /* autoplay restriction: ignore gracefully */
    });
  } catch {
    /* ignore */
  }
}
