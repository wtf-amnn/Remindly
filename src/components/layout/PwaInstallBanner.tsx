import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { APP_CONFIG } from '../../config/appConfig';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PwaInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);

  useEffect(() => {
    // Check if already running in standalone / PWA mode
    const isRunningStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      // @ts-expect-error navigator.standalone is iOS Safari specific
      window.navigator?.standalone === true;

    setIsStandalone(isRunningStandalone);

    const dismissed = localStorage.getItem(APP_CONFIG.storageKeys.dismissedPwaBanner);
    if (dismissed || isRunningStandalone) return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem(APP_CONFIG.storageKeys.dismissedPwaBanner, 'true');
  };

  if (isStandalone || !showBanner) return null;

  return (
    <div className="bg-gradient-to-r from-indigo-950/80 via-slate-900/90 to-purple-950/80 border-b border-indigo-500/30 px-4 py-2.5 text-xs text-slate-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 shrink-0">
            <Download className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-white">Install {APP_CONFIG.name}:</span>{' '}
            <span className="text-slate-300 hidden sm:inline">
              Add to your device home screen for offline access and swift experience.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="primary"
            onClick={handleInstallClick}
            className="text-xs py-1 px-3"
          >
            Install App
          </Button>
          <button
            onClick={handleDismiss}
            className="p-1 text-slate-400 hover:text-white rounded transition-colors"
            aria-label="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
