import React, { useRef, useState } from 'react';
import { 
  ClipboardPaste, 
  Upload, 
  Camera, 
  Monitor, 
  PenTool, 
  Sparkles, 
  ShieldCheck, 
  EyeOff,
  Zap
} from 'lucide-react';
import { useI18n } from '../i18n';

interface HeroPasteZoneProps {
  onImageSelected: (dataUrl: string, title?: string) => void;
  onOpenWebcam: () => void;
  onStartSketch: () => void;
  onTriggerToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export function generateDemoImage(): string {
  if (typeof document === 'undefined') return '';
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 760;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background - rich dark obsidian
  ctx.fillStyle = '#0c0c10';
  ctx.fillRect(0, 0, 1200, 760);

  // Subtle grid background
  ctx.strokeStyle = '#181822';
  ctx.lineWidth = 1;
  for (let x = 0; x < 1200; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 760);
    ctx.stroke();
  }
  for (let y = 0; y < 760; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1200, y);
    ctx.stroke();
  }

  // App window container
  ctx.fillStyle = '#14141b';
  ctx.strokeStyle = '#272734';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(80, 60, 1040, 640, 16);
  ctx.fill();
  ctx.stroke();

  // Window header bar
  ctx.fillStyle = '#1a1a24';
  ctx.beginPath();
  ctx.roundRect(80, 60, 1040, 52, [16, 16, 0, 0]);
  ctx.fill();
  ctx.stroke();

  // Window dots
  const dots = ['#ef4444', '#f59e0b', '#10b981'];
  dots.forEach((color, idx) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(110 + idx * 22, 86, 6, 0, Math.PI * 2);
    ctx.fill();
  });

  // Window Title
  ctx.fillStyle = '#a1a1aa';
  ctx.font = '600 13px ui-sans-serif, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Analytics Dashboard • Production Live Monitor', 600, 91);

  // Metrics Card 1
  ctx.fillStyle = '#1f1f2c';
  ctx.strokeStyle = '#323246';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(120, 145, 450, 220, 12);
  ctx.fill();
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.fillStyle = '#71717a';
  ctx.font = '500 12px ui-sans-serif, system-ui, sans-serif';
  ctx.fillText('TOTAL REQUESTS (LAST 24H)', 145, 178);

  ctx.fillStyle = '#ffffff';
  ctx.font = '700 36px ui-sans-serif, system-ui, sans-serif';
  ctx.fillText('1,489,240', 145, 230);

  ctx.fillStyle = '#10b981';
  ctx.font = '600 14px ui-sans-serif, system-ui, sans-serif';
  ctx.fillText('↑ 18.4% vs semana anterior', 145, 265);

  // Mini bar chart
  const bars = [35, 52, 68, 45, 80, 95, 110, 75, 120, 140, 130, 155];
  bars.forEach((val, i) => {
    ctx.fillStyle = i === bars.length - 1 ? '#f59e0b' : '#3b3b4f';
    ctx.fillRect(145 + i * 28, 335 - val * 0.45, 18, val * 0.45);
  });

  // Metrics Card 2 - System Status
  ctx.fillStyle = '#1f1f2c';
  ctx.strokeStyle = '#323246';
  ctx.beginPath();
  ctx.roundRect(610, 145, 470, 220, 12);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#71717a';
  ctx.font = '500 12px ui-sans-serif, system-ui, sans-serif';
  ctx.fillText('SYSTEM HEALTH & LATENCY', 635, 178);

  ctx.fillStyle = '#ffffff';
  ctx.font = '700 36px ui-sans-serif, system-ui, sans-serif';
  ctx.fillText('99.98%', 635, 230);

  ctx.fillStyle = '#f59e0b';
  ctx.font = '600 14px ui-sans-serif, system-ui, sans-serif';
  ctx.fillText('P99 Latência: 4.2ms • 0 incidentes', 635, 265);

  // Simulated code terminal card
  ctx.fillStyle = '#111116';
  ctx.strokeStyle = '#272734';
  ctx.beginPath();
  ctx.roundRect(120, 395, 960, 270, 12);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#71717a';
  ctx.font = '12px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
  ctx.fillText('// Terminal Logs & Event Stream', 145, 430);

  const logs = [
    { time: '13:02:14', tag: '[INFO]', msg: 'Ingestion pipeline cluster #04 healthy, consumed 12,400 events', col: '#10b981' },
    { time: '13:02:15', tag: '[HTTP]', msg: 'POST /v2/telemetry/dispatch 200 OK - 2.8ms gzip: true', col: '#e4e4e7' },
    { time: '13:02:18', tag: '[WARN]', msg: 'Cache hit ratio slightly dropped to 94.2% - warming cache keys', col: '#f59e0b' },
    { time: '13:02:22', tag: '[AUTH]', msg: 'Client session token renewed successfully for tenant_89f', col: '#38bdf8' },
    { time: '13:02:25', tag: '[SNAP]', msg: 'IndexedDB persistent storage snapshot synced cleanly', col: '#a78bfa' }
  ];

  logs.forEach((item, idx) => {
    const y = 465 + idx * 36;
    ctx.fillStyle = '#52525b';
    ctx.fillText(item.time, 145, y);
    ctx.fillStyle = item.col;
    ctx.fillText(item.tag, 220, y);
    ctx.fillStyle = '#d4d4d8';
    ctx.fillText(item.msg, 285, y);
  });

  return canvas.toDataURL('image/png');
}

