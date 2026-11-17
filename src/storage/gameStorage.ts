import type { GameState } from '../types/game';

const GAME_KEY = 'ayl-kerp:game:v1';
const SOUND_KEY = 'ayl-kerp:sound:v1';

/** Minimal structural validation so corrupted storage never crashes the app. */
export function isValidGameState(v: unknown): v is GameState {
  if (!v || typeof v !== 'object') return false;
  const g = v as Partial<GameState>;
  const statuses = ['preparing', 'playing', 'summary', 'finished'];
  return (
    typeof g.id === 'string' &&
    typeof g.status === 'string' &&
    statuses.includes(g.status) &&
    Array.isArray(g.teams) &&
    g.teams.length === 2 &&
    g.teams.every(
      (t) =>
        t &&
        typeof t.name === 'string' &&
        typeof t.score === 'number' &&
        typeof t.correctAnswers === 'number',
    ) &&
    !!g.settings &&
    typeof g.settings.turnDuration === 'number' &&
    typeof g.settings.totalRounds === 'number' &&
    typeof g.currentRound === 'number' &&
    (g.currentTeamIndex === 0 || g.currentTeamIndex === 1) &&
    Array.isArray(g.usedTermIds) &&
    typeof g.remainingTime === 'number' &&
    typeof g.isPaused === 'boolean' &&
    !!g.turnStats
  );
}

function safeStorage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null; // e.g. blocked by privacy settings
  }
}

export function saveGame(state: GameState): void {
  try {
    safeStorage()?.setItem(GAME_KEY, JSON.stringify(state));
  } catch {
    /* quota / private mode: ignore, game still works in memory */
  }
}

export function loadGame(): GameState | null {
  try {
    const raw = safeStorage()?.getItem(GAME_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isValidGameState(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function clearGame(): void {
  try {
    safeStorage()?.removeItem(GAME_KEY);
  } catch {
    /* ignore */
  }
}

/** True if there is a saved game that is not finished. */
export function hasResumableGame(): boolean {
  const g = loadGame();
  return !!g && g.status !== 'finished';
}

export function loadSoundPref(): boolean {
  try {
    return safeStorage()?.getItem(SOUND_KEY) !== '0';
  } catch {
    return true;
  }
}

export function saveSoundPref(enabled: boolean): void {
  try {
    safeStorage()?.setItem(SOUND_KEY, enabled ? '1' : '0');
  } catch {
    /* ignore */
  }
}
