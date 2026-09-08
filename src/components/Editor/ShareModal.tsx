import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  X, 
  Copy, 
  Check, 
  Download, 
  Printer, 
  Share2, 
  QrCode, 
  Lock 
} from 'lucide-react';
import { useI18n } from '../../i18n';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageDataUrl: string;
  imageTitle: string;
  onTriggerToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  imageDataUrl,
  imageTitle,
  onTriggerToast
}) => {
  const { strings } = useI18n();
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [exportFormat, setExportFormat] = useState<'png' | 'jpeg' | 'webp'>('png');

  if (!isOpen) return null;

  // Generate unique secret short link
  const clipId = 'cv_' + Math.random().toString(36).substring(2, 9);
  const shareUrl = `${window.location.origin}/#share=${clipId}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      
      // Fire subtle celebratory confetti
      confetti({
        particleCount: 35,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#f59e0b', '#fbbf24', '#10b981', '#ea580c']
      });

      setTimeout(() => setCopiedLink(false), 2500);
      onTriggerToast('Link de compartilhamento copiado!', 'success');
    } catch {
      onTriggerToast('Erro ao copiar link.', 'error');
    }
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    if (exportFormat === 'png') {
      a.href = imageDataUrl;
      a.download = `${imageTitle.replace(/\s+/g, '_').toLowerCase()}.png`;
      a.click();
    } else {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = img.width;
        c.height = img.height;
        const ctx = c.getContext('2d');
        if (ctx) {
          if (exportFormat === 'jpeg') {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, c.width, c.height);
          }
          ctx.drawImage(img, 0, 0);
          a.href = c.toDataURL(`image/${exportFormat}`, 0.92);
          a.download = `${imageTitle.replace(/\s+/g, '_').toLowerCase()}.${exportFormat}`;
          a.click();
        }
      };
      img.src = imageDataUrl;
    }
    onTriggerToast(`Download em formato ${exportFormat.toUpperCase()} iniciado.`, 'success');
  };

  const handlePrint = () => {
    const win = window.open('');
    if (win) {
      win.document.write(`
        <html>
          <head>
            <title>${imageTitle}</title>
            <style>
              body { margin: 0; display: flex; align-items: center; justify-content: center; height: 100vh; background: #fff; }
              img { max-width: 100%; max-height: 100%; object-fit: contain; }
            </style>
          </head>
          <body>
            <img src="${imageDataUrl}" onload="window.print(); window.close();" />
          </body>
        </html>
      `);
      win.document.close();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-obsidian-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-obsidian-950/60">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Share2 className="w-4 h-4 text-amber-accent" />
            <span>{strings.editor.share}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title={strings.common.close}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          
          {/* Preview Thumbnail */}
          <div className="w-full h-32 bg-obsidian-950 border border-zinc-800/90 rounded-xl overflow-hidden flex items-center justify-center p-2">
            <img
              src={imageDataUrl}
              alt="Preview"
              className="w-full h-full object-contain rounded-lg"
            />
          </div>

          {/* Share Link Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
              <span>{strings.editor.share}</span>
              <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                <Lock className="w-3 h-3" /> 100% Client-Side
              </span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 bg-obsidian-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs font-mono text-zinc-300 select-all focus:outline-none focus:border-amber-accent/80"
              />
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-accent hover:bg-amber-glow text-obsidian-950 font-bold text-xs shadow-md transition-all active:scale-95"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-4 h-4 text-obsidian-950" />
                    <span>{strings.common.copied}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>{strings.common.copy}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Actions Row: QR Code, Print, Download */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => setShowQR(!showQR)}
              className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs font-medium text-zinc-200 transition-colors"
            >
              <QrCode className="w-4 h-4 text-amber-accent" />
              <span>QR Code</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs font-medium text-zinc-200 transition-colors"
            >
              <Printer className="w-4 h-4 text-zinc-400" />
              <span>Print</span>
            </button>
          </div>

          {/* QR Code Presentation if toggled */}
          {showQR && (
            <div className="p-4 rounded-xl bg-white flex flex-col items-center justify-center animate-in zoom-in-95 duration-200">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(shareUrl)}`}
                alt="QR Code"
                className="w-36 h-36"
              />
              <span className="text-[11px] font-mono text-zinc-700 mt-2">
                Scan with phone camera
              </span>
            </div>
          )}

          {/* Export Format & Download */}
          <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-zinc-400">Format:</span>
              {(['png', 'jpeg', 'webp'] as const).map(fmt => (
                <button
                  key={fmt}
                  onClick={() => setExportFormat(fmt)}
                  className={`px-2 py-1 rounded-lg text-xs font-mono font-bold uppercase transition-colors ${
                    exportFormat === fmt
                      ? 'bg-zinc-800 text-amber-accent border border-zinc-700'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>

            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white border border-zinc-700 transition-all"
            >
              <Download className="w-3.5 h-3.5 text-zinc-300" />
              <span>{strings.editor.download}</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
