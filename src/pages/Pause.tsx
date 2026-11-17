import { useState } from 'react';
import { Button } from '../components/Button';
import type { GameState } from '../types/game';

interface Props {
  game: GameState;
  onResume: () => void;
  onExit: () => void;
  onToggleSound: () => void;
}

export function Pause({ game, onResume, onExit, onToggleSound }: Props) {
  const [confirming, setConfirming] = useState(false);
  const secs = Math.ceil(game.remainingTime / 1000);
  return (
    <main className="screen screen-center">
      <div className="badge">⏸ Խաղը դադարեցված է</div>
      <p className="muted">Մնացել է</p>
      <div className="big-number">{secs} վրկ</div>
      <div className="stack">
        <Button variant="success" big onClick={onResume}>Շարունակել</Button>
        <Button variant="ghost" onClick={onToggleSound} aria-pressed={game.settings.soundEnabled}>
          {game.settings.soundEnabled ? '🔊 Ձայն՝ միացված' : '🔇 Ձայն՝ անջատված'}
        </Button>
        {!confirming ? (
          <Button variant="danger" onClick={() => setConfirming(true)}>Դուրս գալ խաղից</Button>
        ) : (
          <div className="card info">
            <p>Դուրս գալու դեպքում ընթացիկ խաղը կկորչի։ Համոզվա՞ծ եք։</p>
            <div className="row">
              <Button variant="danger" onClick={onExit}>Այո, դուրս գալ</Button>
              <Button variant="secondary" onClick={() => setConfirming(false)}>Չեղարկել</Button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
