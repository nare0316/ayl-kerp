import type { Word } from '../types/game';

export type Rng = () => number;

/** Fisher–Yates shuffle (returns a new array). */
export function shuffle<T>(items: readonly T[], rng: Rng = Math.random): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export interface NextWordResult {
  word: Word;
  /** Used ids after picking (includes the new word). May have been reset. */
  usedTermIds: string[];
}

/**
 * Picks a random unused word. When the vocabulary is exhausted the used list
 * is reset (reshuffle) so the game can continue; the word that was just shown
 * is excluded from the first pick after a reset to avoid an immediate repeat.
 */
export function pickNextWord(
  words: readonly Word[],
  usedTermIds: readonly string[],
  rng: Rng = Math.random,
): NextWordResult {
  if (words.length === 0) throw new Error('Vocabulary is empty');
  const used = new Set(usedTermIds);
  let pool = words.filter((w) => !used.has(w.id));
  let baseUsed: string[] = [...usedTermIds];

  if (pool.length === 0) {
    const last = usedTermIds[usedTermIds.length - 1];
    baseUsed = [];
    pool = words.length > 1 ? words.filter((w) => w.id !== last) : [...words];
  }
  const word = pool[Math.floor(rng() * pool.length)];
  return { word, usedTermIds: [...baseUsed, word.id] };
}

export function findWord(words: readonly Word[], id: string | null): Word | undefined {
  return id ? words.find((w) => w.id === id) : undefined;
}

/** Removes duplicate terms (case-insensitive) and malformed entries. */
export function sanitizeWords(raw: unknown): Word[] {
  if (!Array.isArray(raw)) return [];
  const seenIds = new Set<string>();
  const seenTerms = new Set<string>();
  const out: Word[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const w = item as Partial<Word>;
    if (typeof w.id !== 'string' || typeof w.term !== 'string' || !w.term.trim()) continue;
    const key = w.term.trim().toLowerCase();
    if (seenIds.has(w.id) || seenTerms.has(key)) continue;
    seenIds.add(w.id);
    seenTerms.add(key);
    out.push({
      id: w.id,
      term: w.term.trim(),
      category: w.category ?? 'General',
      difficulty: w.difficulty ?? 'medium',
      language: w.language ?? 'en',
      aliases: Array.isArray(w.aliases) ? w.aliases : [],
    });
  }
  return out;
}
