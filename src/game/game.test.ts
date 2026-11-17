import { describe, expect, it } from 'vitest';
import type { Word } from '../types/game';
import {
  continueAfterSummary,
  createGame,
  endTurn,
  getRemainingMs,
  markCorrect,
  pauseTurn,
  resumeTurn,
  skipTerm,
  startTurn,
  syncWithClock,
  validateSetup,
} from './gameLogic';
import { getOutcome } from './scoring';
import { nextTurn } from './turnManager';
import { pickNextWord, sanitizeWords } from './wordManager';
import { isValidGameState } from '../storage/gameStorage';

const mkWords = (n: number): Word[] =>
  Array.from({ length: n }, (_, i) => ({
    id: `w-${i}`,
    term: `Term ${i}`,
    category: 'Test',
    difficulty: 'easy',
    language: 'en',
    aliases: [],
  }));

const setup = { team1: 'A', team2: 'B', turnDuration: 60, totalRounds: 2 };
const T0 = 1_000_000;

describe('setup validation', () => {
  it('accepts defaults', () => {
    expect(validateSetup(setup)).toEqual({});
  });
  it('rejects empty names and out-of-range values', () => {
    const e = validateSetup({ team1: ' ', team2: '', turnDuration: 10, totalRounds: 21 });
    expect(e.team1).toBeDefined();
    expect(e.team2).toBeDefined();
    expect(e.turnDuration).toBeDefined();
    expect(e.totalRounds).toBeDefined();
  });
  it('rejects non-integers and NaN', () => {
    expect(validateSetup({ ...setup, turnDuration: 30.5 }).turnDuration).toBeDefined();
    expect(validateSetup({ ...setup, totalRounds: NaN }).totalRounds).toBeDefined();
  });
});

describe('turn manager', () => {
  it('alternates teams and advances rounds', () => {
    let r = nextTurn({ round: 1, teamIndex: 0 }, 2);
    expect(r).toEqual({ finished: false, position: { round: 1, teamIndex: 1 } });
    r = nextTurn(r.position, 2);
    expect(r).toEqual({ finished: false, position: { round: 2, teamIndex: 0 } });
    r = nextTurn(r.position, 2);
    r = nextTurn(r.position, 2);
    expect(r.finished).toBe(true);
  });
  it('N rounds = 2N turns', () => {
    let pos = { round: 1, teamIndex: 0 as 0 | 1 };
    let turns = 1;
    for (;;) {
      const n = nextTurn(pos, 5);
      if (n.finished) break;
      pos = n.position;
      turns++;
    }
    expect(turns).toBe(10);
  });
});

describe('scoring and gameplay', () => {
  const words = mkWords(20);

  it('correct adds exactly one point; skip adds none', () => {
    let s = startTurn(createGame(setup), words, T0);
    s = markCorrect(s, words, T0 + 1000);
    expect(s.teams[0].score).toBe(1);
    expect(s.teams[0].correctAnswers).toBe(1);
    s = skipTerm(s, words, T0 + 2000);
    expect(s.teams[0].score).toBe(1);
    expect(s.teams[0].skippedTerms).toBe(1);
    expect(s.turnStats).toEqual({ correct: 1, skipped: 1 });
  });

  it('double tap on the same term does not double score', () => {
    let s = startTurn(createGame(setup), words, T0);
    const shown = s.currentTermId!;
    s = markCorrect(s, words, T0 + 1000, shown);
    s = markCorrect(s, words, T0 + 1001, shown); // stale tap
    expect(s.teams[0].score).toBe(1);
  });

  it('ignores actions while paused or after expiry', () => {
    let s = startTurn(createGame(setup), words, T0);
    s = pauseTurn(s, T0 + 1000);
    expect(markCorrect(s, words, T0 + 1500).teams[0].score).toBe(0);
    s = resumeTurn(s, T0 + 2000);
    expect(markCorrect(s, words, T0 + 100_000).teams[0].score).toBe(0);
  });

  it('never repeats a term before vocabulary is exhausted', () => {
    const w = mkWords(30);
    let s = startTurn(createGame({ ...setup, turnDuration: 180 }), w, T0);
    const seen = new Set<string>([s.currentTermId!]);
    for (let i = 0; i < 29; i++) {
      s = skipTerm(s, w, T0 + 1000);
      expect(seen.has(s.currentTermId!)).toBe(false);
      seen.add(s.currentTermId!);
    }
    expect(seen.size).toBe(30);
  });

  it('reshuffles after exhaustion without immediate repeat', () => {
    const w = mkWords(3);
    let used: string[] = [];
    let last = '';
    for (let i = 0; i < 10; i++) {
      const r = pickNextWord(w, used);
      expect(r.word.id).not.toBe(last);
      last = r.word.id;
      used = r.usedTermIds;
    }
  });
});

