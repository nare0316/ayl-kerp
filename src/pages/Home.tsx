import { Button } from '../components/Button';

interface Props {
  canResume: boolean;
  soundEnabled: boolean;
  onNew: () => void;
  onRules: () => void;
  onResume: () => void;
  onToggleSound: () => void;
}

export function Home({ canResume, soundEnabled, onNew, onRules, onResume, onToggleSound }: Props) {
  return (
    <main className="screen screen-center">
      <div className="logo" aria-hidden="true">{'</>'}</div>
      <h1 className="title">Այլ կերպ</h1>
      <p className="subtitle">Ծրագրավորողների բառախաղ.<br />բացատրիր տերմինը՝ առանց այն ասելու</p>
      <div className="stack">
        {canResume && (
          <Button variant="success" big onClick={onResume}>
            Շարունակել խաղը
          </Button>
        )}
        <Button big onClick={onNew}>Նոր խաղ</Button>
        <Button variant="secondary" big onClick={onRules}>Կանոններ</Button>
        <Button variant="ghost" onClick={onToggleSound} aria-pressed={soundEnabled}>
          {soundEnabled ? '🔊 Ձայն՝ միացված' : '🔇 Ձայն՝ անջատված'}
        </Button>
      </div>
    </main>
  );
}
