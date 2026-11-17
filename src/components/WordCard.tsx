import type { Word } from '../types/game';

export function WordCard({ word }: { word: Word | undefined }) {
  if (!word) return <div className="word-card">…</div>;
  // key forces the pop-in animation for every new term
  return (
    <div className="word-card" key={word.id}>
      <span className="word-category">{word.category}</span>
      <div className="word-term">{word.term}</div>
    </div>
  );
}
