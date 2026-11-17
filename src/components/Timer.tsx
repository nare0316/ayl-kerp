interface Props {
  remainingMs: number;
  totalSeconds: number;
}

export function Timer({ remainingMs, totalSeconds }: Props) {
  const secs = Math.ceil(remainingMs / 1000);
  const pct = Math.max(0, Math.min(100, (remainingMs / (totalSeconds * 1000)) * 100));
  const low = secs <= 10;
  return (
    <div className={`timer${low ? ' timer-low' : ''}`} role="timer" aria-label={`Մնացել է ${secs} վայրկյան`}>
      <div className="timer-value">{secs}</div>
      <div className="timer-bar">
        <div className="timer-bar-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
