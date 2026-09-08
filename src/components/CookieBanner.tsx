import React from 'react';
import { ShieldCheck, Cookie, ArrowRight, X } from 'lucide-react';
import { useI18n } from '../i18n';

interface CookieBannerProps {
  onAccept: (startTour?: boolean) => void;
  onDismiss: () => void;
}

export const CookieBanner: React.FC<CookieBannerProps> = ({ onAccept, onDismiss }) => {
  const { strings } = useI18n();

  return (
    <aside 
      aria-label="Consentimento de Cookies e Privacidade"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="p-4 sm:p-5 rounded-2xl bg-obsidian-900/95 border border-zinc-800 shadow-2xl backdrop-blur-xl flex flex-col gap-3.5">
        
        {/* Header with badge & dismiss */}
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{strings.cookies.badge}</span>
          </div>
          
          <button
            onClick={onDismiss}
            className="text-zinc-500 hover:text-zinc-300 p-1 rounded-lg hover:bg-zinc-800/60 transition-colors"
            title={strings.common.close}
            aria-label={strings.common.close}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Cookie className="w-4 h-4 text-amber-accent" />
            <span>{strings.cookies.title}</span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            {strings.cookies.description}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
          <button
            onClick={() => onAccept(true)}
            className="w-full sm:flex-1 py-2 px-3.5 rounded-xl bg-amber-accent hover:bg-amber-hover text-obsidian-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all"
          >
            <span>{strings.cookies.acceptTour}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          
          <button
            onClick={() => onAccept(false)}
            className="w-full sm:w-auto py-2 px-3 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 hover:text-white font-medium text-xs transition-colors border border-zinc-700/50"
          >
            {strings.cookies.acceptOnly}
          </button>
        </div>

      </div>
    </aside>
  );
};
