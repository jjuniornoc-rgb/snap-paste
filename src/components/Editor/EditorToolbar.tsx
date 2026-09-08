import React from 'react';
import { 
  Pencil, 
  Highlighter, 
  ArrowUpRight, 
  Square, 
  Circle, 
  Type, 
  EyeOff, 
  ListOrdered, 
  Crop, 
  RotateCw, 
  FlipHorizontal, 
  Undo2, 
  Redo2, 
  Trash2,
  ZoomIn,
  ZoomOut,
  Check,
  X,
  Search,
  Ruler,
  MessageSquare,
  Frame
} from 'lucide-react';
import { useI18n } from '../../i18n';

export type ToolType = 
  | 'brush' 
  | 'highlighter' 
  | 'arrow' 
  | 'rectangle' 
  | 'circle' 
  | 'text' 
  | 'censor' 
  | 'step' 
  | 'magnifier'
  | 'dimension'
  | 'callout'
  | 'crop';

export type CropAspect = 'free' | '1:1' | '16:9' | '4:3' | '9:16' | '3:2';

interface EditorToolbarProps {
  currentTool: ToolType;
  setCurrentTool: (t: ToolType) => void;
  currentColor: string;
  setCurrentColor: (c: string) => void;
  strokeWidth: number;
  setStrokeWidth: (w: number) => void;
  filled: boolean;
  setFilled: (f: boolean) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onRotate: () => void;
  onFlipH: () => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  cropAspect: CropAspect;
  setCropAspect: (a: CropAspect) => void;
  onApplyCrop: () => void;
  onCancelCrop: () => void;
  onOpenFrameModal?: () => void;
}

