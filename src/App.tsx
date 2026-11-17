import { useCallback, useEffect, useRef, useState } from 'react';
import { primeAudio, playTimeUp } from './audio';
import {
  continueAfterSummary,
  createGame,
  endTurn,
  markCorrect,
  pauseTurn,
  resumeTurn,
  setSound,
  skipTerm,
  startTurn,
  syncWithClock,
  type SetupInput,
} from './game/gameLogic';
import { sanitizeWords } from './game/wordManager';
import { GameSetup } from './pages/GameSetup';
import { Gameplay } from './pages/Gameplay';
import { Home } from './pages/Home';
import { Pause } from './pages/Pause';
import { Results } from './pages/Results';
import { Rules } from './pages/Rules';
import { TurnPreparation } from './pages/TurnPreparation';
import { TurnSummary } from './pages/TurnSummary';
import {
  clearGame,
  hasResumableGame,
  loadGame,
  loadSoundPref,
  saveGame,
  saveSoundPref,
} from './storage/gameStorage';
import type { GameState, Word } from './types/game';

type Screen = 'home' | 'rules' | 'setup' | 'game';

export default function App() {
  const [words, setWords] = useState<Word[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [screen, setScreen] = useState<Screen>('home');
  const [game, setGame] = useState<GameState | null>(null);
  const [canResume, setCanResume] = useState(() => hasResumableGame());
  const [soundPref, setSoundPref] = useState(() => loadSoundPref());

  // Latest state for handlers that must read it synchronously (atomic updates).
  const gameRef = useRef<GameState | null>(null);
  const wordsRef = useRef<Word[]>([]);
  wordsRef.current = words ?? [];

  /** Single entry point for state changes: updates ref + React state + storage. */
  const commit = useCallback((next: GameState | null) => {
    gameRef.current = next;
    setGame(next);
    if (next) {
      saveGame(next);
      setCanResume(next.status !== 'finished');
    }
  }, []);

  // Load the vocabulary (cached by the service worker for offline use).
  useEffect(() => {
    let cancelled = false;
    fetch('/words.json')
      .then((r) => {
        if (!r.ok) throw new Error('bad response');
        return r.json();
      })
      .then((raw) => {
        if (cancelled) return;
        const list = sanitizeWords(raw);
        if (list.length === 0) throw new Error('empty vocabulary');
        setWords(list);
      })
      .catch(() => !cancelled && setLoadError(true));
    return () => {
      cancelled = true;
    };
  }, []);

  /** Plays the time-up signal and moves to the summary (idempotent). */
  const handleTimeUp = useCallback(() => {
    const cur = gameRef.current;
    if (!cur || cur.status !== 'playing') return;
    playTimeUp(cur.settings.soundEnabled);
    commit(endTurn(cur));
  }, [commit]);

  // When the app returns to the foreground / is reopened, re-check the deadline.
  useEffect(() => {
    const check = () => {
      const cur = gameRef.current;
      if (!cur) return;
      const synced = syncWithClock(cur, Date.now());
      if (synced !== cur) commit(synced);
    };
    document.addEventListener('visibilitychange', check);
    return () => document.removeEventListener('visibilitychange', check);
  }, [commit]);

  /* ---------- Handlers ---------- */

  const startNew = (input: SetupInput) => {
    commit(createGame(input, soundPref));
    setScreen('game');
  };

  const resume = () => {
    const saved = loadGame();
    if (!saved) {
      setCanResume(false);
      return;
    }
    // If the deadline passed while the app was closed, end the turn now.
    const synced = syncWithClock(saved, Date.now());
    commit(synced);
    setScreen('game');
  };

  const toggleSound = () => {
    const next = !soundPref;
    setSoundPref(next);
    saveSoundPref(next);
    const cur = gameRef.current;
    if (cur) commit(setSound(cur, next));
  };

  const ready = () => {
    const cur = gameRef.current;
    if (!cur) return;
    primeAudio(); // unlocks audio on iOS/Android inside a user gesture
    commit(startTurn(cur, wordsRef.current, Date.now()));
  };

  const correct = (shownTermId: string) => {
    const cur = gameRef.current;
    if (cur) commit(markCorrect(cur, wordsRef.current, Date.now(), shownTermId));
  };

  const skip = (shownTermId: string) => {
    const cur = gameRef.current;
    if (cur) commit(skipTerm(cur, wordsRef.current, Date.now(), shownTermId));
  };

  const pause = () => {
    const cur = gameRef.current;
    if (cur) commit(pauseTurn(cur, Date.now()));
  };

  const resumeTurnHandler = () => {
    const cur = gameRef.current;
    if (cur) commit(resumeTurn(cur, Date.now()));
  };

  const exitGame = () => {
    clearGame();
    gameRef.current = null;
    setGame(null);
    setCanResume(false);
    setScreen('home');
  };

  const goHome = () => {
    setScreen('home');
  };

  /* ---------- Render ---------- */

  if (loadError) {
    return (
      <main className="screen screen-center">
        <h1 className="page-title">Չհաջողվեց բեռնել բառարանը</h1>
        <p className="muted">Ստուգեք կապը և թարմացրեք էջը։</p>
        <button className="btn btn-primary" onClick={() => location.reload()}>Թարմացնել</button>
      </main>
    );
  }
  if (!words) {
    return (
      <main className="screen screen-center">
        <div className="logo" aria-hidden="true">{'</>'}</div>
        <p className="muted">Բեռնվում է…</p>
      </main>
    );
  }

  if (screen === 'rules') return <Rules onBack={goHome} />;
  if (screen === 'setup') return <GameSetup onStart={startNew} onBack={goHome} />;

  if (screen === 'game' && game) {
    if (game.status === 'finished') {
      return (
        <Results
          game={game}
          onNewGame={() => {
            clearGame();
            commit(null);
            setCanResume(false);
            setScreen('setup');
          }}
          onHome={() => {
            clearGame();
            commit(null);
            setCanResume(false);
            setScreen('home');
          }}
        />
      );
    }
    if (game.status === 'summary') {
      return <TurnSummary game={game} onContinue={() => commit(continueAfterSummary(game))} />;
    }
    if (game.status === 'playing') {
      if (game.isPaused) {
        return (
          <Pause game={game} onResume={resumeTurnHandler} onExit={exitGame} onToggleSound={toggleSound} />
        );
      }
      return (
        <Gameplay
          game={game}
          words={words}
          onCorrect={correct}
          onSkip={skip}
          onPause={pause}
          onTimeUp={handleTimeUp}
        />
      );
    }
    return <TurnPreparation game={game} onReady={ready} />;
  }

  return (
    <Home
      canResume={canResume}
      soundEnabled={soundPref}
      onNew={() => setScreen('setup')}
      onRules={() => setScreen('rules')}
      onResume={resume}
      onToggleSound={toggleSound}
    />
  );
}
