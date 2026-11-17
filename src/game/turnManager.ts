/**
 * Pure turn / round progression, independent from React.
 * Round r consists of team 0's turn followed by team 1's turn.
 */
export interface TurnPosition {
  round: number; // 1-based
  teamIndex: 0 | 1;
}

export interface NextTurn {
  finished: boolean;
  position: TurnPosition;
}

export function nextTurn(current: TurnPosition, totalRounds: number): NextTurn {
  if (current.teamIndex === 0) {
    return { finished: false, position: { round: current.round, teamIndex: 1 } };
  }
  if (current.round >= totalRounds) {
    return { finished: true, position: current };
  }
  return { finished: false, position: { round: current.round + 1, teamIndex: 0 } };
}

export function totalTurns(totalRounds: number): number {
  return totalRounds * 2;
}
