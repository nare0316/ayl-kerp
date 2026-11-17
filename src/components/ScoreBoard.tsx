import type { Team } from '../types/game';

interface Props {
  teams: readonly [Team, Team];
  activeIndex?: 0 | 1;
}

export function ScoreBoard({ teams, activeIndex }: Props) {
  return (
    <div className="scoreboard">
      {teams.map((t, i) => (
        <div key={t.id} className={`score-item${activeIndex === i ? ' score-active' : ''}`}>
          <span className="score-name">{t.name}</span>
          <span className="score-value">{t.score}</span>
        </div>
      ))}
    </div>
  );
}