const COLOR_PALETTE = [
  { name: 'Âmbar', hex: '#f59e0b' },
  { name: 'Esmeralda', hex: '#10b981' },
  { name: 'Carmim', hex: '#ef4444' },
  { name: 'Branco', hex: '#ffffff' },
  { name: 'Preto', hex: '#18181b' },
  { name: 'Teal', hex: '#14b8a6' },
];

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  currentTool,
  setCurrentTool,
  currentColor,
  setCurrentColor,
  strokeWidth,
  setStrokeWidth,
  filled,
  setFilled,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onClear,
  onRotate,
  onFlipH,
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  cropAspect,
  setCropAspect,
  onApplyCrop,
  onCancelCrop,
  onOpenFrameModal
}) => {
  const { strings } = useI18n();

  const ASPECT_RATIOS: { id: CropAspect; label: string }[] = [
    { id: 'free', label: strings.editor.crop.free },
    { id: '1:1', label: '1:1' },
    { id: '16:9', label: '16:9' },
    { id: '4:3', label: '4:3' },
    { id: '9:16', label: '9:16' },
    { id: '3:2', label: '3:2' },
  ];

  const tools = [
    { id: 'brush' as ToolType, label: strings.editor.tools.brush, icon: Pencil, kbd: 'P' },
    { id: 'highlighter' as ToolType, label: strings.editor.tools.highlighter, icon: Highlighter, kbd: 'H' },
    { id: 'arrow' as ToolType, label: strings.editor.tools.arrow, icon: ArrowUpRight, kbd: 'A' },
    { id: 'rectangle' as ToolType, label: strings.editor.tools.rectangle, icon: Square, kbd: 'R' },
    { id: 'circle' as ToolType, label: strings.editor.tools.circle, icon: Circle, kbd: 'C' },
    { id: 'text' as ToolType, label: strings.editor.tools.text, icon: Type, kbd: 'T' },
    { id: 'censor' as ToolType, label: strings.editor.tools.censor, icon: EyeOff, kbd: 'B' },
    { id: 'step' as ToolType, label: strings.editor.tools.step, icon: ListOrdered, kbd: 'N' },
    { id: 'magnifier' as ToolType, label: strings.editor.tools.magnifier, icon: Search, kbd: 'M' },
    { id: 'dimension' as ToolType, label: strings.editor.tools.dimension, icon: Ruler, kbd: 'D' },
    { id: 'callout' as ToolType, label: strings.editor.tools.callout, icon: MessageSquare, kbd: 'Q' },
    { id: 'crop' as ToolType, label: strings.editor.tools.crop, icon: Crop, kbd: 'X' },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-3 sm:px-4 py-2 bg-obsidian-900/95 border-b border-zinc-800/80 backdrop-blur-md select-none w-full max-w-full overflow-hidden">
      
      {/* Left Group: Tools Palette */}
      <div data-tour="editor-tools-group" className="flex items-center gap-1 overflow-x-auto py-0.5 max-w-full">
        {tools.map((t) => {
          const Icon = t.icon;
          const isActive = currentTool === t.id;
          const tourAttr = 
            t.id === 'censor' ? 'tool-censor' :
            t.id === 'step' ? 'tool-step' :
            t.id === 'text' ? 'tool-text' :
            t.id === 'crop' ? 'tool-crop' : undefined;

          return (
            <button
              key={t.id}
              data-tour={tourAttr}
              onClick={() => setCurrentTool(t.id)}
              className={`relative flex items-center justify-center p-2 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'bg-amber-accent text-obsidian-950 font-bold shadow-md shadow-amber-500/20 scale-105'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
              title={`${t.label} (Tecla ${t.kbd})`}
            >
              <Icon className="w-4 h-4" />
              {t.id === 'censor' && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-accent animate-pulse" />
              )}
            </button>
          );
        })}
      </div>

      {/* Middle Group: Dynamic context (Crop Controls vs Annotation Colors) */}
      {currentTool === 'crop' ? (
        <div className="flex items-center gap-2 animate-in fade-in duration-150">
          <div className="flex items-center gap-1 px-2 py-1 bg-obsidian-950/80 border border-zinc-800 rounded-xl">
            <span className="text-[11px] text-zinc-500 font-medium px-1">Proporção:</span>
            {ASPECT_RATIOS.map((ratio) => (
              <button
                key={ratio.id}
                onClick={() => setCropAspect(ratio.id)}
                className={`px-2 py-0.5 rounded-lg text-xs font-mono font-bold transition-all ${
                  cropAspect === ratio.id
                    ? 'bg-amber-accent text-obsidian-950 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                }`}
              >
                {ratio.label}
              </button>
            ))}
          </div>

          <button
            onClick={onApplyCrop}
            className="flex items-center gap-1 px-3 py-1 rounded-xl bg-amber-accent hover:bg-amber-glow text-obsidian-950 font-bold text-xs shadow-md transition-all active:scale-95"
            title={`${strings.editor.crop.apply} (Enter)`}
          >
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{strings.editor.crop.apply}</span>
          </button>

          <button
            onClick={onCancelCrop}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 text-xs transition-colors"
            title={`${strings.editor.crop.cancel} (Esc)`}
          >
            <X className="w-3.5 h-3.5" />
            <span>{strings.editor.crop.cancel}</span>
          </button>
        </div>
      ) : (
        <div data-tour="editor-palette" className="flex items-center gap-3">
          {/* Colors */}
          <div className="flex items-center gap-1.5 px-2 py-1 bg-obsidian-950/80 border border-zinc-800 rounded-xl">
            {COLOR_PALETTE.map((c) => (
              <button
                key={c.hex}
                onClick={() => setCurrentColor(c.hex)}
                className={`w-5 h-5 rounded-full border transition-all ${
                  currentColor === c.hex
                    ? 'border-white scale-125 shadow-sm'
                    : 'border-transparent hover:scale-110 opacity-70 hover:opacity-100'
                }`}
                style={{ backgroundColor: c.hex }}
                title={c.name}
              />
            ))}
          </div>

          {/* Stroke Width Selector */}
          <div className="hidden sm:flex items-center gap-1 bg-obsidian-950/80 border border-zinc-800 px-2 py-1 rounded-xl">
            {[2, 4, 8, 14].map((size) => (
              <button
                key={size}
                onClick={() => setStrokeWidth(size)}
                className={`flex items-center justify-center w-6 h-6 rounded-lg transition-all ${
                  strokeWidth === size
                    ? 'bg-zinc-800 text-amber-accent font-bold'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
                title={`Espessura: ${size}px`}
              >
                <div 
                  className="rounded-full bg-current" 
                  style={{ width: Math.min(14, size + 2), height: Math.min(14, size + 2) }} 
                />
              </button>
            ))}
          </div>

          {/* Fill shape toggle */}
          {(currentTool === 'rectangle' || currentTool === 'circle') && (
            <button
              onClick={() => setFilled(!filled)}
              className={`px-2 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                filled
                  ? 'bg-zinc-800 text-amber-accent border-zinc-700'
                  : 'bg-transparent text-zinc-400 border-zinc-800 hover:text-zinc-200'
              }`}
            >
              {filled ? 'Preenchido' : 'Contorno'}
            </button>
          )}
        </div>
      )}

      {/* Right Group: Transforms, History, Zoom */}
      <div className="flex items-center gap-2">
        {/* Transforms */}
        <div className="flex items-center gap-1">
          <button
            onClick={onRotate}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors"
            title="Girar 90°"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            onClick={onFlipH}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors"
            title="Inverter Horizontalmente"
          >
            <FlipHorizontal className="w-4 h-4" />
          </button>
        </div>

        {onOpenFrameModal && (
          <>
            <button
              onClick={onOpenFrameModal}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 transition-all shadow-sm"
              title={strings.editor.frame}
            >
              <Frame className="w-3.5 h-3.5" />
              <span>{strings.editor.frame}</span>
            </button>
            <div className="h-4 w-[1px] bg-zinc-800" />
          </>
        )}

        {/* History: Undo / Redo */}
        <div className="flex items-center gap-1">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            title={strings.editor.undo}
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            title={strings.editor.redo}
          >
            <Redo2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClear}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-zinc-800/60 transition-colors"
            title={strings.editor.clear}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="h-4 w-[1px] bg-zinc-800" />

        {/* Zoom */}
        <div className="hidden md:flex items-center gap-1 text-xs text-zinc-400">
          <button
            onClick={onZoomOut}
            className="p-1 rounded hover:bg-zinc-800 hover:text-zinc-200"
            title="Zoom -"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span 
            onClick={onZoomReset}
            className="font-mono text-[11px] px-1 cursor-pointer hover:text-white"
            title={strings.editor.zoomReset}
          >
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={onZoomIn}
            className="p-1 rounded hover:bg-zinc-800 hover:text-zinc-200"
            title="Zoom +"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

    </div>
  );
};