describe('timer (timestamp based)', () => {
  const words = mkWords(10);

  it('remaining time derives from the deadline, not a counter', () => {
    const s = startTurn(createGame(setup), words, T0);
    expect(getRemainingMs(s, T0)).toBe(60_000);
    // simulates the tab being suspended for 25 s
    expect(getRemainingMs(s, T0 + 25_000)).toBe(35_000);
  });

  it('pause stops the clock and resume continues from remaining', () => {
    let s = startTurn(createGame(setup), words, T0);
    const term = s.currentTermId;
    s = pauseTurn(s, T0 + 10_000);
    expect(s.isPaused).toBe(true);
    expect(getRemainingMs(s, T0 + 500_000)).toBe(50_000);
    expect(s.currentTermId).toBe(term);
    s = resumeTurn(s, T0 + 500_000);
    expect(getRemainingMs(s, T0 + 510_000)).toBe(40_000);
    expect(s.currentTermId).toBe(term);
  });

  it('ends automatically when the deadline passes (also after reopen)', () => {
    const s = startTurn(createGame(setup), words, T0);
    expect(syncWithClock(s, T0 + 59_999).status).toBe('playing');
    const ended = syncWithClock(s, T0 + 600_000);
    expect(ended.status).toBe('summary');
    expect(ended.teams[0].completedTurns).toBe(1);
  });

  it('a paused game is never ended by the clock', () => {
    let s = startTurn(createGame(setup), words, T0);
    s = pauseTurn(s, T0 + 5_000);
    expect(syncWithClock(s, T0 + 9_999_999).status).toBe('playing');
  });
});

describe('game flow', () => {
  const words = mkWords(50);

  it('plays all rounds, alternates teams, then finishes', () => {
    let s = createGame(setup); // 2 rounds
    const order: number[] = [];
    for (let i = 0; i < 4; i++) {
      expect(s.status).toBe('preparing');
      order.push(s.currentTeamIndex);
      s = startTurn(s, words, T0);
      s = markCorrect(s, words, T0 + 1000);
      s = endTurn(s);
      expect(s.status).toBe('summary');
      s = continueAfterSummary(s);
    }
    expect(order).toEqual([0, 1, 0, 1]);
    expect(s.status).toBe('finished');
    expect(s.teams[0].completedTurns).toBe(2);
    expect(s.teams[1].completedTurns).toBe(2);
  });

  it('detects draw and winner', () => {
    const g = createGame(setup);
    expect(getOutcome(g.teams)).toEqual({ kind: 'draw' });
    const t: typeof g.teams = [{ ...g.teams[0], score: 3 }, { ...g.teams[1], score: 5 }];
    expect(getOutcome(t)).toEqual({ kind: 'win', winnerIndex: 1 });
  });
});

describe('persistence round-trip', () => {
  const words = mkWords(10);

  it('serialised state restores identically (scores, used words, pause)', () => {
    let s = startTurn(createGame(setup), words, T0);
    s = markCorrect(s, words, T0 + 1000);
    s = pauseTurn(s, T0 + 2000);
    const restored = JSON.parse(JSON.stringify(s));
    expect(isValidGameState(restored)).toBe(true);
    expect(restored).toEqual(s);
    expect(restored.usedTermIds.length).toBe(2);
    expect(getRemainingMs(restored, T0 + 99_999)).toBe(58_000);
  });

  it('rejects corrupted data', () => {
    expect(isValidGameState(null)).toBe(false);
    expect(isValidGameState({ id: 1 })).toBe(false);
    expect(isValidGameState({})).toBe(false);
  });
});

describe('vocabulary file', () => {
  it('sanitizeWords drops duplicates and malformed entries', () => {
    const out = sanitizeWords([
      { id: 'a', term: 'Stack' },
      { id: 'b', term: 'stack' },
      { id: 'a', term: 'Queue' },
      { id: 'c', term: '  ' },
      null,
      { id: 'd', term: 'Heap' },
    ]);
    expect(out.map((w) => w.id)).toEqual(['a', 'd']);
  });
});
