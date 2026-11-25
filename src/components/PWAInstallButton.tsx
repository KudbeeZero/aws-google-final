import React, { useState } from 'react';
import { Download, Share, PlusSquare, Smartphone, X, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { triggerHaptic } from '../utils/haptics';

export const PWAInstallButton: React.FC<{ variant?: 'compact' | 'card' }> = ({ variant = 'compact' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    triggerHaptic('light');
    if (isInstallable) {
      await install();
    } else {
      setShowIOSGuide(true);
    }
  };

  if (variant === 'card') {
    return (
      <>
        <button
          onClick={handleInstallClick}
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-xs font-semibold hover:opacity-90 transition-all cursor-pointer shadow-sm"
        >
          <span className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-amber-400 dark:text-amber-600" />
            <span>{isIOS ? 'Add to iPhone Home Screen' : 'Install Native App'}</span>
          </span>
          <Download className="w-3.5 h-3.5 opacity-80" />
        </button>

        {showIOSGuide && <IOSInstallSheet onClose={() => setShowIOSGuide(false)} isIOS={isIOS} />}
      </>
    );
  }

  return (
    <>
      <button
        onClick={handleInstallClick}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 text-xs font-semibold hover:opacity-90 transition-all cursor-pointer whitespace-nowrap shrink-0 shadow-xs"
        title={isIOS ? 'Install on iPhone / iPad' : 'Install App on Device'}
      >
        <Download className="w-3.5 h-3.5 text-amber-400 dark:text-amber-600" />
        <span className="hidden sm:inline">{isIOS ? 'Get iOS App' : 'Install App'}</span>
      </button>

      {showIOSGuide && <IOSInstallSheet onClose={() => setShowIOSGuide(false)} isIOS={isIOS} />}
    </>
  );
};

const IOSInstallSheet: React.FC<{ onClose: () => void; isIOS: boolean }> = ({ onClose, isIOS }) => (
  <div
    className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 backdrop-blur-md p-0 sm:p-4 animate-fade-in"
    onClick={onClose}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-700/80 p-6 shadow-2xl space-y-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
    >
      <div className="w-10 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto sm:hidden" />

      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <img
            src="/apple-touch-icon.png"
            alt="CloudMaster App Icon"
            className="w-14 h-14 rounded-2xl shadow-md border border-slate-200 dark:border-slate-700 object-cover shrink-0"
          />
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
              Install CloudMaster
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Full-screen native experience · Works offline
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Close install guide"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3 bg-slate-50 dark:bg-slate-950/60 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-800">
        {isIOS ? (
          <>
            <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Share className="w-4 h-4" />
              </div>
              <p className="text-xs leading-relaxed">
                1. Tap the <strong>Share</strong> icon in your Safari toolbar.
              </p>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <PlusSquare className="w-4 h-4" />
              </div>
              <p className="text-xs leading-relaxed">
                2. Scroll down and tap <strong>Add to Home Screen</strong>.
              </p>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <p className="text-xs leading-relaxed">
                3. Launch <strong>CloudMaster</strong> directly from your iPhone or iPad Home Screen.
              </p>
            </div>
          </>
        ) : (
          <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            <p>
              To install on desktop or mobile, open your browser menu and select{' '}
              <strong>Install CloudMaster</strong> or <strong>Add to Home Screen</strong>.
            </p>
            <p className="text-slate-500 dark:text-slate-400">
              On iPhone or iPad Safari, tap <strong>Share → Add to Home Screen</strong>.
            </p>
          </div>
        )}
      </div>

      <button
        onClick={onClose}
        className="w-full py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-semibold text-sm hover:opacity-90 transition-opacity cursor-pointer"
      >
        Done
      </button>
    </div>
  </div>
);
