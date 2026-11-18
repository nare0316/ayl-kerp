import { useCallback, useEffect, useState } from 'react';

/** Chrome/Android event; not part of the standard TS DOM typings. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export type InstallMode =
  | 'installed' // already running as an installed app -> hide the link
  | 'native' // Chrome can show the install dialog with one tap
  | 'ios' // Safari on iPhone/iPad: manual "Add to Home Screen" instructions
  | 'manual'; // other browsers: generic instructions

function isStandalone(): boolean {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  const ua = navigator.userAgent;
  // iPadOS 13+ reports itself as a Mac with touch support
  return /iPad|iPhone|iPod/.test(ua) || (ua.includes('Mac') && navigator.maxTouchPoints > 1);
}

/**
 * Wraps the browser install flow. On Android/Chrome the saved
 * beforeinstallprompt event lets one tap open the real install dialog.
 * Browsers never allow installing silently: the user always confirms.
 */
export function useInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(() => isStandalone());

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault(); // keep the event so we can fire it from our own link
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const mode: InstallMode = installed ? 'installed' : deferred ? 'native' : isIos() ? 'ios' : 'manual';

  /** Returns true if the native dialog was shown (caller shows instructions otherwise). */
  const install = useCallback(async (): Promise<boolean> => {
    if (!deferred) return false;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    setDeferred(null); // the event can only be used once
    if (choice.outcome === 'accepted') setInstalled(true);
    return true;
  }, [deferred]);

  return { mode, install };
}
