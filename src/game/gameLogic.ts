import type { GameSettings, GameState, Team, TurnStats, Word } from '../types/game';
import { addCorrect, addSkip, completeTurn, createTeam } from './scoring';
import { nextTurn } from './turnManager';
import { pickNextWord, type Rng } from './wordManager';

/* ---------- Settings & validation ---------- */

export const LIMITS = {
  turnDuration: { min: 15, max: 180, default: 60 },
  totalRounds: { min: 1, max: 20, default: 5 },
} as const;

export const DEFAULT_SETTINGS: GameSettings = {
  turnDuration: LIMITS.turnDuration.default,
  totalRounds: LIMITS.totalRounds.default,
  soundEnabled: true,
};

export interface SetupInput {
  team1: string;
  team2: string;
  turnDuration: number;
  totalRounds: number;
}

export type SetupErrors = Partial<Record<keyof SetupInput, string>>;

const isInt = (n: number) => Number.isInteger(n);

/** Returns an object with an error message (Armenian) per invalid field. */
export function validateSetup(input: SetupInput): SetupErrors {
  const errors: SetupErrors = {};
  if (!input.team1.trim()) errors.team1 = 'Թիմի անունը չի կարող դատարկ լինել';
  if (!input.team2.trim()) errors.team2 = 'Թիմի անունը չի կարող դատարկ լինել';
  if (
    input.team1.trim() &&
    input.team1.trim().toLowerCase() === input.team2.trim().toLowerCase()
  ) {
    errors.team2 = 'Թիմերի անունները պետք է տարբեր լինեն';
  }
  const d = LIMITS.turnDuration;
  if (!isInt(input.turnDuration) || input.turnDuration < d.min || input.turnDuration > d.max) {
    errors.turnDuration = `Մուտքագրեք ${d.min}-ից ${d.max} վայրկյան`;
  }
  const r = LIMITS.totalRounds;
  if (!isInt(input.totalRounds) || input.totalRounds < r.min || input.totalRounds > r.max) {
    errors.totalRounds = `Մուտքագրեք ${r.min}-ից ${r.max} փուլ`;
  }
  return errors;
}

/* ---------- State creation ---------- */

