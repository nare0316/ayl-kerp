import { Button } from '../components/Button';
import { ScoreBoard } from '../components/ScoreBoard';
import type { GameState } from '../types/game';

interface Props {
  game: GameState;
  onReady: () => void;
}

/** The term is intentionally NOT shown here: the phone is being passed around. */
export function TurnPreparation({ game, onReady }: Props) {
  const team = game.teams[game.currentTeamIndex];
  return (
    <main className="screen screen-center">
      <div className="badge">
        Փուլ {game.currentRound} / {game.settings.totalRounds}
      </div>
      <p className="muted">Հերթը</p>
      <h1 className="team-title">{team.name}</h1>
      <div className="card info">
        <p>Հանձնեք սարքը բացատրողին։</p>
        <p>Մնացած թիմակիցները չպետք է տեսնեն էկրանը։</p>
        <p>Հերթի տևողությունը՝ <strong>{game.settings.turnDuration} վրկ</strong></p>
      </div>
      <Button variant="success" big onClick={onReady}>Պատրաստ եմ</Button>
      <ScoreBoard teams={game.teams} activeIndex={game.currentTeamIndex} />
    </main>
  );
}
