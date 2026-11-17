import { useState } from 'react';
import { Button } from '../components/Button';
import { LIMITS, validateSetup, type SetupErrors, type SetupInput } from '../game/gameLogic';

interface Props {
  onStart: (input: SetupInput) => void;
  onBack: () => void;
}

/** Numeric inputs keep their raw text so users can clear and retype them. */
function toNumber(text: string): number {
  return text.trim() === '' ? NaN : Number(text);
}

export function GameSetup({ onStart, onBack }: Props) {
  const [team1, setTeam1] = useState('Թիմ 1');
  const [team2, setTeam2] = useState('Թիմ 2');
  const [duration, setDuration] = useState(String(LIMITS.turnDuration.default));
  const [rounds, setRounds] = useState(String(LIMITS.totalRounds.default));
  const [errors, setErrors] = useState<SetupErrors>({});

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const input: SetupInput = {
      team1,
      team2,
      turnDuration: toNumber(duration),
      totalRounds: toNumber(rounds),
    };
    const errs = validateSetup(input);
    setErrors(errs);
    if (Object.keys(errs).length === 0) onStart(input);
  };

  return (
    <main className="screen">
      <h1 className="page-title">Նոր խաղ</h1>
      <form className="card form" onSubmit={submit} noValidate>
        <label className="field">
          <span>Առաջին թիմ</span>
          <input value={team1} maxLength={20} onChange={(e) => setTeam1(e.target.value)} />
          {errors.team1 && <em className="error">{errors.team1}</em>}
        </label>
        <label className="field">
          <span>Երկրորդ թիմ</span>
          <input value={team2} maxLength={20} onChange={(e) => setTeam2(e.target.value)} />
          {errors.team2 && <em className="error">{errors.team2}</em>}
        </label>
        <label className="field">
          <span>Հերթի տևողությունը (վայրկյան)</span>
          <input
            inputMode="numeric"
            pattern="[0-9]*"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          />
          <small>
            {LIMITS.turnDuration.min}–{LIMITS.turnDuration.max}
          </small>
          {errors.turnDuration && <em className="error">{errors.turnDuration}</em>}
        </label>
        <label className="field">
          <span>Փուլերի քանակը</span>
          <input
            inputMode="numeric"
            pattern="[0-9]*"
            value={rounds}
            onChange={(e) => setRounds(e.target.value)}
          />
          <small>
            {LIMITS.totalRounds.min}–{LIMITS.totalRounds.max}
          </small>
          {errors.totalRounds && <em className="error">{errors.totalRounds}</em>}
        </label>
        <button type="submit" className="btn btn-primary btn-big">Սկսել խաղը</button>
        <Button variant="ghost" onClick={onBack}>Հետ</Button>
      </form>
    </main>
  );
}