export const HeroPasteZone: React.FC<HeroPasteZoneProps> = ({
  onImageSelected,
  onOpenWebcam,
  onStartSketch,
  onTriggerToast
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const dragCounterRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const { strings, t } = useI18n();

  // Handle Drag & Drop events
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current <= 0) {
      setIsDragging(false);
      dragCounterRef.current = 0;
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounterRef.current = 0;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      onTriggerToast('Por favor, selecione um arquivo de imagem válido (PNG, JPG, WEBP, etc.)', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        onImageSelected(event.target.result, file.name);
        onTriggerToast('Imagem carregada com sucesso!', 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  // Clipboard button click
  const handleClipboardClick = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.read) {
        const items = await navigator.clipboard.read();
        for (const item of items) {
          const imageType = item.types.find(t => t.startsWith('image/'));
          if (imageType) {
            const blob = await item.getType(imageType);
            const reader = new FileReader();
            reader.onload = () => {
              if (typeof reader.result === 'string') {
                onImageSelected(reader.result, 'Clipboard Imagem');
                onTriggerToast('Imagem colada do clipboard!', 'success');
              }
            };
            reader.readAsDataURL(blob);
            return;
          }
        }
        onTriggerToast('Nenhuma imagem encontrada na área de transferência. Use Ctrl+V após tirar print!', 'info');
      } else {
        onTriggerToast('Pressione Ctrl+V no teclado para colar a imagem diretamente!', 'info');
      }
    } catch (err) {
      console.warn('Clipboard read error:', err);
      onTriggerToast('Para colar, basta pressionar ' + (isMac ? '⌘ + V' : 'Ctrl + V') + ' no teclado.', 'info');
    }
  };

  // Native Screen / Window Capture
  const handleScreenCapture = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        onTriggerToast('Captura de tela não suportada neste navegador.', 'error');
        return;
      }

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: 'monitor' },
        audio: false
      });

      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();

      video.onloadedmetadata = () => {
        // Wait a small delay to capture crisp frame
        setTimeout(() => {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/png');
            
            // Stop tracks
            stream.getTracks().forEach(t => t.stop());
            
            onImageSelected(dataUrl, `Screenshot ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
            onTriggerToast('Captura de tela realizada!', 'success');
          }
        }, 300);
      };
    } catch (err: any) {
      if (err.name !== 'NotAllowedError') {
        console.error('Screen capture error:', err);
        onTriggerToast('Erro ao capturar tela: ' + err.message, 'error');
      }
    }
  };

  // Demo image generator
  const handleLoadDemo = () => {
    const url = generateDemoImage();
    if (url) {
      onImageSelected(url, 'Exemplo de Demonstração');
      onTriggerToast('Imagem de demonstração aberta no editor!', 'success');
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 sm:py-12 flex flex-col items-center">
      
      {/* Hero Header */}
      <div className="text-center max-w-2xl mb-8 space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-glow text-xs font-semibold uppercase tracking-wider">
          <Zap className="w-3.5 h-3.5 text-amber-accent" />
          <span>{strings.hero.badge}</span>
        </div>
        
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
          {strings.hero.title}
        </h1>
        
        <p className="text-sm sm:text-base text-zinc-400 font-normal">
          {strings.hero.subtitle}
        </p>
      </div>

      {/* Main Interactive Dropzone Card */}
      <div
        data-tour="dropzone"
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative w-full rounded-2xl border-2 transition-all duration-300 p-8 sm:p-14 flex flex-col items-center justify-center cursor-pointer select-none bg-obsidian-900/90 backdrop-blur-xl shadow-2xl ${
          isDragging
            ? 'border-amber-accent animate-drag-pulse scale-[1.01] bg-amber-500/5'
            : 'border-zinc-800 hover:border-zinc-700/80 hover:bg-obsidian-850'
        }`}
        onClick={handleClipboardClick}
      >
        {/* Ambient Subtle Amber Glow in Background */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-amber-500/5 via-transparent to-transparent pointer-events-none" />

        {/* Central Keycap Presentation */}
        <div className="flex flex-col items-center gap-5 z-10">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-obsidian-950 border border-zinc-700/90 px-6 py-4 rounded-2xl shadow-xl shadow-black/60 group-hover:scale-105 transition-transform">
              <span className="font-mono text-xl sm:text-3xl font-black tracking-tight text-zinc-300">
                {isMac ? 'COMMAND' : 'CTRL'}
              </span>
              <span className="text-zinc-600 text-2xl font-light">+</span>
              <span className="font-mono text-2xl sm:text-4xl font-black text-amber-accent bg-amber-500/10 px-3 py-1 rounded-xl border border-amber-500/20">
                V
              </span>
            </div>
          </div>

          <div className="text-center space-y-1.5">
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              {t('hero.pressKey', { key: isMac ? '⌘ + V' : 'Ctrl + V' })}
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400">
              {strings.hero.orDrag}
            </p>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClipboardClick();
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-accent hover:bg-amber-glow text-obsidian-950 font-bold text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <ClipboardPaste className="w-4 h-4 text-obsidian-950" />
              <span>{strings.hero.pasteClipboard}</span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 font-medium text-xs sm:text-sm border border-zinc-700/60 transition-all"
            >
              <Upload className="w-4 h-4 text-zinc-300" />
              <span>{strings.hero.browseFile}</span>
            </button>
          </div>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              processFile(e.target.files[0]);
            }
          }}
        />
      </div>

      {/* Alternative Capture Modes Grid */}
      <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
        
        {/* Screen / Window Capture */}
        <button
          data-tour="capture-tools"
          onClick={handleScreenCapture}
          className="flex flex-col items-center justify-center p-4 rounded-xl bg-obsidian-900 border border-zinc-800/90 hover:border-amber-500/40 hover:bg-zinc-900/70 transition-all text-center group"
        >
          <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center mb-2.5 group-hover:bg-amber-500/10 group-hover:text-amber-accent transition-colors text-zinc-400">
            <Monitor className="w-5 h-5" />
          </div>
          <span className="text-xs sm:text-sm font-semibold text-zinc-200 group-hover:text-white">
            {strings.hero.captureScreen}
          </span>
          <span className="text-[11px] text-zinc-400 mt-0.5">
            {strings.hero.captureScreenSub}
          </span>
        </button>

        {/* Webcam Capture */}
        <button
          onClick={onOpenWebcam}
          className="flex flex-col items-center justify-center p-4 rounded-xl bg-obsidian-900 border border-zinc-800/90 hover:border-amber-500/40 hover:bg-zinc-900/70 transition-all text-center group"
        >
          <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center mb-2.5 group-hover:bg-amber-500/10 group-hover:text-amber-accent transition-colors text-zinc-400">
            <Camera className="w-5 h-5" />
          </div>
          <span className="text-xs sm:text-sm font-semibold text-zinc-200 group-hover:text-white">
            {strings.hero.takePhoto}
          </span>
          <span className="text-[11px] text-zinc-400 mt-0.5">
            {strings.hero.takePhotoSub}
          </span>
        </button>

        {/* Just Sketch */}
        <button
          data-tour="just-sketch"
          onClick={onStartSketch}
          className="flex flex-col items-center justify-center p-4 rounded-xl bg-obsidian-900 border border-zinc-800/90 hover:border-amber-500/40 hover:bg-zinc-900/70 transition-all text-center group"
        >
          <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center mb-2.5 group-hover:bg-amber-500/10 group-hover:text-amber-accent transition-colors text-zinc-400">
            <PenTool className="w-5 h-5" />
          </div>
          <span className="text-xs sm:text-sm font-semibold text-zinc-200 group-hover:text-white">
            {strings.hero.justSketch}
          </span>
          <span className="text-[11px] text-zinc-400 mt-0.5">
            {strings.hero.justSketchSub}
          </span>
        </button>

        {/* Demo Example */}
        <button
          onClick={handleLoadDemo}
          className="flex flex-col items-center justify-center p-4 rounded-xl bg-obsidian-900 border border-zinc-800/90 hover:border-amber-500/40 hover:bg-zinc-900/70 transition-all text-center group"
        >
          <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center mb-2.5 group-hover:bg-amber-500/10 group-hover:text-amber-accent transition-colors text-zinc-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="text-xs sm:text-sm font-semibold text-zinc-200 group-hover:text-white">
            {strings.hero.sampleDemo}
          </span>
          <span className="text-[11px] text-zinc-400 mt-0.5">
            {strings.hero.sampleDemoSub}
          </span>
        </button>
      </div>

      {/* Modern Features Grid */}
      <div className="w-full mt-14 pt-10 border-t border-zinc-800/60 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
        <div className="p-4 rounded-xl bg-obsidian-900/50 border border-zinc-800/50 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 mt-0.5">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">{strings.hero.privacyCard1Title}</h3>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              {strings.hero.privacyCard1Desc}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-obsidian-900/50 border border-zinc-800/50 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-accent mt-0.5">
            <EyeOff className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">{strings.hero.privacyCard2Title}</h3>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              {strings.hero.privacyCard2Desc}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-obsidian-900/50 border border-zinc-800/50 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-accent mt-0.5">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">{strings.hero.privacyCard3Title}</h3>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              {strings.hero.privacyCard3Desc}
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};
