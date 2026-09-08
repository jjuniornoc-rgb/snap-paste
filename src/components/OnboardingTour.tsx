import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ClipboardPaste, 
  Monitor, 
  PenTool, 
  FolderHeart, 
  Pencil,
  Type,
  Eye,
  EyeOff,
  ListOrdered,
  Crop,
  Palette,
  Share2,
  Search,
  ArrowRight, 
  ArrowLeft, 
  X, 
  Check,
  GripHorizontal
} from 'lucide-react';

export interface TourStep {
  id: string;
  view: 'home' | 'editor' | 'clips';
  selector: string;
  title: string;
  description: string;
  badge: string;
  icon: React.ReactNode;
  preferredPosition?: 'top' | 'bottom' | 'left' | 'right' | 'bottom-right';
}

import { useI18n, TranslationSchema } from '../i18n';

export function getTourSteps(strings: TranslationSchema): TourStep[] {
  const s = strings.tour.steps;
  return [
    // --- HOME VIEW ---
    {
      id: 'dropzone',
      view: 'home',
      selector: '[data-tour="dropzone"]',
      title: s.dropzone.title,
      description: s.dropzone.desc,
      badge: s.dropzone.badge,
      icon: <ClipboardPaste className="w-4 h-4 text-amber-accent" />,
      preferredPosition: 'bottom'
    },
    {
      id: 'capture-tools',
      view: 'home',
      selector: '[data-tour="capture-tools"]',
      title: s.captureTools.title,
      description: s.captureTools.desc,
      badge: s.captureTools.badge,
      icon: <Monitor className="w-4 h-4 text-amber-accent" />,
      preferredPosition: 'top'
    },
    {
      id: 'just-sketch',
      view: 'home',
      selector: '[data-tour="just-sketch"]',
      title: s.justSketch.title,
      description: s.justSketch.desc,
      badge: s.justSketch.badge,
      icon: <PenTool className="w-4 h-4 text-amber-accent" />,
      preferredPosition: 'top'
    },

    // --- EDITOR VIEW ---
    {
      id: 'editor-canvas',
      view: 'editor',
      selector: '[data-tour="editor-canvas"]',
      title: s.editorCanvas.title,
      description: s.editorCanvas.desc,
      badge: s.editorCanvas.badge,
      icon: <Monitor className="w-4 h-4 text-amber-accent" />,
      preferredPosition: 'bottom-right'
    },
    {
      id: 'editor-tools-group',
      view: 'editor',
      selector: '[data-tour="editor-tools-group"]',
      title: s.editorToolsGroup.title,
      description: s.editorToolsGroup.desc,
      badge: s.editorToolsGroup.badge,
      icon: <Pencil className="w-4 h-4 text-amber-accent" />,
      preferredPosition: 'bottom'
    },
    {
      id: 'tool-text',
      view: 'editor',
      selector: '[data-tour="tool-text"]',
      title: s.toolText.title,
      description: s.toolText.desc,
      badge: s.toolText.badge,
      icon: <Type className="w-4 h-4 text-amber-accent" />,
      preferredPosition: 'bottom'
    },
    {
      id: 'tool-censor',
      view: 'editor',
      selector: '[data-tour="tool-censor"]',
      title: s.toolCensor.title,
      description: s.toolCensor.desc,
      badge: s.toolCensor.badge,
      icon: <EyeOff className="w-4 h-4 text-amber-accent" />,
      preferredPosition: 'bottom'
    },
    {
      id: 'tool-step',
      view: 'editor',
      selector: '[data-tour="tool-step"]',
      title: s.toolStep.title,
      description: s.toolStep.desc,
      badge: s.toolStep.badge,
      icon: <ListOrdered className="w-4 h-4 text-amber-accent" />,
      preferredPosition: 'bottom'
    },
    {
      id: 'tool-crop',
      view: 'editor',
      selector: '[data-tour="tool-crop"]',
      title: s.toolCrop.title,
      description: s.toolCrop.desc,
      badge: s.toolCrop.badge,
      icon: <Crop className="w-4 h-4 text-amber-accent" />,
      preferredPosition: 'bottom'
    },
    {
      id: 'editor-palette',
      view: 'editor',
      selector: '[data-tour="editor-palette"]',
      title: s.editorPalette.title,
      description: s.editorPalette.desc,
      badge: s.editorPalette.badge,
      icon: <Palette className="w-4 h-4 text-amber-accent" />,
      preferredPosition: 'bottom'
    },
    {
      id: 'editor-top-actions',
      view: 'editor',
      selector: '[data-tour="editor-top-actions"]',
      title: s.editorTopActions.title,
      description: s.editorTopActions.desc,
      badge: s.editorTopActions.badge,
      icon: <Share2 className="w-4 h-4 text-amber-accent" />,
      preferredPosition: 'bottom'
    },

    // --- CLIPS VIEW ---
    {
      id: 'clips-header',
      view: 'clips',
      selector: '[data-tour="clips-header"]',
      title: s.clipsHeader.title,
      description: s.clipsHeader.desc,
      badge: s.clipsHeader.badge,
      icon: <FolderHeart className="w-4 h-4 text-emerald-400" />,
      preferredPosition: 'bottom'
    },
    {
      id: 'clips-search',
      view: 'clips',
      selector: '[data-tour="clips-search"]',
      title: s.clipsSearch.title,
      description: s.clipsSearch.desc,
      badge: s.clipsSearch.badge,
      icon: <Search className="w-4 h-4 text-amber-accent" />,
      preferredPosition: 'bottom'
    }
  ];
}

