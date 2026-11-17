import { Button } from '../components/Button';
import { ScoreBoard } from '../components/ScoreBoard';
import type { GameState } from '../types/game';

interface Props {
  game: GameState;
  onContinue: () => void;
}

export function TurnSummary({ game, onContinue }: Props) {
  const team = game.teams[game.currentTeamIndex];
  const { correct, skipped } = game.turnStats;
  const isLast = game.currentRound >= game.settings.totalRounds && game.currentTeamIndex === 1;
  return (
    <main className="screen screen-center">
      <div className="badge">⏰ Ժամանակը սպառվեց</div>
      <h1 className="team-title">{team.name}</h1>
      <div className="card summary">
        <div className="summary-main">
          <span className="muted">Այս հերթում ստացած միավորներ</span>
          <strong>+{correct}</strong>
        </div>
        <div className="summary-row">
          <span>Ճիշտ գուշակված</span>
          <strong>{correct}</strong>
        </div>
        <div className="summary-row">
          <span>Բաց թողնված</span>
          <strong>{skipped}</strong>
        </div>
      </div>
      <ScoreBoard teams={game.teams} activeIndex={game.currentTeamIndex} />
      <Button variant="primary" big onClick={onContinue}>
        {isLast ? 'Տեսնել արդյունքները' : 'Շարունակել'}
      </Button>
    </main>
  );
}
