import React, { useState, useRef, useEffect } from 'react';
import { Layers, Sparkles, ShieldCheck, Keyboard, HelpCircle, Search, Globe, Check } from 'lucide-react';
import { useI18n } from '../i18n';
import { SupportedLocale } from '../i18n/types';

interface NavbarProps {
  currentView: 'home' | 'editor' | 'clips';
  setCurrentView: (view: 'home' | 'editor' | 'clips') => void;
  clipsCount: number;
  onNewSketch: () => void;
  onStartTour?: () => void;
  onOpenCommandPalette?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  clipsCount,
  onNewSketch,
  onStartTour,
  onOpenCommandPalette
}) => {
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const { currentLocale, setLocale, locales, currentMeta, t, strings } = useI18n();
  const [isLangOpen, setIsLangOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setIsLangOpen(false);
      }
    };
    if (isLangOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isLangOpen]);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-obsidian-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div 
          onClick={() => setCurrentView('home')} 
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="flex items-center gap-1 bg-obsidian-800 border border-zinc-700/80 group-hover:border-amber-500/80 px-2.5 py-1.5 rounded-lg transition-all duration-200 shadow-sm">
            <span className="font-mono text-xs font-bold text-zinc-400">CTRL</span>
            <span className="font-mono text-xs font-black text-amber-accent bg-amber-500/10 px-1 py-0.5 rounded">V</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-base font-bold tracking-tight text-white group-hover:text-amber-glow transition-colors">
                SnapPaste
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400/90 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.2 rounded-full font-semibold">
                v2.0
              </span>
            </div>
            <span className="text-[11px] text-zinc-400 hidden sm:inline-block">
              {strings.common.tagline}
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setCurrentView('home')}
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              currentView === 'home'
                ? 'bg-zinc-800/90 text-amber-accent border border-zinc-700/80'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
            }`}
          >
            <Keyboard className="w-4 h-4" />
            <span className="hidden sm:inline">{strings.nav.paste}</span>
            <span className="kbd-badge text-[10px] py-0 px-1 ml-0.5 hidden xs:inline-flex">
              {isMac ? '⌘V' : 'Ctrl+V'}
            </span>
          </button>

          <button
            onClick={() => onNewSketch()}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 transition-all"
            title="Just Sketch"
          >
            <Sparkles className="w-4 h-4 text-amber-accent" />
            <span>Just Sketch</span>
          </button>

          <button
            data-tour="my-clips"
            onClick={() => setCurrentView('clips')}
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              currentView === 'clips'
                ? 'bg-zinc-800/90 text-amber-accent border border-zinc-700/80'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>{strings.nav.myClips}</span>
            {clipsCount > 0 && (
              <span className="bg-amber-500/20 text-amber-accent text-[11px] font-mono px-1.5 py-0.2 rounded-full font-bold border border-amber-500/30">
                {clipsCount}
              </span>
            )}
          </button>
        </nav>

        {/* Right Info / Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {onOpenCommandPalette && (
            <button
              onClick={onOpenCommandPalette}
              className="flex items-center gap-1.5 p-1.5 sm:px-2.5 sm:py-1 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 border border-zinc-800 hover:border-zinc-700/80 transition-all shadow-sm"
              title={`${strings.nav.search} (${isMac ? '⌘K' : 'Ctrl+K'})`}
            >
              <Search className="w-3.5 h-3.5 text-zinc-400" />
              <span className="hidden md:inline text-zinc-400">{strings.nav.search}</span>
              <kbd className="hidden sm:inline-flex kbd-badge text-[10px] py-0 px-1 text-zinc-400">
                {isMac ? '⌘K' : 'Ctrl+K'}
              </kbd>
            </button>
          )}

          {onStartTour && (
            <button
              onClick={onStartTour}
              className="flex items-center gap-1.5 p-1.5 sm:px-2.5 sm:py-1 rounded-lg text-xs font-medium text-zinc-400 hover:text-amber-accent hover:bg-zinc-800/60 border border-transparent hover:border-zinc-700/60 transition-all"
              title={strings.nav.tour}
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-accent" />
              <span className="hidden sm:inline">{strings.nav.tour}</span>
            </button>
          )}

          {/* Language Selector Dropdown */}
          <div className="relative" ref={langMenuRef}>
            <button
              onClick={() => setIsLangOpen(!isLangOpen)}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium text-zinc-300 hover:text-white bg-obsidian-900 border border-zinc-800 hover:border-zinc-700 transition-all shadow-sm"
              title={strings.nav.switchLanguage}
              aria-label={strings.nav.language}
            >
              <Globe className="w-3.5 h-3.5 text-amber-accent" />
              <span className="font-mono text-xs font-semibold uppercase">{currentMeta.code}</span>
              <span className="text-[10px]">{currentMeta.flag}</span>
            </button>

            {isLangOpen && (
              <div className="absolute right-0 mt-2 w-48 py-1.5 bg-obsidian-900/95 border border-zinc-800 rounded-xl shadow-2xl backdrop-blur-xl z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-1 text-[10px] uppercase font-bold tracking-wider text-zinc-400 border-b border-zinc-800/60 mb-1">
                  {strings.nav.language}
                </div>
                {locales.map((loc) => {
                  const isSelected = loc.code === currentLocale;
                  return (
                    <button
                      key={loc.code}
                      onClick={() => {
                        setLocale(loc.code as SupportedLocale);
                        setIsLangOpen(false);
                      }}
                      className={`w-full px-3 py-1.5 flex items-center justify-between text-xs transition-colors ${
                        isSelected
                          ? 'bg-amber-500/10 text-amber-accent font-semibold'
                          : 'text-zinc-300 hover:bg-zinc-800/60 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{loc.flag}</span>
                        <span className="tracking-tight">{loc.nativeLabel}</span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-amber-accent" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="hidden lg:flex items-center gap-1.5 text-xs text-zinc-400 bg-obsidian-900 border border-zinc-800 px-2.5 py-1 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>{strings.nav.localPrivacy}</span>
          </div>
        </div>

      </div>
    </header>
  );
};
