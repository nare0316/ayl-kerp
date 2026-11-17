import { Button } from '../components/Button';
import { getOutcome, totalCorrect } from '../game/scoring';
import type { GameState } from '../types/game';

interface Props {
  game: GameState;
  onNewGame: () => void;
  onHome: () => void;
}

export function Results({ game, onNewGame, onHome }: Props) {
  const outcome = getOutcome(game.teams);
  return (
    <main className="screen screen-center">
      <h1 className="page-title">Խաղի արդյունքները</h1>
      <div className="trophy" aria-hidden="true">{outcome.kind === 'draw' ? '🤝' : '🏆'}</div>
      <h2 className="winner">
        {outcome.kind === 'draw' ? 'Ոչ-ոքի' : `Հաղթող՝ ${game.teams[outcome.winnerIndex].name}`}
      </h2>
      <div className="card results">
        {game.teams.map((t, i) => (
          <div
            key={t.id}
            className={`result-row${outcome.kind === 'win' && outcome.winnerIndex === i ? ' result-win' : ''}`}
          >
            <span className="result-name">{t.name}</span>
            <span className="result-score">{t.score}</span>
          </div>
        ))}
        <div className="summary-row">
          <span>Ընդհանուր գուշակված տերմիններ</span>
          <strong>{totalCorrect(game.teams)}</strong>
        </div>
      </div>
      <div className="stack">
        <Button variant="primary" big onClick={onNewGame}>Նոր խաղ</Button>
        <Button variant="secondary" onClick={onHome}>Գլխավոր էջ</Button>
      </div>
    </main>
  );
}
