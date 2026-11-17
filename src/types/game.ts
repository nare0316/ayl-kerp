export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Word {
  id: string;
  term: string;
  category: string;
  difficulty: Difficulty;
  language: string;
  aliases: string[];
}

export interface Team {
  id: string;
  name: string;
  score: number;
  correctAnswers: number;
  skippedTerms: number;
  completedTurns: number;
}

export interface GameSettings {
  turnDuration: number; // seconds
  totalRounds: number;
  soundEnabled: boolean;
}

/**
 * Game phases (screens that belong to an active game):
 * - preparing: waiting for the explainer to press "Ready"
 * - playing:   a turn is running (or paused, see isPaused)
 * - summary:   turn finished, showing the turn summary
 * - finished:  all rounds completed
 */
export type GameStatus = 'preparing' | 'playing' | 'summary' | 'finished';

export interface TurnStats {
  correct: number;
  skipped: number;
}

export interface GameState {
  id: string;
  status: GameStatus;
  teams: [Team, Team];
  settings: GameSettings;
  currentRound: number; // 1-based
  currentTeamIndex: 0 | 1;
  currentTermId: string | null;
  usedTermIds: string[];
  /** Remaining ms. Authoritative only while paused / not playing. */
  remainingTime: number;
  /** Absolute deadline (epoch ms). Authoritative while a turn is running. */
  turnEndTimestamp: number | null;
  isPaused: boolean;
  /** Stats of the turn that is currently running / just finished. */
  turnStats: TurnStats;
}
