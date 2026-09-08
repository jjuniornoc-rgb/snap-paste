import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, RefreshCw, Timer } from 'lucide-react';
import { useI18n } from '../i18n';

interface WebcamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (dataUrl: string) => void;
}

export const WebcamModal: React.FC<WebcamModalProps> = ({
  isOpen,
  onClose,
  onCapture
}) => {
  const { strings } = useI18n();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isMirrored, setIsMirrored] = useState(true);
  const [useTimer, setUseTimer] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isFlashing, setIsFlashing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Start webcam when opened
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setErrorMsg(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode: 'user'
        },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setHasPermission(true);
    } catch (err: any) {
      console.error('Webcam permission error:', err);
      setHasPermission(false);
      setErrorMsg(strings.webcam.error);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      streamRef.current = null;
    }
  };

  const triggerSnap = () => {
    if (useTimer) {
      setCountdown(3);
      const interval = setInterval(() => {
        setCountdown((prev: number | null) => {
          if (prev === null || prev <= 1) {
            clearInterval(interval);
            executeCapture();
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      executeCapture();
    }
  };

  const executeCapture = () => {
    if (!videoRef.current) return;

    // Trigger flash animation
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 350);

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (isMirrored) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/png');

    stopCamera();
    onCapture(dataUrl);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-obsidian-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-zinc-800 flex items-center justify-between bg-obsidian-950/60">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Camera className="w-4 h-4 text-amber-accent" />
            <span>{strings.webcam.title}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Viewfinder Area */}
        <div className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden">
          {hasPermission === false ? (
            <div className="p-6 text-center space-y-3 max-w-sm">
              <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto">
                <Camera className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-white">{errorMsg || strings.webcam.error}</p>
              <button
                onClick={startCamera}
                className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 transition-colors"
              >
                {strings.hero.buttons.upload}
              </button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover transition-transform duration-300 ${
                  isMirrored ? '-scale-x-100' : ''
                }`}
              />

              {/* Shutter flash overlay */}
              {isFlashing && (
                <div className="absolute inset-0 bg-white animate-shutter pointer-events-none" />
              )}

              {/* Countdown overlay */}
              {countdown !== null && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-xs">
                  <span className="text-7xl font-mono font-black text-amber-glow animate-ping">
                    {countdown}
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Controls Bar */}
        <div className="p-4 bg-obsidian-950 border-t border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMirrored(!isMirrored)}
              className={`p-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                isMirrored 
                  ? 'bg-zinc-800 text-amber-accent border-zinc-700' 
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
              }`}
              title={strings.webcam.switchCamera}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{strings.webcam.switchCamera}</span>
            </button>

            <button
              onClick={() => setUseTimer(!useTimer)}
              className={`p-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                useTimer 
                  ? 'bg-zinc-800 text-amber-accent border-zinc-700' 
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
              }`}
              title="3s Timer"
            >
              <Timer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">3s</span>
            </button>
          </div>

          {/* Big Shutter Button */}
          <button
            onClick={triggerSnap}
            disabled={hasPermission !== true || countdown !== null}
            className="flex items-center justify-center w-14 h-14 rounded-full bg-amber-accent hover:bg-amber-glow disabled:opacity-50 disabled:pointer-events-none text-obsidian-950 shadow-lg shadow-amber-500/25 transition-transform active:scale-95 group"
            title={strings.webcam.capture}
          >
            <div className="w-11 h-11 rounded-full border-2 border-obsidian-950 flex items-center justify-center">
              <Camera className="w-5 h-5 text-obsidian-950 group-hover:scale-110 transition-transform" />
            </div>
          </button>

          <div>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-xs font-medium text-zinc-300 transition-colors"
            >
              {strings.common.cancel}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
