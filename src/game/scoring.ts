import type { Team } from '../types/game';

export const POINTS_PER_CORRECT = 1;

export function createTeam(id: string, name: string): Team {
  return { id, name, score: 0, correctAnswers: 0, skippedTerms: 0, completedTurns: 0 };
}

export function addCorrect(team: Team): Team {
  return {
    ...team,
    score: team.score + POINTS_PER_CORRECT,
    correctAnswers: team.correctAnswers + 1,
  };
}

/** Skipping never changes the score. */
export function addSkip(team: Team): Team {
  return { ...team, skippedTerms: team.skippedTerms + 1 };
}

export function completeTurn(team: Team): Team {
  return { ...team, completedTurns: team.completedTurns + 1 };
}

export type Outcome =
  | { kind: 'draw' }
  | { kind: 'win'; winnerIndex: 0 | 1 };

export function getOutcome(teams: readonly [Team, Team]): Outcome {
  if (teams[0].score === teams[1].score) return { kind: 'draw' };
  return { kind: 'win', winnerIndex: teams[0].score > teams[1].score ? 0 : 1 };
}

export function totalCorrect(teams: readonly Team[]): number {
  return teams.reduce((sum, t) => sum + t.correctAnswers, 0);
}
