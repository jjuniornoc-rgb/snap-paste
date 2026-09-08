import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, 
  Copy, 
  Download, 
  Check, 
  Sparkles, 
  CheckSquare, 
  Square,
  Maximize2
} from 'lucide-react';

export type FrameGradient = 'amber' | 'obsidian' | 'sunset' | 'emerald' | 'transparent';

interface FrameModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceCanvas: HTMLCanvasElement | null;
  title: string;
  onApplyToCanvas?: (dataUrl: string) => void;
  onTriggerToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

const GRADIENT_PRESETS: { id: FrameGradient; label: string; colors: string[]; style: string }[] = [
  {
    id: 'amber',
    label: 'Amber Glow',
    colors: ['#18120c', '#331e07', '#f59e0b'],
    style: 'linear-gradient(135deg, #18120c 0%, #331e07 50%, #b45309 100%)'
  },
  {
    id: 'obsidian',
    label: 'Deep Obsidian',
    colors: ['#09090c', '#15151e', '#272738'],
    style: 'linear-gradient(135deg, #09090c 0%, #15151e 50%, #272738 100%)'
  },
  {
    id: 'sunset',
    label: 'Sunset Velvet',
    colors: ['#240d16', '#4a1525', '#b45309'],
    style: 'linear-gradient(135deg, #240d16 0%, #4a1525 50%, #b45309 100%)'
  },
  {
    id: 'emerald',
    label: 'Emerald Matrix',
    colors: ['#061712', '#0d382b', '#10b981'],
    style: 'linear-gradient(135deg, #061712 0%, #0d382b 50%, #059669 100%)'
  },
  {
    id: 'transparent',
    label: 'Transparente (PNG)',
    colors: ['transparent', 'transparent'],
    style: 'repeating-conic-gradient(#18181b 0% 25%, #27272a 0% 50%) 50% / 16px 16px'
  }
];

