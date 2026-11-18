import { useState } from 'react';
import { useInstallPrompt } from '../hooks/useInstallPrompt';

/** Top-right link: installs the app (icon on the home screen + offline use). */
export function InstallLink() {
  const { mode, install } = useInstallPrompt();
  const [showHelp, setShowHelp] = useState(false);

  if (mode === 'installed') return null;

  const onClick = async () => {
    const shown = await install();
    if (!shown) setShowHelp(true); // iOS / browsers without a native prompt
  };

  return (
    <>
      <button type="button" className="install-link" onClick={onClick}>
        📲 Բեռնել հավելվածը հեռախոսում
      </button>

      {showHelp && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={() => setShowHelp(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Ինչպես տեղադրել</h2>
            {mode === 'ios' ? (
              <ol>
                <li>Բացեք այս էջը <strong>Safari</strong>-ում։</li>
                <li>Սեղմեք ներքևի <strong>Share</strong> կոճակը (քառակուսի՝ վերև սլաքով)։</li>
                <li>Ընտրեք <strong>«Add to Home Screen»</strong>։</li>
                <li>Սեղմեք <strong>«Add»</strong>։ Խաղը կհայտնվի գլխավոր էկրանին և կաշխատի առանց ինտերնետի։</li>
              </ol>
            ) : (
              <ol>
                <li>Բացեք բրաուզերի մենյուն (<strong>⋮</strong>)։</li>
                <li>Ընտրեք <strong>«Install app»</strong> կամ <strong>«Add to Home screen»</strong>։</li>
                <li>Հաստատեք։ Խաղը կհայտնվի գլխավոր էկրանին և կաշխատի առանց ինտերնետի։</li>
              </ol>
            )}
            <button type="button" className="btn btn-primary" onClick={() => setShowHelp(false)}>
              Հասկանալի է
            </button>
          </div>
        </div>
      )}
    </>
  );
}
