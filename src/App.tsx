import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { HeroPasteZone, generateDemoImage } from './components/HeroPasteZone';
import { WebcamModal } from './components/WebcamModal';
import { ClipsGallery } from './components/ClipsGallery';
import { ImageEditor } from './components/Editor/ImageEditor';
import { CookieBanner } from './components/CookieBanner';
import { OnboardingTour } from './components/OnboardingTour';
import { CommandPalette } from './components/CommandPalette';
import { ToolType } from './components/Editor/EditorToolbar';
import { getClips, ClipItem } from './lib/storage';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useI18n } from './i18n';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error';
}

export const App: React.FC = () => {
  const { strings, t } = useI18n();
  // Navigation View
  const [currentView, setCurrentView] = useState<'home' | 'editor' | 'clips'>(() => {
    if (typeof window === 'undefined') return 'home';
    const params = new URLSearchParams(window.location.search);
    const demo = params.get('demo');
    if (demo === 'crop' || demo === 'text' || demo === 'editor' || demo === 'frame' || demo === 'innovations' || demo === 'tour') {
      return 'editor';
    }
    return 'home';
  });

  // Active image for editor
  const [activeImage, setActiveImage] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    const demo = params.get('demo');
    if (demo === 'crop' || demo === 'text' || demo === 'editor' || demo === 'frame' || demo === 'innovations' || demo === 'tour') {
      return generateDemoImage();
    }
    return null;
  });
  const [activeTitle, setActiveTitle] = useState<string>('Demonstração de Exemplo');

  // Webcam modal
  const [isWebcamOpen, setIsWebcamOpen] = useState(false);

  // Command Palette
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    return params.get('demo') === 'palette';
  });

  // Editor Actions bridge
  const [editorActions, setEditorActions] = useState<{
    selectTool: (t: ToolType) => void;
    openFrameModal: () => void;
    copyImage: () => void;
    saveImage: () => void;
    downloadImage: () => void;
  } | null>(null);

  // Clips state
  const [clips, setClips] = useState<ClipItem[]>([]);

  // Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Cookie Consent & Onboarding Tour states
  const [cookieConsentAccepted, setCookieConsentAccepted] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const params = new URLSearchParams(window.location.search);
    if (params.get('demo') === 'cookies') return false;
    return localStorage.getItem('ctrlvi_cookie_consent') === 'true';
  });

  const [isTourOpen, setIsTourOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    return params.get('demo') === 'tour';
  });

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleGlobalPaletteKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalPaletteKey);
    return () => window.removeEventListener('keydown', handleGlobalPaletteKey);
  }, []);

  // Trigger Toast helper
  const triggerToast = useCallback((message: string, type: 'success' | 'info' | 'error' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  }, []);

  // Fetch local clips from IndexedDB
  const refreshClips = useCallback(async () => {
    try {
      const stored = await getClips();
      setClips(stored);
    } catch (err) {
      console.warn('Erro ao ler clips:', err);
    }
  }, []);

  const handleImageSelected = useCallback((dataUrl: string, title?: string) => {
    setActiveImage(dataUrl);
    if (title) setActiveTitle(title);
    setCurrentView('editor');
  }, []);

  useEffect(() => {
    refreshClips();

    // Auto-load editor demo if ?demo=crop or ?demo=text
    const params = new URLSearchParams(window.location.search);
    const demo = params.get('demo');
    if (demo === 'crop' || demo === 'text' || demo === 'editor' || demo === 'frame' || demo === 'innovations') {
      const demoImg = generateDemoImage();
      if (demoImg) {
        handleImageSelected(demoImg, 'Demonstração de Exemplo');
      }
    }
  }, [refreshClips, handleImageSelected]);

  // Handler for Global Paste (Ctrl+V anywhere in window!)
  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      // If user is currently typing in an input or textarea, don't intercept
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') {
        return;
      }

      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          e.preventDefault();
          const file = items[i].getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
              if (typeof event.target?.result === 'string') {
                handleImageSelected(event.target.result, 'Imagem Colada');
                triggerToast('Imagem colada com sucesso!', 'success');
              }
            };
            reader.readAsDataURL(file);
            return;
          }
        }
      }
    };

    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, [handleImageSelected, triggerToast]);

  // Just Sketch handler (blank canvas)
  const handleStartSketch = useCallback(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Warm dark graphite slate background
      ctx.fillStyle = '#141419';
      ctx.fillRect(0, 0, 1280, 720);

      // Subtle warm dot grid
      ctx.fillStyle = '#272734';
      for (let x = 20; x < 1280; x += 25) {
        for (let y = 20; y < 720; y += 25) {
          ctx.beginPath();
          ctx.arc(x, y, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      handleImageSelected(canvas.toDataURL('image/png'), 'Rascunho em Branco');
      triggerToast('Tela de rascunho em branco pronta para desenhar!', 'info');
    }
  }, [handleImageSelected, triggerToast]);

  // Handle Cookie Accept & Tour Actions
  const handleAcceptCookies = (startTour: boolean = true) => {
    localStorage.setItem('ctrlvi_cookie_consent', 'true');
    setCookieConsentAccepted(true);
    triggerToast('Preferências e armazenamento local salvos!', 'success');

    if (startTour) {
      setIsTourOpen(true);
    } else {
      localStorage.setItem('ctrlvi_tour_done', 'true');
    }
  };

  const handleDismissCookies = () => {
    localStorage.setItem('ctrlvi_cookie_consent', 'true');
    localStorage.setItem('ctrlvi_tour_done', 'true');
    setCookieConsentAccepted(true);
  };

  const handleTourComplete = () => {
    localStorage.setItem('ctrlvi_tour_done', 'true');
    setIsTourOpen(false);
    triggerToast('Tour concluído! Aproveite o SnapPaste.', 'success');
  };

  const handleTourClose = () => {
    localStorage.setItem('ctrlvi_tour_done', 'true');
    setIsTourOpen(false);
  };

  const handleNavigateTourView = useCallback((view: 'home' | 'editor' | 'clips') => {
    if (view === 'editor' && !activeImage) {
      const demoImg = generateDemoImage();
      if (demoImg) {
        setActiveImage(demoImg);
        setActiveTitle('Demonstração Interativa (Tour)');
      }
    }
    setCurrentView(view);
  }, [activeImage]);

  const handleStartManualTour = () => {
    setCurrentView('home');
    setIsTourOpen(true);
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden flex flex-col bg-obsidian-950 text-warm-100 selection:bg-amber-accent/30 selection:text-amber-glow relative">
      
      {/* Navbar */}
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        clipsCount={clips.length}
        onNewSketch={handleStartSketch}
        onStartTour={handleStartManualTour}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
      />

      {/* Main View Area */}
      <main className="flex-1 flex flex-col">
        {currentView === 'home' && (
          <HeroPasteZone
            onImageSelected={handleImageSelected}
            onOpenWebcam={() => setIsWebcamOpen(true)}
            onStartSketch={handleStartSketch}
            onTriggerToast={triggerToast}
          />
        )}

        {currentView === 'clips' && (
          <ClipsGallery
            clips={clips}
            onSelectClip={(clip) => {
              handleImageSelected(clip.dataUrl, clip.title);
            }}
            onRefreshClips={refreshClips}
            onNewClip={() => setCurrentView('home')}
            onTriggerToast={triggerToast}
          />
        )}

        {currentView === 'editor' && activeImage && (
          <ImageEditor
            initialImage={activeImage}
            initialTitle={activeTitle}
            onBack={() => setCurrentView('home')}
            onTriggerToast={triggerToast}
            onSavedToClips={refreshClips}
            onRegisterEditorActions={setEditorActions}
          />
        )}
      </main>

      {/* Footer (only on Home and Clips views) */}
      {currentView !== 'editor' && (
        <footer className="w-full border-t border-zinc-800/80 bg-obsidian-950 py-6 text-center text-xs text-zinc-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-zinc-400 font-bold">SNAPPASTE</span>
              <span>• {strings.common.tagline}</span>
            </div>
            <div className="flex items-center gap-4 text-zinc-400">
              <button 
                onClick={handleStartSketch}
                className="hover:text-amber-accent transition-colors"
              >
                Just Sketch
              </button>
              <span>•</span>
              <button 
                onClick={handleStartManualTour}
                className="hover:text-amber-accent transition-colors"
              >
                {strings.nav.tour}
              </button>
              <span>•</span>
              <button 
                onClick={() => setCurrentView('clips')}
                className="hover:text-amber-accent transition-colors"
              >
                {strings.nav.myClips}
              </button>
              <span>•</span>
              <span>100% Client-Side</span>
            </div>
          </div>
        </footer>
      )}

      {/* Onboarding Tour */}
      <OnboardingTour
        isOpen={isTourOpen}
        currentView={currentView}
        onNavigateView={handleNavigateTourView}
        onClose={handleTourClose}
        onComplete={handleTourComplete}
      />

      {/* Cookie & Local Storage Banner */}
      {!cookieConsentAccepted && currentView === 'home' && !isTourOpen && (
        <CookieBanner
          onAccept={handleAcceptCookies}
          onDismiss={handleDismissCookies}
        />
      )}

      {/* Webcam Modal */}
      <WebcamModal
        isOpen={isWebcamOpen}
        onClose={() => setIsWebcamOpen(false)}
        onCapture={(dataUrl) => {
          setIsWebcamOpen(false);
          handleImageSelected(dataUrl, `Foto Webcam ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
          triggerToast('Foto da webcam capturada!', 'success');
        }}
      />

      {/* Global Raycast-style Command Palette (Ctrl+K / Cmd+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        currentView={currentView}
        onSelectTool={(tool) => {
          if (currentView === 'editor' && editorActions) {
            editorActions.selectTool(tool);
          } else {
            handleStartSketch();
            setTimeout(() => editorActions?.selectTool(tool), 100);
          }
        }}
        onCopyImage={() => editorActions?.copyImage()}
        onSaveToClips={() => editorActions?.saveImage()}
        onDownloadImage={() => editorActions?.downloadImage()}
        onOpenFrameModal={() => editorActions?.openFrameModal()}
        onNavigateView={(view) => setCurrentView(view)}
        onStartTour={handleStartManualTour}
        onNewSketch={handleStartSketch}
      />

      {/* Tactile Toasts Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-xl border shadow-xl backdrop-blur-md animate-in slide-in-from-bottom-3 duration-200 ${
              t.type === 'success'
                ? 'bg-obsidian-900/95 border-emerald-500/40 text-zinc-200'
                : t.type === 'error'
                ? 'bg-obsidian-900/95 border-red-500/40 text-zinc-200'
                : 'bg-obsidian-900/95 border-amber-500/40 text-zinc-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {t.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
              {t.type === 'error' && <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />}
              {t.type === 'info' && <Info className="w-4 h-4 text-amber-accent shrink-0" />}
              <span className="text-xs font-medium leading-snug">{t.message}</span>
            </div>
            <button
              onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
              className="text-zinc-500 hover:text-zinc-300 p-0.5 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

    </div>
  );
};
export default App;