const newId = () =>
  `g-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;

export function createGame(input: SetupInput, soundEnabled = true): GameState {
  const settings: GameSettings = {
    turnDuration: input.turnDuration,
    totalRounds: input.totalRounds,
    soundEnabled,
  };
  const teams: [Team, Team] = [
    createTeam('team-1', input.team1.trim()),
    createTeam('team-2', input.team2.trim()),
  ];
  return {
    id: newId(),
    status: 'preparing',
    teams,
    settings,
    currentRound: 1,
    currentTeamIndex: 0,
    currentTermId: null,
    usedTermIds: [],
    remainingTime: settings.turnDuration * 1000,
    turnEndTimestamp: null,
    isPaused: false,
    turnStats: { correct: 0, skipped: 0 },
  };
}

/* ---------- Timer helpers (timestamp based) ---------- */

/**
 * Remaining ms of the current turn.
 * Running turn  -> derived from the absolute deadline (survives background /
 *                  screen lock / reload, no counter decrementing involved).
 * Paused / idle -> the stored remainingTime.
 */
export function getRemainingMs(state: GameState, now: number): number {
  if (state.status === 'playing' && !state.isPaused && state.turnEndTimestamp !== null) {
    return Math.max(0, state.turnEndTimestamp - now);
  }
  return Math.max(0, state.remainingTime);
}

export function isTurnExpired(state: GameState, now: number): boolean {
  return (
    state.status === 'playing' &&
    !state.isPaused &&
    state.turnEndTimestamp !== null &&
    now >= state.turnEndTimestamp
  );
}

/* ---------- Transitions (pure; never mutate the input) ---------- */

const emptyStats = (): TurnStats => ({ correct: 0, skipped: 0 });

/** Explainer pressed "Ready": show first term and start the clock. */
export function startTurn(
  state: GameState,
  words: readonly Word[],
  now: number,
  rng?: Rng,
): GameState {
  if (state.status !== 'preparing') return state;
  const { word, usedTermIds } = pickNextWord(words, state.usedTermIds, rng);
  const duration = state.settings.turnDuration * 1000;
  return {
    ...state,
    status: 'playing',
    currentTermId: word.id,
    usedTermIds,
    remainingTime: duration,
    turnEndTimestamp: now + duration,
    isPaused: false,
    turnStats: emptyStats(),
  };
}

function canAct(state: GameState, expectedTermId: string | undefined, now: number): boolean {
  if (state.status !== 'playing' || state.isPaused || state.currentTermId === null) return false;
  if (isTurnExpired(state, now)) return false;
  // Atomicity guard: a stale/double tap refers to a term that is no longer shown.
  if (expectedTermId !== undefined && expectedTermId !== state.currentTermId) return false;
  return true;
}

function mapCurrentTeam(state: GameState, fn: (t: Team) => Team): [Team, Team] {
  const teams: [Team, Team] = [state.teams[0], state.teams[1]];
  teams[state.currentTeamIndex] = fn(teams[state.currentTeamIndex]);
  return teams;
}

export function markCorrect(
  state: GameState,
  words: readonly Word[],
  now: number,
  expectedTermId?: string,
  rng?: Rng,
): GameState {
  if (!canAct(state, expectedTermId, now)) return state;
  const { word, usedTermIds } = pickNextWord(words, state.usedTermIds, rng);
  return {
    ...state,
    teams: mapCurrentTeam(state, addCorrect),
    currentTermId: word.id,
    usedTermIds,
    turnStats: { ...state.turnStats, correct: state.turnStats.correct + 1 },
  };
}

export function skipTerm(
  state: GameState,
  words: readonly Word[],
  now: number,
  expectedTermId?: string,
  rng?: Rng,
): GameState {
  if (!canAct(state, expectedTermId, now)) return state;
  const { word, usedTermIds } = pickNextWord(words, state.usedTermIds, rng);
  return {
    ...state,
    teams: mapCurrentTeam(state, addSkip),
    currentTermId: word.id,
    usedTermIds,
    turnStats: { ...state.turnStats, skipped: state.turnStats.skipped + 1 },
  };
}

export function pauseTurn(state: GameState, now: number): GameState {
  if (state.status !== 'playing' || state.isPaused) return state;
  if (isTurnExpired(state, now)) return state; // let the timer end the turn
  return {
    ...state,
    isPaused: true,
    remainingTime: getRemainingMs(state, now),
    turnEndTimestamp: null,
  };
}

export function resumeTurn(state: GameState, now: number): GameState {
  if (state.status !== 'playing' || !state.isPaused) return state;
  return {
    ...state,
    isPaused: false,
    turnEndTimestamp: now + state.remainingTime,
  };
}

/** Ends the running turn (timer reached zero) and moves to the summary. */
export function endTurn(state: GameState): GameState {
  if (state.status !== 'playing') return state;
  return {
    ...state,
    status: 'summary',
    teams: mapCurrentTeam(state, completeTurn),
    isPaused: false,
    remainingTime: 0,
    turnEndTimestamp: null,
  };
}

/**
 * Called on every tick and when the app is restored / returns to foreground.
 * If the deadline already passed the turn ends automatically.
 */
export function syncWithClock(state: GameState, now: number): GameState {
  return isTurnExpired(state, now) ? endTurn(state) : state;
}

/** "Continue" on the summary screen: next turn, or the final results. */
export function continueAfterSummary(state: GameState): GameState {
  if (state.status !== 'summary') return state;
  const next = nextTurn(
    { round: state.currentRound, teamIndex: state.currentTeamIndex },
    state.settings.totalRounds,
  );
  if (next.finished) {
    return { ...state, status: 'finished', currentTermId: null };
  }
  return {
    ...state,
    status: 'preparing',
    currentRound: next.position.round,
    currentTeamIndex: next.position.teamIndex,
    currentTermId: null,
    remainingTime: state.settings.turnDuration * 1000,
    turnEndTimestamp: null,
    isPaused: false,
    turnStats: emptyStats(),
  };
}

export function setSound(state: GameState, enabled: boolean): GameState {
  return { ...state, settings: { ...state.settings, soundEnabled: enabled } };
}
