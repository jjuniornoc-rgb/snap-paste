import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Pencil, 
  Highlighter, 
  ArrowUpRight, 
  Square, 
  Type, 
  EyeOff, 
  ListOrdered, 
  Crop, 
  Copy, 
  Save, 
  Download, 
  Sparkles, 
  HelpCircle, 
  FolderHeart, 
  Ruler, 
  MessageSquare,
  Frame,
  Globe
} from 'lucide-react';
import { ToolType } from './Editor/EditorToolbar';
import { useI18n, SupportedLocale } from '../i18n';

export interface CommandItem {
  id: string;
  label: string;
  category: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: 'home' | 'editor' | 'clips';
  onSelectTool?: (tool: ToolType) => void;
  onCopyImage?: () => void;
  onSaveToClips?: () => void;
  onDownloadImage?: () => void;
  onOpenFrameModal?: () => void;
  onNavigateView: (view: 'home' | 'editor' | 'clips') => void;
  onStartTour: () => void;
  onNewSketch: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  currentView,
  onSelectTool,
  onCopyImage,
  onSaveToClips,
  onDownloadImage,
  onOpenFrameModal,
  onNavigateView,
  onStartTour,
  onNewSketch
}) => {
  const { strings, setLocale, locales, currentLocale } = useI18n();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const allCommands: CommandItem[] = [
    // Tools (when in editor)
    ...(currentView === 'editor' && onSelectTool ? [
      {
        id: 'tool-brush',
        label: strings.editor.tools.brush,
        category: strings.tour.steps.editorToolsGroup.badge,
        icon: <Pencil className="w-4 h-4 text-amber-accent" />,
        shortcut: 'P',
        action: () => onSelectTool('brush')
      },
      {
        id: 'tool-highlighter',
        label: strings.editor.tools.highlighter,
        category: strings.tour.steps.editorToolsGroup.badge,
        icon: <Highlighter className="w-4 h-4 text-amber-accent" />,
        shortcut: 'H',
        action: () => onSelectTool('highlighter')
      },
      {
        id: 'tool-arrow',
        label: strings.editor.tools.arrow,
        category: strings.tour.steps.editorToolsGroup.badge,
        icon: <ArrowUpRight className="w-4 h-4 text-amber-accent" />,
        shortcut: 'A',
        action: () => onSelectTool('arrow')
      },
      {
        id: 'tool-shapes',
        label: strings.editor.tools.rectangle,
        category: strings.tour.steps.editorToolsGroup.badge,
        icon: <Square className="w-4 h-4 text-amber-accent" />,
        shortcut: 'R',
        action: () => onSelectTool('rectangle')
      },
      {
        id: 'tool-text',
        label: strings.editor.tools.text,
        category: strings.tour.steps.editorToolsGroup.badge,
        icon: <Type className="w-4 h-4 text-amber-accent" />,
        shortcut: 'T',
        action: () => onSelectTool('text')
      },
      {
        id: 'tool-censor',
        label: strings.editor.tools.censor,
        category: strings.tour.steps.editorToolsGroup.badge,
        icon: <EyeOff className="w-4 h-4 text-amber-accent" />,
        shortcut: 'B',
        action: () => onSelectTool('censor')
      },
      {
        id: 'tool-step',
        label: strings.editor.tools.step,
        category: strings.tour.steps.editorToolsGroup.badge,
        icon: <ListOrdered className="w-4 h-4 text-amber-accent" />,
        shortcut: 'N',
        action: () => onSelectTool('step')
      },
      {
        id: 'tool-magnifier',
        label: strings.editor.tools.magnifier,
        category: strings.tour.steps.editorToolsGroup.badge,
        icon: <Search className="w-4 h-4 text-amber-accent" />,
        shortcut: 'M',
        action: () => onSelectTool('magnifier')
      },
      {
        id: 'tool-dimension',
        label: strings.editor.tools.dimension,
        category: strings.tour.steps.editorToolsGroup.badge,
        icon: <Ruler className="w-4 h-4 text-amber-accent" />,
        shortcut: 'D',
        action: () => onSelectTool('dimension')
      },
      {
        id: 'tool-callout',
        label: strings.editor.tools.callout,
        category: strings.tour.steps.editorToolsGroup.badge,
        icon: <MessageSquare className="w-4 h-4 text-amber-accent" />,
        shortcut: 'Q',
        action: () => onSelectTool('callout')
      },
      {
        id: 'tool-crop',
        label: strings.editor.tools.crop,
        category: strings.tour.steps.editorToolsGroup.badge,
        icon: <Crop className="w-4 h-4 text-amber-accent" />,
        shortcut: 'X',
        action: () => onSelectTool('crop')
      },
    ] : []),

    // Actions
    ...(currentView === 'editor' ? [
      ...(onOpenFrameModal ? [{
        id: 'act-frame',
        label: strings.editor.frame,
        category: strings.tour.steps.editorTopActions.badge,
        icon: <Frame className="w-4 h-4 text-amber-accent" />,
        shortcut: 'F',
        action: onOpenFrameModal
      }] : []),
      ...(onCopyImage ? [{
        id: 'act-copy',
        label: strings.editor.copyImage,
        category: strings.tour.steps.editorTopActions.badge,
        icon: <Copy className="w-4 h-4 text-emerald-400" />,
        shortcut: isMac ? '⌘C' : 'Ctrl+C',
        action: onCopyImage
      }] : []),
      ...(onSaveToClips ? [{
        id: 'act-save',
        label: strings.editor.saveClip,
        category: strings.tour.steps.editorTopActions.badge,
        icon: <Save className="w-4 h-4 text-emerald-400" />,
        shortcut: isMac ? '⌘S' : 'Ctrl+S',
        action: onSaveToClips
      }] : []),
      ...(onDownloadImage ? [{
        id: 'act-download',
        label: strings.editor.download,
        category: strings.tour.steps.editorTopActions.badge,
        icon: <Download className="w-4 h-4 text-zinc-300" />,
        shortcut: 'Ctrl+D',
        action: onDownloadImage
      }] : []),
    ] : []),

    // Global / Navigation
    {
      id: 'nav-home',
      label: strings.palette.actions.paste,
      category: strings.palette.title,
      icon: <Sparkles className="w-4 h-4 text-amber-accent" />,
      action: () => onNavigateView('home')
    },
    {
      id: 'nav-sketch',
      label: strings.palette.actions.sketch,
      category: strings.palette.title,
      icon: <Pencil className="w-4 h-4 text-amber-accent" />,
      action: onNewSketch
    },
    {
      id: 'nav-clips',
      label: strings.palette.actions.clips,
      category: strings.palette.title,
      icon: <FolderHeart className="w-4 h-4 text-emerald-400" />,
      action: () => onNavigateView('clips')
    },
    {
      id: 'act-tour',
      label: strings.palette.actions.tour,
      category: strings.palette.title,
      icon: <HelpCircle className="w-4 h-4 text-amber-accent" />,
      action: onStartTour
    },
    // Languages section
    ...locales.map(loc => ({
      id: `lang-${loc.code}`,
      label: `${loc.flag} ${loc.nativeLabel} (${loc.label})`,
      category: strings.palette.languageSection,
      icon: <Globe className="w-4 h-4 text-amber-accent" />,
      action: () => setLocale(loc.code as SupportedLocale)
    }))
  ];

  const filtered = allCommands.filter(c => 
    c.label.toLowerCase().includes(query.toLowerCase()) ||
    c.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, filtered.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].action();
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden flex items-start justify-center pt-20 px-4">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-obsidian-950/80 backdrop-blur-sm animate-in fade-in duration-150"
      />

      {/* Palette Card */}
      <div 
        onKeyDown={handleKeyDown}
        className="relative w-full max-w-xl rounded-2xl bg-obsidian-900 border border-zinc-800 shadow-2xl overflow-hidden flex flex-col backdrop-blur-xl animate-in zoom-in-95 duration-150 z-10"
      >
        {/* Search Header */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-zinc-800/80">
          <Search className="w-5 h-5 text-amber-accent shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder={strings.palette.placeholder}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className="flex-1 bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[10px] font-mono text-zinc-400">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div 
          ref={listRef}
          className="max-h-80 overflow-y-auto p-2 divide-y divide-zinc-800/40 select-none"
        >
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-500">
              "{query}"
            </div>
          ) : (
            filtered.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    item.action();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                    isSelected 
                      ? 'bg-amber-500/10 text-white border border-amber-500/30' 
                      : 'text-zinc-300 hover:bg-zinc-800/50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-zinc-800/80">
                      {item.icon}
                    </div>
                    <span className="text-xs sm:text-sm font-medium">
                      {item.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-500 font-medium">
                      {item.category}
                    </span>
                    {item.shortcut && (
                      <kbd className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 font-mono text-[10px] text-amber-glow font-bold">
                        {item.shortcut}
                      </kbd>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2.5 bg-obsidian-950/80 border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-500">
          <div className="flex items-center gap-3">
            <span>{strings.palette.navigateGuide}</span>
            <span>•</span>
            <span>{strings.palette.executeGuide}</span>
          </div>
          <span className="font-mono text-zinc-400">{strings.palette.title}</span>
        </div>

      </div>
    </div>
  );
};