export const FrameModal: React.FC<FrameModalProps> = ({
  isOpen,
  onClose,
  sourceCanvas,
  title,
  onApplyToCanvas,
  onTriggerToast
}) => {
  const [gradient, setGradient] = useState<FrameGradient>('amber');
  const [padding, setPadding] = useState<number>(48);
  const [borderRadius, setBorderRadius] = useState<number>(16);
  const [showWindowBar, setShowWindowBar] = useState<boolean>(true);
  const [shadowLevel, setShadowLevel] = useState<'soft' | 'dramatic' | 'none'>('dramatic');
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // Render composite framed image
  const renderFrame = useCallback(() => {
    if (!sourceCanvas) return;
    const canvas = previewCanvasRef.current;
    if (!canvas) return;

    const srcW = sourceCanvas.width;
    const srcH = sourceCanvas.height;

    const windowBarH = showWindowBar ? 42 : 0;
    const totalW = srcW + padding * 2;
    const totalH = srcH + padding * 2 + windowBarH;

    canvas.width = totalW;
    canvas.height = totalH;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, totalW, totalH);

    // 1. Draw Background Gradient if not transparent
    if (gradient !== 'transparent') {
      const grad = ctx.createLinearGradient(0, 0, totalW, totalH);
      const preset = GRADIENT_PRESETS.find(p => p.id === gradient);
      if (preset && preset.colors.length >= 2) {
        if (preset.colors.length === 3) {
          grad.addColorStop(0, preset.colors[0]);
          grad.addColorStop(0.5, preset.colors[1]);
          grad.addColorStop(1, preset.colors[2]);
        } else {
          grad.addColorStop(0, preset.colors[0]);
          grad.addColorStop(1, preset.colors[1]);
        }
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, totalW, totalH);
      }
    }

    // 2. Window geometry
    const winX = padding;
    const winY = padding;
    const winW = srcW;
    const winH = srcH + windowBarH;

    // 3. Draw realistic drop shadow
    if (shadowLevel !== 'none') {
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.70)';
      ctx.shadowBlur = shadowLevel === 'dramatic' ? 45 : 20;
      ctx.shadowOffsetY = shadowLevel === 'dramatic' ? 22 : 10;
      ctx.fillStyle = '#14141b';
      ctx.beginPath();
      ctx.roundRect(winX, winY, winW, winH, borderRadius);
      ctx.fill();
      ctx.restore();
    }

    // 4. Clip window content with rounded corners
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(winX, winY, winW, winH, borderRadius);
    ctx.clip();

    // 5. Window header bar (macOS style)
    if (showWindowBar) {
      ctx.fillStyle = '#181822';
      ctx.fillRect(winX, winY, winW, windowBarH);

      // Window dots
      const dots = ['#ef4444', '#f59e0b', '#10b981'];
      dots.forEach((color, idx) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(winX + 18 + idx * 18, winY + windowBarH / 2, 5.5, 0, Math.PI * 2);
        ctx.fill();
      });

      // Window title
      ctx.fillStyle = '#a1a1aa';
      ctx.font = '600 12px ui-sans-serif, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(title || 'Captura de Tela', winX + winW / 2, winY + windowBarH / 2 + 4);
    }

    // 6. Draw source image
    ctx.drawImage(sourceCanvas, winX, winY + windowBarH, srcW, srcH);

    // 7. Subtle window inner stroke
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(winX, winY, winW, winH, borderRadius);
    ctx.stroke();

    ctx.restore();
  }, [sourceCanvas, gradient, padding, borderRadius, showWindowBar, shadowLevel, title]);

  useEffect(() => {
    if (isOpen) {
      renderFrame();
    }
  }, [isOpen, renderFrame]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        setCopiedSuccess(true);
        onTriggerToast('Imagem emoldurada copiada para a área de transferência!', 'success');
        setTimeout(() => setCopiedSuccess(false), 2500);
      });
    } catch {
      onTriggerToast('Erro ao copiar imagem.', 'error');
    }
  };

  const handleDownload = () => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `${(title || 'captura').replace(/\s+/g, '_').toLowerCase()}_moldura.png`;
    a.click();
    onTriggerToast('Download da imagem emoldurada concluído.', 'success');
  };

  const handleApplyToCanvas = () => {
    const canvas = previewCanvasRef.current;
    if (!canvas || !onApplyToCanvas) return;
    onApplyToCanvas(canvas.toDataURL('image/png'));
    onTriggerToast('Moldura aplicada ao editor!', 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9995] overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-obsidian-950/85 backdrop-blur-md animate-in fade-in duration-200"
      />

      {/* Main Modal Card */}
      <div className="relative w-full max-w-5xl rounded-2xl bg-obsidian-900 border border-zinc-800 shadow-2xl overflow-hidden flex flex-col z-10 animate-in zoom-in-95 duration-200 my-6">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-obsidian-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-accent">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Moldura de Apresentação</h3>
              <p className="text-xs text-zinc-400">Estilize seu print com gradientes, cantos arredondados e barra de janela (Estilo Xnapper / CleanShot)</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Controls & Live Preview */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Controls Column */}
          <div className="space-y-5">
            
            {/* 1. Gradient Preset */}
            <div>
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block mb-2">
                Fundo & Gradiente
              </label>
              <div className="grid grid-cols-2 gap-2">
                {GRADIENT_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => setGradient(preset.id)}
                    className={`flex items-center gap-2.5 p-2 rounded-xl border text-xs font-semibold transition-all ${
                      gradient === preset.id
                        ? 'border-amber-accent bg-amber-500/10 text-white shadow-sm'
                        : 'border-zinc-800 bg-obsidian-950/80 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                    }`}
                  >
                    <div 
                      className="w-5 h-5 rounded-lg border border-white/20 shrink-0" 
                      style={{ background: preset.style }}
                    />
                    <span className="truncate">{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Padding Size */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  Espaçamento / Padding
                </label>
                <span className="text-xs font-mono text-amber-accent font-bold">{padding}px</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[16, 32, 48, 80].map((val) => (
                  <button
                    key={val}
                    onClick={() => setPadding(val)}
                    className={`py-1.5 rounded-lg text-xs font-mono font-bold border transition-all ${
                      padding === val
                        ? 'bg-amber-accent text-obsidian-950 border-amber-accent shadow-sm'
                        : 'bg-obsidian-950 text-zinc-400 border-zinc-800 hover:text-white'
                    }`}
                  >
                    {val}px
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Border Radius */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  Cantos Arredondados
                </label>
                <span className="text-xs font-mono text-amber-accent font-bold">{borderRadius}px</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[0, 12, 18, 26].map((val) => (
                  <button
                    key={val}
                    onClick={() => setBorderRadius(val)}
                    className={`py-1.5 rounded-lg text-xs font-mono font-bold border transition-all ${
                      borderRadius === val
                        ? 'bg-amber-accent text-obsidian-950 border-amber-accent shadow-sm'
                        : 'bg-obsidian-950 text-zinc-400 border-zinc-800 hover:text-white'
                    }`}
                  >
                    {val}px
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Window Header & Shadow Toggles */}
            <div className="space-y-3 pt-2 border-t border-zinc-800">
              <button
                onClick={() => setShowWindowBar(!showWindowBar)}
                className="flex items-center justify-between w-full p-2.5 rounded-xl bg-obsidian-950 border border-zinc-800 hover:border-zinc-700 text-xs font-medium text-zinc-300"
              >
                <span>Barra de Janela estilo Mac</span>
                {showWindowBar ? (
                  <CheckSquare className="w-4 h-4 text-amber-accent" />
                ) : (
                  <Square className="w-4 h-4 text-zinc-500" />
                )}
              </button>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-obsidian-950 border border-zinc-800 text-xs">
                <span className="font-medium text-zinc-300">Sombra 3D</span>
                <div className="flex items-center gap-1">
                  {(['none', 'soft', 'dramatic'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setShadowLevel(s)}
                      className={`px-2 py-1 rounded-md text-[11px] font-semibold uppercase ${
                        shadowLevel === s
                          ? 'bg-zinc-800 text-amber-accent'
                          : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      {s === 'none' ? 'Sem' : s === 'soft' ? 'Suave' : 'Forte'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* Live Preview Column */}
          <div className="lg:col-span-2 flex flex-col items-center justify-center p-4 rounded-xl bg-obsidian-950 border border-zinc-800/80 min-h-[360px] overflow-hidden">
            <div className="relative max-h-[460px] max-w-full overflow-auto flex items-center justify-center p-2">
              <canvas
                ref={previewCanvasRef}
                className="max-h-[440px] max-w-full object-contain rounded-lg shadow-xl"
              />
            </div>
            <span className="text-[11px] text-zinc-500 mt-2 flex items-center gap-1">
              <Maximize2 className="w-3 h-3" />
              Prévia com dimensões automáticas proporcionais
            </span>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-zinc-800 bg-obsidian-950 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            Cancelar
          </button>

          <div className="flex items-center gap-2">
            {onApplyToCanvas && (
              <button
                onClick={handleApplyToCanvas}
                className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition-all border border-zinc-700"
              >
                Aplicar ao Canvas
              </button>
            )}

            <button
              onClick={handleDownload}
              className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition-all border border-zinc-700 flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar PNG</span>
            </button>

            <button
              onClick={handleCopy}
              className="px-4 py-2 rounded-xl bg-amber-accent hover:bg-amber-glow text-obsidian-950 text-xs font-bold shadow-md shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-1.5"
            >
              {copiedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-obsidian-950" />
                  <span>Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Imagem</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