interface OnboardingTourProps {
  isOpen: boolean;
  currentView: 'home' | 'editor' | 'clips';
  onNavigateView: (view: 'home' | 'editor' | 'clips') => void;
  onClose: () => void;
  onComplete: () => void;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({
  isOpen,
  currentView,
  onNavigateView,
  onClose,
  onComplete
}) => {
  const { strings, t } = useI18n();
  const tourSteps = React.useMemo(() => getTourSteps(strings), [strings]);

  const [currentStepIndex, setCurrentStepIndex] = useState(() => {
    if (typeof window === 'undefined') return 0;
    const params = new URLSearchParams(window.location.search);
    const stepParam = params.get('tourStep');
    if (stepParam) {
      const idx = parseInt(stepParam, 10);
      if (!isNaN(idx) && idx >= 0 && idx < 13) return idx;
    }
    return 0;
  });
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tooltipDims, setTooltipDims] = useState<{ w: number; h: number }>({ w: 420, h: 220 });

  // Draggable & Peek States
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isPeeking, setIsPeeking] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initX: number; initY: number } | null>(null);

  // Reset drag position and peeking whenever step changes
  useEffect(() => {
    setDragOffset(null);
    setIsPeeking(false);
  }, [currentStepIndex]);

  // Dynamically observe tooltip card dimensions
  useEffect(() => {
    if (!isOpen || !tooltipRef.current) return;

    const measure = () => {
      if (tooltipRef.current) {
        const rect = tooltipRef.current.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          setTooltipDims(prev => {
            if (Math.abs(prev.w - rect.width) > 2 || Math.abs(prev.h - rect.height) > 2) {
              return { w: Math.round(rect.width), h: Math.round(rect.height) };
            }
            return prev;
          });
        }
      }
    };

    measure();

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(() => measure());
      observer.observe(tooltipRef.current);
      return () => observer.disconnect();
    }
  }, [isOpen, currentStepIndex]);

  const currentStep = tourSteps[currentStepIndex] || tourSteps[0];

  // Update target rect based on active step selector
  const updateTargetPosition = useCallback(() => {
    if (!isOpen || !currentStep) return;

    // Check if step requires a different view
    if (currentStep.view !== currentView) {
      onNavigateView(currentStep.view);
      return;
    }

    const el = document.querySelector(currentStep.selector);
    if (el) {
      const rect = el.getBoundingClientRect();
      const winH = window.innerHeight || document.documentElement.clientHeight;
      
      // Only scroll vertically if needed; never scroll window horizontally on wide canvas
      const isVerticallyVisible = rect.top >= 20 && rect.bottom <= winH - 20;
      if (!isVerticallyVisible) {
        el.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'nearest' });
      }

      // Guarantee window is never shifted horizontally on narrow mobile screens
      if (typeof window !== 'undefined' && window.scrollX !== 0) {
        window.scrollTo({ left: 0, top: window.scrollY });
      }

      const updated = el.getBoundingClientRect();
      setTargetRect(updated);
    } else {
      setTargetRect(null);
    }
  }, [isOpen, currentStep, currentView, onNavigateView]);

  useEffect(() => {
    updateTargetPosition();

    // Re-check after view switch and image load delays
    const timer1 = setTimeout(() => updateTargetPosition(), 150);
    const timer2 = setTimeout(() => updateTargetPosition(), 400);

    // Dynamic observer for target resizing (e.g. canvas loading full-res image)
    let targetObserver: ResizeObserver | null = null;
    const el = currentStep ? document.querySelector(currentStep.selector) : null;
    if (el && typeof ResizeObserver !== 'undefined') {
      targetObserver = new ResizeObserver(() => {
        updateTargetPosition();
      });
      targetObserver.observe(el);
    }

    const handleResize = () => updateTargetPosition();
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, true);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      if (targetObserver) targetObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize, true);
    };
  }, [updateTargetPosition, currentView, currentStepIndex]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        if (currentStepIndex < TOUR_STEPS.length - 1) {
          const nextStep = TOUR_STEPS[currentStepIndex + 1];
          if (nextStep && nextStep.view !== currentView) {
            onNavigateView(nextStep.view);
          }
          setCurrentStepIndex(prev => prev + 1);
        } else {
          onComplete();
        }
      } else if (e.key === 'ArrowLeft') {
        if (currentStepIndex > 0) {
          const prevStep = TOUR_STEPS[currentStepIndex - 1];
          if (prevStep && prevStep.view !== currentView) {
            onNavigateView(prevStep.view);
          }
          setCurrentStepIndex(prev => prev - 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStepIndex, currentView, onNavigateView, onClose, onComplete]);

  if (!isOpen || !currentStep) return null;

  const handleNext = () => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      const nextStep = TOUR_STEPS[currentStepIndex + 1];
      if (nextStep && nextStep.view !== currentView) {
        onNavigateView(nextStep.view);
      }
      setCurrentStepIndex(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      const prevStep = TOUR_STEPS[currentStepIndex - 1];
      if (prevStep && prevStep.view !== currentView) {
        onNavigateView(prevStep.view);
      }
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const isLastStep = currentStepIndex === TOUR_STEPS.length - 1;

  // Responsive, Clamped Tooltip Positioning Calculation
  const safeMargin = 16;
  const margin = 14;
  const winW = typeof window !== 'undefined' ? window.innerWidth : 1024;
  const winH = typeof window !== 'undefined' ? window.innerHeight : 768;
  const isMobile = winW < 640;

  // Max width dynamically constrained by viewport on mobile devices
  const maxCardWidth = Math.min(420, winW - safeMargin * 2);
  const actualW = Math.min(tooltipDims.w || 400, maxCardWidth);
  const actualH = tooltipDims.h || 220;

  let computedTop = (winH - actualH) / 2;
  // Default horizontal center of viewport
  let desiredLeft = (winW - actualW) / 2;

  if (targetRect) {
    const spaceAbove = targetRect.top - safeMargin;
    const spaceBelow = winH - targetRect.bottom - safeMargin;
    const isLargeTarget = targetRect.height > winH * 0.52 || (spaceAbove < actualH && spaceBelow < actualH);

    if (currentStep.preferredPosition === 'bottom-right' || (isLargeTarget && spaceAbove < actualH + margin && spaceBelow < actualH + margin)) {
      // Large full-screen elements (like the editor canvas) or explicit bottom-right:
      // Dock comfortably in the bottom-right corner on desktop, or bottom-center on mobile,
      // so it does NOT stay directly on top of / cover the artwork or canvas content!
      if (isMobile) {
        computedTop = winH - actualH - 24;
        desiredLeft = (winW - actualW) / 2;
      } else {
        computedTop = winH - actualH - 28;
        desiredLeft = winW - actualW - 28;
      }
    } else if (isLargeTarget) {
      // If there is enough room above or below a large target, use it
      if (currentStep.preferredPosition === 'top' && spaceAbove >= actualH + margin) {
        computedTop = targetRect.top - actualH - margin;
        desiredLeft = isMobile ? (winW - actualW) / 2 : (targetRect.left + targetRect.width / 2 - actualW / 2);
      } else if (currentStep.preferredPosition === 'bottom' && spaceBelow >= actualH + margin) {
        computedTop = targetRect.bottom + margin;
        desiredLeft = isMobile ? (winW - actualW) / 2 : (targetRect.left + targetRect.width / 2 - actualW / 2);
      } else {
        // Fallback for large targets: dock in bottom right corner
        if (isMobile) {
          computedTop = winH - actualH - 24;
          desiredLeft = (winW - actualW) / 2;
        } else {
          computedTop = winH - actualH - 28;
          desiredLeft = winW - actualW - 28;
        }
      }
    } else {
      // Standard target element:
      const preferTop = currentStep.preferredPosition === 'top';
      const canFitAbove = spaceAbove >= actualH + margin;
      const canFitBelow = spaceBelow >= actualH + margin;

      if (preferTop) {
        if (canFitAbove) {
          computedTop = targetRect.top - actualH - margin;
        } else if (canFitBelow) {
          computedTop = targetRect.bottom + margin;
        } else {
          computedTop = spaceAbove >= spaceBelow ? targetRect.top - actualH - margin : targetRect.bottom + margin;
        }
      } else {
        // Default preferBottom
        if (canFitBelow) {
          computedTop = targetRect.bottom + margin;
        } else if (canFitAbove) {
          computedTop = targetRect.top - actualH - margin;
        } else {
          computedTop = spaceBelow >= spaceAbove ? targetRect.bottom + margin : targetRect.top - actualH - margin;
        }
      }

      // Horizontal positioning for standard targets
      if (!isMobile) {
        const targetCenterX = targetRect.left + targetRect.width / 2;
        desiredLeft = targetCenterX - actualW / 2;
      }
    }
  }

  // STRICT VIEWPORT CLAMPING: CANNOT EVER OVERFLOW TOP, BOTTOM, LEFT OR RIGHT!
  const minTop = safeMargin;
  const maxTop = Math.max(minTop, winH - actualH - safeMargin);
  const finalTop = Math.max(minTop, Math.min(maxTop, computedTop));

  const minLeft = safeMargin;
  const maxLeft = Math.max(minLeft, winW - actualW - safeMargin);
  const finalLeft = Math.max(minLeft, Math.min(maxLeft, desiredLeft));

  const activeLeft = dragOffset ? dragOffset.x : finalLeft;
  const activeTop = dragOffset ? dragOffset.y : finalTop;

  // Pointer drag handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input')) return;

    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    const currentLeft = dragOffset ? dragOffset.x : finalLeft;
    const currentTop = dragOffset ? dragOffset.y : finalTop;

    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: currentLeft,
      initY: currentTop
    };
    setIsDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.startX;
    const dy = e.clientY - dragStartRef.current.startY;

    const clampedX = Math.max(safeMargin, Math.min(winW - actualW - safeMargin, dragStartRef.current.initX + dx));
    const clampedY = Math.max(safeMargin, Math.min(winH - actualH - safeMargin, dragStartRef.current.initY + dy));

    setDragOffset({ x: clampedX, y: clampedY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
  };

  const tooltipStyle: React.CSSProperties = {
    position: 'fixed',
    zIndex: 9999,
    top: `${Math.round(activeTop)}px`,
    left: `${Math.round(activeLeft)}px`,
    width: `${Math.round(actualW)}px`,
    maxWidth: `calc(100vw - ${safeMargin * 2}px)`,
    maxHeight: `calc(100vh - ${safeMargin * 2}px)`,
    overflowY: 'auto',
    bottom: 'auto',
    right: 'auto',
    opacity: isPeeking ? 0.12 : 1,
    transition: isDragging ? 'none' : 'opacity 0.2s ease, transform 0.15s ease-out',
    transform: isPeeking ? 'scale(0.96)' : 'scale(1)'
  };

  return (
    <div className="fixed inset-0 z-[9990] overflow-hidden pointer-events-auto">
      
      {/* Cutout Mask Backdrop (Dimm everything EXCEPT the target area) */}
      {targetRect ? (
        <svg 
          className="fixed inset-0 w-full h-full pointer-events-auto z-[9991]"
          onClick={onClose}
        >
          <defs>
            <mask id="spotlight-cutout-mask">
              {/* White reveals the dark background */}
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              {/* Black punches a crystal-clear hole over the target element */}
              <rect
                x={Math.max(0, targetRect.left - 8)}
                y={Math.max(0, targetRect.top - 8)}
                width={Math.min(winW - Math.max(0, targetRect.left - 8), targetRect.width + 16)}
                height={targetRect.height + 16}
                rx="14"
                ry="14"
                fill="black"
              />
            </mask>
          </defs>
          {/* Dimmed backdrop with the cutout hole */}
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(5, 5, 9, 0.84)"
            mask="url(#spotlight-cutout-mask)"
          />
        </svg>
      ) : (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-obsidian-950/80 backdrop-blur-[1px] transition-opacity duration-300 z-[9991]"
        />
      )}

      {/* Target Spotlight Highlight Ring around the crystal-clear hole */}
      {targetRect && (
        <div
          style={{
            position: 'fixed',
            top: Math.max(0, targetRect.top - 8),
            left: Math.max(0, targetRect.left - 8),
            width: Math.min(winW - Math.max(0, targetRect.left - 8) - safeMargin, targetRect.width + 16),
            height: targetRect.height + 16,
            borderRadius: 14,
            pointerEvents: 'none',
            zIndex: 9992
          }}
          className="ring-2 ring-amber-accent shadow-[0_0_30px_rgba(245,158,11,0.35)] transition-all duration-300"
        />
      )}

      {/* Interactive Tooltip Card */}
      <div
        ref={tooltipRef}
        style={tooltipStyle}
        className="rounded-2xl bg-obsidian-900 border border-amber-500/30 shadow-2xl p-4 sm:p-5 flex flex-col gap-3.5 backdrop-blur-xl animate-in zoom-in-95 duration-200"
      >
        {/* Step Indicator, Peek Button, Drag Handle & Close */}
        <div 
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className={`flex items-center justify-between cursor-grab active:cursor-grabbing select-none pb-2 border-b border-zinc-800/60 transition-colors ${
            isDragging ? 'bg-amber-500/5' : ''
          }`}
          title="Clique e arraste para reposicionar o card"
        >
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-glow text-[11px] font-bold">
              {t('tour.stepOf', { current: currentStepIndex + 1, total: tourSteps.length })}
            </span>
            <span className="text-[11px] text-zinc-400 font-medium hidden xs:inline">
              {currentStep.badge}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Peek Button (Hold to see underneath) */}
            <button
              type="button"
              onPointerDown={(e) => { e.stopPropagation(); setIsPeeking(true); }}
              onPointerUp={(e) => { e.stopPropagation(); setIsPeeking(false); }}
              onPointerLeave={() => setIsPeeking(false)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium transition-colors ${
                isPeeking 
                  ? 'bg-amber-accent text-obsidian-950 font-bold' 
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
              title={strings.tour.peek}
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="text-[10px] hidden sm:inline">{strings.tour.peek}</span>
            </button>

            {/* Drag Handle Indicator */}
            <div className="p-1 text-zinc-500 hover:text-zinc-300 rounded cursor-grab">
              <GripHorizontal className="w-3.5 h-3.5" />
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="text-zinc-500 hover:text-zinc-300 p-1 rounded-lg hover:bg-zinc-800/80 transition-colors"
              title={`${strings.tour.skip} (Esc)`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Title & Description */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            {currentStep.icon}
            <h4>{currentStep.title}</h4>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed">
            {currentStep.description}
          </p>
        </div>

        {/* Progress Dots Bar */}
        <div className="flex items-center gap-1 py-0.5 overflow-hidden">
          {tourSteps.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentStepIndex
                  ? 'w-6 bg-amber-accent'
                  : idx < currentStepIndex
                  ? 'w-1.5 bg-amber-500/40'
                  : 'w-1.5 bg-zinc-800'
              }`}
            />
          ))}
        </div>

        {/* Navigation Buttons: Next & Skip */}
        <div className="flex items-center justify-between pt-1 border-t border-zinc-800/80 gap-2">
          <button
            onClick={onClose}
            className="text-xs text-zinc-400 hover:text-zinc-200 font-medium py-1 px-2 rounded-lg hover:bg-zinc-800/50 transition-colors shrink-0"
          >
            {strings.tour.skip}
          </button>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {currentStepIndex > 0 && (
              <button
                onClick={handlePrev}
                className="py-1.5 px-2.5 sm:px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold flex items-center gap-1 sm:gap-1.5 transition-colors shrink-0"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{strings.tour.back}</span>
              </button>
            )}

            <button
              onClick={handleNext}
              className="py-1.5 px-3 sm:px-3.5 rounded-xl bg-amber-accent hover:bg-amber-hover text-obsidian-950 text-xs font-bold flex items-center gap-1 sm:gap-1.5 shadow-md shadow-amber-500/20 active:scale-[0.98] transition-all shrink-0"
            >
              <span>{isLastStep ? strings.tour.finish : strings.tour.next}</span>
              {isLastStep ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <ArrowRight className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
