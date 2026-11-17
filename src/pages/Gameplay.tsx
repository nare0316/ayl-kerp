import { Button } from '../components/Button';
import { Timer } from '../components/Timer';
import { WordCard } from '../components/WordCard';
import { findWord } from '../game/wordManager';
import { useGameTimer } from '../hooks/useGameTimer';
import type { GameState, Word } from '../types/game';

interface Props {
  game: GameState;
  words: readonly Word[];
  onCorrect: (shownTermId: string) => void;
  onSkip: (shownTermId: string) => void;
  onPause: () => void;
  onTimeUp: () => void;
}

export function Gameplay({ game, words, onCorrect, onSkip, onPause, onTimeUp }: Props) {
  const remaining = useGameTimer(game, onTimeUp);
  const team = game.teams[game.currentTeamIndex];
  const word = findWord(words, game.currentTermId);
  const termId = game.currentTermId;

  return (
    <main className="screen play">
      <header className="play-head">
        <div>
          <div className="play-team">{team.name}</div>
          <div className="muted">
            Փուլ {game.currentRound} / {game.settings.totalRounds}
          </div>
        </div>
        <div className="play-score" aria-label="Միավոր">
          <span className="muted">Միավոր</span>
          <strong>{team.score}</strong>
        </div>
      </header>

      <Timer remainingMs={remaining} totalSeconds={game.settings.turnDuration} />

      <WordCard word={word} />

      <div className="play-actions">
        <Button variant="success" big disabled={!termId} onClick={() => termId && onCorrect(termId)}>
          ✓ Ճիշտ է
        </Button>
        <Button variant="warning" big disabled={!termId} onClick={() => termId && onSkip(termId)}>
          ⏭ Բաց թողնել
        </Button>
        <Button variant="ghost" onClick={onPause}>⏸ Դադար</Button>
      </div>
    </main>
  );
}
