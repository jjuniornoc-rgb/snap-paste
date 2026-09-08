import React, { useRef, useState, useEffect, useCallback } from 'react';
import { EditorToolbar, ToolType, CropAspect } from './EditorToolbar';
import { ShareModal } from './ShareModal';
import { FrameModal } from './FrameModal';
import { saveClip } from '../../lib/storage';
import { 
  ArrowLeft, 
  Copy, 
  Check, 
  Share2, 
  Save, 
  Download, 
  FileEdit,
  Type,
  X
} from 'lucide-react';
import { useI18n } from '../../i18n';

interface ImageEditorProps {
  initialImage: string;
  initialTitle?: string;
  onBack: () => void;
  onTriggerToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
  onSavedToClips: () => void;
  onRegisterEditorActions?: (actions: {
    selectTool: (t: ToolType) => void;
    openFrameModal: () => void;
    copyImage: () => void;
    saveImage: () => void;
    downloadImage: () => void;
  }) => void;
}

interface Point {
  x: number;
  y: number;
}

interface CropRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

type CropHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'move' | null;

interface ActiveTextInput {
  x: number;
  y: number;
  text: string;
  fontSize: number;
  withPill: boolean;
  isCallout?: boolean;
  targetPoint?: Point;
}

const ASPECT_RATIO_VALUES: Record<CropAspect, number | null> = {
  free: null,
  '1:1': 1,
  '16:9': 16 / 9,
  '4:3': 4 / 3,
  '9:16': 9 / 16,
  '3:2': 3 / 2,
};

export const ImageEditor: React.FC<ImageEditorProps> = ({
  initialImage,
  initialTitle = 'Captura sem título',
  onBack,
  onTriggerToast,
  onSavedToClips,
  onRegisterEditorActions
}) => {
  const { strings, t } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);

  // States
  const [title, setTitle] = useState(initialTitle);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [currentTool, setCurrentTool] = useState<ToolType>(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('demo') === 'crop' || params.get('tool') === 'crop') return 'crop';
    if (params.get('demo') === 'text' || params.get('tool') === 'text') return 'text';
    return 'brush';
  });
  const [currentColor, setCurrentColor] = useState('#f59e0b');
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [filled, setFilled] = useState(false);
  
  // History
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Zoom & Pan
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<Point>({ x: 0, y: 0 });

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<Point>({ x: 0, y: 0 });
  const [stepCounter, setStepCounter] = useState(1);

  // Crop state
  const [cropRect, setCropRect] = useState<CropRect | null>(null);
  const [cropAspect, setCropAspect] = useState<CropAspect>('free');
  const [activeCropHandle, setActiveCropHandle] = useState<CropHandle>(null);
  const [cropDragStart, setCropDragStart] = useState<{ startX: number; startY: number; initialRect: CropRect } | null>(null);
  const [hoveredCropHandle, setHoveredCropHandle] = useState<CropHandle>(null);
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  // Inline Text state (no prompt!)
  const [activeTextInput, setActiveTextInput] = useState<ActiveTextInput | null>(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('demo') === 'text' || params.get('tool') === 'text') {
      return {
        x: 340,
        y: 220,
        text: 'Nota de Teste v2.0 (Sem prompt!)',
        fontSize: 24,
        withPill: true
      };
    }
    return null;
  });

  // Modals & feedback
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isFrameOpen, setIsFrameOpen] = useState(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    return params.get('demo') === 'frame';
  });
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [imageDims, setImageDims] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

  // Initialize Canvas with initialImage
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = canvasRef.current;
      const overlay = overlayCanvasRef.current;
      if (!canvas || !overlay) return;

      canvas.width = img.width;
      canvas.height = img.height;
      overlay.width = img.width;
      overlay.height = img.height;
      setImageDims({ w: img.width, h: img.height });

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);

        if (window.location.search.includes('demo=innovations')) {
          // 1. Draw Magnifier over (250, 410)
          const magX = 250, magY = 410, magR = 50;
          ctx.save();
          ctx.beginPath();
          ctx.arc(magX, magY, magR, 0, Math.PI * 2);
          ctx.clip();
          const zoomFactor = 2.0;
          const srcW = (magR * 2) / zoomFactor;
          const srcH = (magR * 2) / zoomFactor;
          ctx.drawImage(img, magX - srcW / 2, magY - srcH / 2, srcW, srcH, magX - magR, magY - magR, magR * 2, magR * 2);
          ctx.restore();

          ctx.save();
          ctx.beginPath();
          ctx.arc(magX, magY, magR, 0, Math.PI * 2);
          ctx.lineWidth = 3;
          ctx.strokeStyle = '#f59e0b';
          ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
          ctx.shadowBlur = 8;
          ctx.stroke();

          const badgeText = '2.0×';
          ctx.font = 'bold 11px "JetBrains Mono", monospace';
          const badgeW = ctx.measureText(badgeText).width + 14;
          ctx.fillStyle = 'rgba(24, 24, 27, 0.95)';
          ctx.beginPath();
          ctx.roundRect(magX - badgeW / 2, magY + magR - 10, badgeW, 20, 10);
          ctx.fill();
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.fillStyle = '#f59e0b';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(badgeText, magX, magY + magR);
          ctx.restore();

          // 2. Draw Dimension Ruler from (520, 470) to (950, 470)
          const dX1 = 520, dY1 = 470, dX2 = 950, dY2 = 470;
          const dist = 430;
          ctx.save();
          ctx.strokeStyle = '#10b981';
          ctx.fillStyle = '#10b981';
          ctx.lineWidth = 2.5;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(dX1, dY1);
          ctx.lineTo(dX2, dY2);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(dX1, dY1 - 7);
          ctx.lineTo(dX1, dY1 + 7);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(dX2, dY2 - 7);
          ctx.lineTo(dX2, dY2 + 7);
          ctx.stroke();

          const midX = (dX1 + dX2) / 2;
          const midY = (dY1 + dY2) / 2;
          const label = `${dist} px`;
          ctx.font = 'bold 11px "JetBrains Mono", monospace';
          const dBadgeW = ctx.measureText(label).width + 14;
          ctx.fillStyle = 'rgba(24, 24, 27, 0.92)';
          ctx.beginPath();
          ctx.roundRect(midX - dBadgeW / 2, midY - 10, dBadgeW, 20, 6);
          ctx.fill();
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 1.2;
          ctx.stroke();
          ctx.fillStyle = '#10b981';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(label, midX, midY);
          ctx.restore();

          // 3. Draw Callout Bubble pointing to (600, 240)
          const tipX = 600, tipY = 240;
          const cBoxX = 720, cBoxY = 160, cBoxW = 200, cBoxH = 46;
          ctx.save();
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(tipX, tipY);
          ctx.lineTo(cBoxX + cBoxW / 2, cBoxY + cBoxH / 2);
          ctx.stroke();

          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.arc(tipX, tipY, 4.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#18181b';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.fillStyle = 'rgba(15, 15, 20, 0.94)';
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(cBoxX, cBoxY, cBoxW, cBoxH, 10);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#f59e0b';
          ctx.font = 'bold 13px "Plus Jakarta Sans", sans-serif';
          ctx.textBaseline = 'top';
          ctx.fillText('Latência de 4.2ms (OK!)', cBoxX + 14, cBoxY + 8);
          ctx.font = '11px "Plus Jakarta Sans", sans-serif';
          ctx.fillStyle = '#a1a1aa';
          ctx.fillText('99.98% de disponibilidade', cBoxX + 14, cBoxY + 26);
          ctx.restore();
        }

        const dataUrl = canvas.toDataURL('image/png');
        setHistory([dataUrl]);
        setHistoryIndex(0);
      }

      // Auto-fit zoom if image is large
      if (containerRef.current) {
        const cw = containerRef.current.clientWidth - 80;
        const ch = containerRef.current.clientHeight - 80;
        if (img.width > cw || img.height > ch) {
          const fitZoom = Math.min(cw / img.width, ch / img.height, 1);
          setZoom(Math.max(0.2, fitZoom));
        }
      }
    };
    img.src = initialImage;
  }, [initialImage]);

  // Save current canvas state to history
  const pushHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    
    setHistory(prev => {
      const next = prev.slice(0, historyIndex + 1);
      next.push(dataUrl);
      return next;
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  // Undo / Redo
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const targetUrl = history[historyIndex - 1];
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (canvas && ctx) {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          setHistoryIndex(prev => prev - 1);
          setImageDims({ w: img.width, h: img.height });
        }
      };
      img.src = targetUrl;
    }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const targetUrl = history[historyIndex + 1];
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (canvas && ctx) {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          setHistoryIndex(prev => prev + 1);
          setImageDims({ w: img.width, h: img.height });
        }
      };
      img.src = targetUrl;
    }
  }, [history, historyIndex]);

  // Translate screen coords to canvas coords
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  // Helper: initialize crop rectangle
  const initCropRect = useCallback((aspect: CropAspect) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cw = canvas.width;
    const ch = canvas.height;

    let w = Math.round(cw * 0.85);
    let h = Math.round(ch * 0.85);

    const ratio = ASPECT_RATIO_VALUES[aspect];
    if (ratio) {
      if (w / h > ratio) {
        w = Math.round(h * ratio);
      } else {
        h = Math.round(w / ratio);
      }
    }

    const x = Math.round((cw - w) / 2);
    const y = Math.round((ch - h) / 2);
    setCropRect({ x, y, w, h });
  }, []);

  // When switching tool to crop, auto-initialize cropRect
  useEffect(() => {
    if (currentTool === 'crop') {
      const canvas = canvasRef.current;
      if (canvas && (!cropRect || cropRect.w === 0 || cropRect.h === 0)) {
        initCropRect(cropAspect);
      }
    } else {
      // Clear overlay if exiting crop mode
      const overlay = overlayCanvasRef.current;
      const octx = overlay?.getContext('2d');
      if (overlay && octx) {
        octx.clearRect(0, 0, overlay.width, overlay.height);
      }
      setCropRect(null);
    }
  }, [currentTool, initCropRect, cropAspect]);

  // Handle aspect ratio selection change
  const handleCropAspectChange = (newAspect: CropAspect) => {
    setCropAspect(newAspect);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ratio = ASPECT_RATIO_VALUES[newAspect];
    if (!ratio) return;

    const current = cropRect || {
      x: Math.round(canvas.width * 0.1),
      y: Math.round(canvas.height * 0.1),
      w: Math.round(canvas.width * 0.8),
      h: Math.round(canvas.height * 0.8)
    };

    const cx = current.x + current.w / 2;
    const cy = current.y + current.h / 2;

    let newW = current.w;
    let newH = Math.round(newW / ratio);

    if (newH > canvas.height * 0.95) {
      newH = Math.round(canvas.height * 0.9);
      newW = Math.round(newH * ratio);
    }
    if (newW > canvas.width * 0.95) {
      newW = Math.round(canvas.width * 0.9);
      newH = Math.round(newW / ratio);
    }

    let newX = Math.round(cx - newW / 2);
    let newY = Math.round(cy - newH / 2);

    newX = Math.max(0, Math.min(canvas.width - newW, newX));
    newY = Math.max(0, Math.min(canvas.height - newH, newY));

    setCropRect({ x: newX, y: newY, w: newW, h: newH });
  };

  // Render Crop Overlay: Dimmed mask, Thirds grid, and 8 Handles
  const renderCropOverlay = useCallback(() => {
    const overlay = overlayCanvasRef.current;
    if (!overlay) return;
    const ctx = overlay.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, overlay.width, overlay.height);

    if (currentTool !== 'crop' || !cropRect) return;

    // 1. Darkened outside mask
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.fillRect(0, 0, overlay.width, overlay.height);
    ctx.clearRect(cropRect.x, cropRect.y, cropRect.w, cropRect.h);

    // 2. Crop border (sleek amber / white)
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.strokeRect(cropRect.x, cropRect.y, cropRect.w, cropRect.h);

    // 3. Rule of Thirds grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    const thirdW = cropRect.w / 3;
    const thirdH = cropRect.h / 3;

    // Vertical grid lines
    ctx.beginPath();
    ctx.moveTo(cropRect.x + thirdW, cropRect.y);
    ctx.lineTo(cropRect.x + thirdW, cropRect.y + cropRect.h);
    ctx.moveTo(cropRect.x + thirdW * 2, cropRect.y);
    ctx.lineTo(cropRect.x + thirdW * 2, cropRect.y + cropRect.h);

    // Horizontal grid lines
    ctx.moveTo(cropRect.x, cropRect.y + thirdH);
    ctx.lineTo(cropRect.x + cropRect.w, cropRect.y + thirdH);
    ctx.moveTo(cropRect.x, cropRect.y + thirdH * 2);
    ctx.lineTo(cropRect.x + cropRect.w, cropRect.y + thirdH * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // 4. Handles (8 handles: corners and edges)
    const handleRadius = Math.max(5, 6 / zoom);
    const handles = [
      { x: cropRect.x, y: cropRect.y },
      { x: cropRect.x + cropRect.w / 2, y: cropRect.y },
      { x: cropRect.x + cropRect.w, y: cropRect.y },
      { x: cropRect.x + cropRect.w, y: cropRect.y + cropRect.h / 2 },
      { x: cropRect.x + cropRect.w, y: cropRect.y + cropRect.h },
      { x: cropRect.x + cropRect.w / 2, y: cropRect.y + cropRect.h },
      { x: cropRect.x, y: cropRect.y + cropRect.h },
      { x: cropRect.x, y: cropRect.y + cropRect.h / 2 },
    ];

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2.5;

    for (const h of handles) {
      ctx.beginPath();
      ctx.arc(h.x, h.y, handleRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }, [currentTool, cropRect, zoom]);

  // Re-render crop overlay when needed
  useEffect(() => {
    if (currentTool === 'crop') {
      renderCropOverlay();
    }
  }, [currentTool, cropRect, renderCropOverlay]);

  // Hit test for crop handles
  const getCropHandleAt = useCallback((coords: Point): CropHandle => {
    if (!cropRect) return null;
    const hitRadius = Math.max(14, 14 / zoom);

    const corners: { handle: CropHandle; x: number; y: number }[] = [
      { handle: 'nw', x: cropRect.x, y: cropRect.y },
      { handle: 'n', x: cropRect.x + cropRect.w / 2, y: cropRect.y },
      { handle: 'ne', x: cropRect.x + cropRect.w, y: cropRect.y },
      { handle: 'e', x: cropRect.x + cropRect.w, y: cropRect.y + cropRect.h / 2 },
      { handle: 'se', x: cropRect.x + cropRect.w, y: cropRect.y + cropRect.h },
      { handle: 's', x: cropRect.x + cropRect.w / 2, y: cropRect.y + cropRect.h },
      { handle: 'sw', x: cropRect.x, y: cropRect.y + cropRect.h },
      { handle: 'w', x: cropRect.x, y: cropRect.y + cropRect.h / 2 },
    ];

    for (const pt of corners) {
      const dist = Math.hypot(coords.x - pt.x, coords.y - pt.y);
      if (dist <= hitRadius) return pt.handle;
    }

    // Check if inside cropRect -> move
    if (
      coords.x >= cropRect.x &&
      coords.x <= cropRect.x + cropRect.w &&
      coords.y >= cropRect.y &&
      coords.y <= cropRect.y + cropRect.h
    ) {
      return 'move';
    }

    return null;
  }, [cropRect, zoom]);

  // Apply Crop
  const executeCrop = () => {
    if (!cropRect || cropRect.w < 10 || cropRect.h < 10) return;
    const canvas = canvasRef.current;
    const overlay = overlayCanvasRef.current;
    if (!canvas || !overlay) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const croppedData = ctx.getImageData(cropRect.x, cropRect.y, cropRect.w, cropRect.h);
    canvas.width = cropRect.w;
    canvas.height = cropRect.h;
    overlay.width = cropRect.w;
    overlay.height = cropRect.h;

    ctx.putImageData(croppedData, 0, 0);
    setImageDims({ w: cropRect.w, h: cropRect.h });
    setCropRect(null);
    setCurrentTool('brush');

    const octx = overlay.getContext('2d');
    octx?.clearRect(0, 0, overlay.width, overlay.height);

    pushHistory();
    onTriggerToast('Imagem recortada com sucesso!', 'success');
  };

  // Cancel Crop
  const handleCancelCrop = () => {
    setCropRect(null);
    setCurrentTool('brush');
    const overlay = overlayCanvasRef.current;
    const octx = overlay?.getContext('2d');
    if (overlay && octx) {
      octx.clearRect(0, 0, overlay.width, overlay.height);
    }
    onTriggerToast('Recorte cancelado.', 'info');
  };

  // Commit Inline Text to Canvas (no prompt!)
  const commitTextInput = () => {
    if (!activeTextInput || !activeTextInput.text.trim()) {
      setActiveTextInput(null);
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const lines = activeTextInput.text.split('\n');
    const fontSize = activeTextInput.fontSize;
    ctx.save();
    ctx.font = `bold ${fontSize}px "Plus Jakarta Sans", system-ui, sans-serif`;

    let maxW = 0;
    for (const line of lines) {
      const w = ctx.measureText(line).width;
      if (w > maxW) maxW = w;
    }
    const lineHeight = fontSize * 1.35;
    const totalH = lines.length * lineHeight;
    const paddingX = 14;
    const paddingY = 10;

    if (activeTextInput.isCallout && activeTextInput.targetPoint) {
      const tip = activeTextInput.targetPoint;
      const boxX = activeTextInput.x - paddingX;
      const boxY = activeTextInput.y - paddingY;
      const boxW = maxW + paddingX * 2;
      const boxH = totalH + paddingY * 2;
      const boxCenter = { x: boxX + boxW / 2, y: boxY + boxH / 2 };

      // Connecting line from target pin to callout box center
      ctx.strokeStyle = currentColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(tip.x, tip.y);
      ctx.lineTo(boxCenter.x, boxCenter.y);
      ctx.stroke();

      // Pin circle at target
      ctx.fillStyle = currentColor;
      ctx.beginPath();
      ctx.arc(tip.x, tip.y, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#18181b';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Bubble card
      ctx.fillStyle = 'rgba(15, 15, 20, 0.94)';
      ctx.strokeStyle = currentColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(boxX, boxY, boxW, boxH, 10);
      ctx.fill();
      ctx.stroke();

      // Text inside
      ctx.fillStyle = currentColor;
      ctx.textBaseline = 'top';
      lines.forEach((line, idx) => {
        ctx.fillText(line, activeTextInput.x, activeTextInput.y + idx * lineHeight);
      });

      ctx.restore();
      pushHistory();
      setActiveTextInput(null);
      onTriggerToast('Balão de comentário inserido!', 'success');
      return;
    }

    if (activeTextInput.withPill) {
      ctx.fillStyle = 'rgba(15, 15, 20, 0.90)';
      ctx.strokeStyle = currentColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(
        activeTextInput.x - paddingX,
        activeTextInput.y - paddingY,
        maxW + paddingX * 2,
        totalH + paddingY * 2,
        10
      );
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = currentColor;
      ctx.textBaseline = 'top';
      lines.forEach((line, idx) => {
        ctx.fillText(line, activeTextInput.x, activeTextInput.y + idx * lineHeight);
      });
    } else {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      ctx.fillStyle = currentColor;
      ctx.textBaseline = 'top';
      lines.forEach((line, idx) => {
        ctx.fillText(line, activeTextInput.x, activeTextInput.y + idx * lineHeight);
      });
    }

    ctx.restore();
    pushHistory();
    setActiveTextInput(null);
    onTriggerToast('Texto inserido com sucesso.', 'info');
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isEditingTitle && !activeTextInput) {
        setIsSpacePressed(true);
      }

      if (isEditingTitle || activeTextInput) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '=')) {
        e.preventDefault();
        setZoom(prev => Math.min(Math.round((prev + 0.15) * 100) / 100, 3));
      } else if ((e.ctrlKey || e.metaKey) && (e.key === '-' || e.key === '_')) {
        e.preventDefault();
        setZoom(prev => Math.max(Math.round((prev - 0.15) * 100) / 100, 0.2));
      } else if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault();
        setZoom(1);
        setPan({ x: 0, y: 0 });
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSaveToClips();
      } else if (e.key === 'Enter') {
        if (currentTool === 'crop' && cropRect) {
          e.preventDefault();
          executeCrop();
        }
      } else if (e.key === 'Escape') {
        if (currentTool === 'crop') {
          handleCancelCrop();
        }
      } else if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        // Direct single-key shortcuts
        const key = e.key.toLowerCase();
        if (key === 'p') setCurrentTool('brush');
        else if (key === 'h') setCurrentTool('highlighter');
        else if (key === 'a') setCurrentTool('arrow');
        else if (key === 'r') setCurrentTool('rectangle');
        else if (key === 'c') setCurrentTool('circle');
        else if (key === 't') {
          setCurrentTool('text');
          onTriggerToast('Modo Texto: clique em qualquer ponto da imagem.', 'info');
        }
        else if (key === 'b') setCurrentTool('censor');
        else if (key === 'n') setCurrentTool('step');
        else if (key === 'm') setCurrentTool('magnifier');
        else if (key === 'd') setCurrentTool('dimension');
        else if (key === 'q') setCurrentTool('callout');
        else if (key === 'x') setCurrentTool('crop');
        else if (key === 'f') setIsFrameOpen(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleUndo, handleRedo, isEditingTitle, activeTextInput, currentTool, cropRect, onTriggerToast]);

  // Non-passive wheel zoom listener to strictly prevent browser-level page zoom and zoom ONLY the canvas
  useEffect(() => {
    const handleGlobalWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        // Stop the browser from zooming the entire web page
        e.preventDefault();
        e.stopPropagation();

        // Calculate smooth zoom delta: scroll up zooms in, scroll down zooms out
        const delta = e.deltaY < 0 ? 0.12 : -0.12;
        setZoom(prev => {
          const next = Math.round((prev + delta) * 100) / 100;
          return Math.max(0.2, Math.min(3, next));
        });
      }
    };

    window.addEventListener('wheel', handleGlobalWheel, { passive: false });
    return () => {
      window.removeEventListener('wheel', handleGlobalWheel);
    };
  }, []);

  // Pixelate / Censor Filter helper
  const applyPixelateFilter = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
    const rx = Math.max(0, Math.min(x, x + w));
    const ry = Math.max(0, Math.min(y, y + h));
    const rw = Math.abs(w);
    const rh = Math.abs(h);

    if (rw < 4 || rh < 4) return;

    try {
      const imgData = ctx.getImageData(rx, ry, rw, rh);
      const pixelSize = 12;

      const offCanvas = document.createElement('canvas');
      const offW = Math.max(1, Math.floor(rw / pixelSize));
      const offH = Math.max(1, Math.floor(rh / pixelSize));
      offCanvas.width = offW;
      offCanvas.height = offH;

      const offCtx = offCanvas.getContext('2d');
      if (!offCtx) return;

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = rw;
      tempCanvas.height = rh;
      tempCanvas.getContext('2d')?.putImageData(imgData, 0, 0);

      offCtx.drawImage(tempCanvas, 0, 0, offW, offH);

      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(offCanvas, 0, 0, offW, offH, rx, ry, rw, rh);
      ctx.imageSmoothingEnabled = true;

      ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(rx, ry, rw, rh);
    } catch (err) {
      console.warn('Pixelate error:', err);
    }
  };

  // Draw Arrow helper
  const drawArrow = (ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number, width: number, color: string) => {
    const headLength = Math.max(16, width * 3.5);
    const dx = toX - fromX;
    const dy = toY - fromY;
    const angle = Math.atan2(dy, dx);

    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX - headLength * 0.5 * Math.cos(angle), toY - headLength * 0.5 * Math.sin(angle));
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headLength * Math.cos(angle - Math.PI / 6), toY - headLength * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(toX - headLength * Math.cos(angle + Math.PI / 6), toY - headLength * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  // Resize crop window according to active handle
  const handleCropResize = (coords: Point, start: { startX: number; startY: number; initialRect: CropRect }, handle: CropHandle) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dx = coords.x - start.startX;
    const dy = coords.y - start.startY;
    const init = start.initialRect;
    const ratio = ASPECT_RATIO_VALUES[cropAspect];

    let x = init.x;
    let y = init.y;
    let w = init.w;
    let h = init.h;

    const minSize = 30;

    if (handle === 'move') {
      let nx = init.x + dx;
      let ny = init.y + dy;
      nx = Math.max(0, Math.min(canvas.width - init.w, nx));
      ny = Math.max(0, Math.min(canvas.height - init.h, ny));
      setCropRect({ x: nx, y: ny, w: init.w, h: init.h });
      return;
    }

    if (!ratio) {
      switch (handle) {
        case 'se':
          w = Math.max(minSize, init.w + dx);
          h = Math.max(minSize, init.h + dy);
          break;
        case 's':
          h = Math.max(minSize, init.h + dy);
          break;
        case 'e':
          w = Math.max(minSize, init.w + dx);
          break;
        case 'sw':
          w = Math.max(minSize, init.w - dx);
          x = init.x + (init.w - w);
          h = Math.max(minSize, init.h + dy);
          break;
        case 'w':
          w = Math.max(minSize, init.w - dx);
          x = init.x + (init.w - w);
          break;
        case 'ne':
          w = Math.max(minSize, init.w + dx);
          h = Math.max(minSize, init.h - dy);
          y = init.y + (init.h - h);
          break;
        case 'n':
          h = Math.max(minSize, init.h - dy);
          y = init.y + (init.h - h);
          break;
        case 'nw':
          w = Math.max(minSize, init.w - dx);
          x = init.x + (init.w - w);
          h = Math.max(minSize, init.h - dy);
          y = init.y + (init.h - h);
          break;
      }
    } else {
      switch (handle) {
        case 'se':
        case 'e':
        case 's': {
          const rawW = Math.max(minSize, init.w + dx);
          const rawH = Math.max(minSize, init.h + dy);
          if (rawW / ratio < rawH) {
            w = rawW;
            h = Math.round(w / ratio);
          } else {
            h = rawH;
            w = Math.round(h * ratio);
          }
          break;
        }
        case 'sw':
        case 'w': {
          w = Math.max(minSize, init.w - dx);
          h = Math.round(w / ratio);
          x = init.x + (init.w - w);
          break;
        }
        case 'ne': {
          w = Math.max(minSize, init.w + dx);
          h = Math.round(w / ratio);
          y = init.y + (init.h - h);
          break;
        }
        case 'nw':
        case 'n': {
          w = Math.max(minSize, init.w - dx);
          h = Math.round(w / ratio);
          x = init.x + (init.w - w);
          y = init.y + (init.h - h);
          break;
        }
      }
    }

    if (x < 0) {
      w += x;
      x = 0;
    }
    if (y < 0) {
      h += y;
      y = 0;
    }
    if (x + w > canvas.width) {
      w = canvas.width - x;
    }
    if (y + h > canvas.height) {
      h = canvas.height - y;
    }

    if (w >= minSize && h >= minSize) {
      setCropRect({ x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) });
    }
  };

  // Mouse Handlers for Canvas
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 1 || (e.button === 0 && (isSpacePressed || e.altKey))) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }

    if (e.button !== 0) return;

    const coords = getCanvasCoords(e);

    // Crop tool handling
    if (currentTool === 'crop') {
      const handle = getCropHandleAt(coords);
      if (handle) {
        setActiveCropHandle(handle);
        setCropDragStart({
          startX: coords.x,
          startY: coords.y,
          initialRect: cropRect ? { ...cropRect } : { x: coords.x, y: coords.y, w: 0, h: 0 }
        });
      } else {
        const initial = { x: coords.x, y: coords.y, w: 0, h: 0 };
        setCropRect(initial);
        setActiveCropHandle('se');
        setCropDragStart({
          startX: coords.x,
          startY: coords.y,
          initialRect: initial
        });
      }
      return;
    }

    // Text tool handling: open inline popover directly on canvas
    if (currentTool === 'text') {
      setActiveTextInput({
        x: Math.round(coords.x),
        y: Math.round(coords.y),
        text: '',
        fontSize: Math.max(18, strokeWidth * 4.5),
        withPill: true
      });
      return;
    }

    setIsDrawing(true);
    setStartPoint(coords);

    const canvas = canvasRef.current;
    const overlay = overlayCanvasRef.current;
    if (!canvas || !overlay) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (currentTool === 'brush' || currentTool === 'highlighter') {
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = currentTool === 'highlighter' ? strokeWidth * 3 : strokeWidth;
      ctx.strokeStyle = currentTool === 'highlighter' ? `${currentColor}66` : currentColor;
    } else if (currentTool === 'step') {
      const radius = Math.max(14, strokeWidth * 3.5);
      ctx.save();
      ctx.beginPath();
      ctx.arc(coords.x, coords.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = currentColor;
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      ctx.fillStyle = currentColor === '#ffffff' ? '#18181b' : '#ffffff';
      ctx.font = `bold ${Math.round(radius * 1.1)}px "JetBrains Mono", monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(stepCounter.toString(), coords.x, coords.y + 1);
      ctx.restore();

      setStepCounter(prev => prev + 1);
      setIsDrawing(false);
      pushHistory();
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
      return;
    }

    const coords = getCanvasCoords(e);

    if (currentTool === 'crop') {
      if (activeCropHandle && cropDragStart) {
        handleCropResize(coords, cropDragStart, activeCropHandle);
      } else {
        const handle = getCropHandleAt(coords);
        setHoveredCropHandle(handle);
      }
      return;
    }

    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const overlay = overlayCanvasRef.current;
    if (!canvas || !overlay) return;

    const ctx = canvas.getContext('2d');
    const octx = overlay.getContext('2d');
    if (!ctx || !octx) return;

    if (currentTool === 'brush' || currentTool === 'highlighter') {
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    } else {
      octx.clearRect(0, 0, overlay.width, overlay.height);
      octx.save();
      octx.lineWidth = strokeWidth;
      octx.strokeStyle = currentColor;
      octx.fillStyle = filled ? currentColor : 'transparent';
      octx.lineCap = 'round';
      octx.lineJoin = 'round';

      const w = coords.x - startPoint.x;
      const h = coords.y - startPoint.y;

      if (currentTool === 'rectangle') {
        octx.beginPath();
        octx.rect(startPoint.x, startPoint.y, w, h);
        if (filled) octx.fill();
        octx.stroke();
      } else if (currentTool === 'circle') {
        octx.beginPath();
        octx.ellipse(
          startPoint.x + w / 2, 
          startPoint.y + h / 2, 
          Math.abs(w / 2), 
          Math.abs(h / 2), 
          0, 0, Math.PI * 2
        );
        if (filled) octx.fill();
        octx.stroke();
      } else if (currentTool === 'arrow') {
        drawArrow(octx, startPoint.x, startPoint.y, coords.x, coords.y, strokeWidth, currentColor);
      } else if (currentTool === 'censor') {
        octx.strokeStyle = '#f59e0b';
        octx.setLineDash([6, 6]);
        octx.lineWidth = 2;
        octx.strokeRect(startPoint.x, startPoint.y, w, h);
        octx.fillStyle = 'rgba(245, 158, 11, 0.15)';
        octx.fillRect(startPoint.x, startPoint.y, w, h);
      } else if (currentTool === 'magnifier') {
        const radius = Math.max(25, Math.hypot(coords.x - startPoint.x, coords.y - startPoint.y));
        octx.save();
        octx.beginPath();
        octx.arc(startPoint.x, startPoint.y, radius, 0, Math.PI * 2);
        octx.clip();
        const zoomFactor = 2.0;
        const srcW = (radius * 2) / zoomFactor;
        const srcH = (radius * 2) / zoomFactor;
        octx.drawImage(
          canvas,
          startPoint.x - srcW / 2,
          startPoint.y - srcH / 2,
          srcW,
          srcH,
          startPoint.x - radius,
          startPoint.y - radius,
          radius * 2,
          radius * 2
        );
        octx.restore();

        octx.save();
        octx.beginPath();
        octx.arc(startPoint.x, startPoint.y, radius, 0, Math.PI * 2);
        octx.lineWidth = Math.max(3, strokeWidth);
        octx.strokeStyle = currentColor;
        octx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        octx.shadowBlur = 8;
        octx.stroke();

        const badgeText = '2.0×';
        octx.font = 'bold 11px "JetBrains Mono", monospace';
        const badgeW = octx.measureText(badgeText).width + 14;
        octx.fillStyle = 'rgba(24, 24, 27, 0.95)';
        octx.beginPath();
        octx.roundRect(startPoint.x - badgeW / 2, startPoint.y + radius - 10, badgeW, 20, 10);
        octx.fill();
        octx.strokeStyle = currentColor;
        octx.lineWidth = 1.5;
        octx.stroke();
        octx.fillStyle = currentColor;
        octx.textAlign = 'center';
        octx.textBaseline = 'middle';
        octx.fillText(badgeText, startPoint.x, startPoint.y + radius);
        octx.restore();
      } else if (currentTool === 'dimension') {
        const dist = Math.round(Math.hypot(coords.x - startPoint.x, coords.y - startPoint.y));
        const angle = Math.atan2(coords.y - startPoint.y, coords.x - startPoint.x);
        const normal = angle + Math.PI / 2;
        const capLen = 7;

        octx.save();
        octx.strokeStyle = currentColor;
        octx.fillStyle = currentColor;
        octx.lineWidth = Math.max(2, strokeWidth * 0.75);
        octx.lineCap = 'round';

        octx.beginPath();
        octx.moveTo(startPoint.x, startPoint.y);
        octx.lineTo(coords.x, coords.y);
        octx.stroke();

        octx.beginPath();
        octx.moveTo(startPoint.x + Math.cos(normal) * capLen, startPoint.y + Math.sin(normal) * capLen);
        octx.lineTo(startPoint.x - Math.cos(normal) * capLen, startPoint.y - Math.sin(normal) * capLen);
        octx.stroke();

        octx.beginPath();
        octx.moveTo(coords.x + Math.cos(normal) * capLen, coords.y + Math.sin(normal) * capLen);
        octx.lineTo(coords.x - Math.cos(normal) * capLen, coords.y - Math.sin(normal) * capLen);
        octx.stroke();

        const midX = (startPoint.x + coords.x) / 2;
        const midY = (startPoint.y + coords.y) / 2;
        const label = `${dist} px`;
        octx.font = 'bold 11px "JetBrains Mono", monospace';
        const textW = octx.measureText(label).width;
        const badgeW = textW + 14;
        const badgeH = 20;

        octx.fillStyle = 'rgba(24, 24, 27, 0.92)';
        octx.beginPath();
        octx.roundRect(midX - badgeW / 2, midY - badgeH / 2, badgeW, badgeH, 6);
        octx.fill();
        octx.strokeStyle = currentColor;
        octx.lineWidth = 1.2;
        octx.stroke();

        octx.fillStyle = currentColor;
        octx.textAlign = 'center';
        octx.textBaseline = 'middle';
        octx.fillText(label, midX, midY);
        octx.restore();
      } else if (currentTool === 'callout') {
        octx.save();
        octx.strokeStyle = currentColor;
        octx.fillStyle = currentColor;
        octx.lineWidth = 2;

        // Pin point at target
        octx.beginPath();
        octx.arc(startPoint.x, startPoint.y, 4, 0, Math.PI * 2);
        octx.fill();

        // Connecting line
        octx.beginPath();
        octx.moveTo(startPoint.x, startPoint.y);
        octx.lineTo(coords.x, coords.y);
        octx.stroke();

        // Preview bubble box
        octx.fillStyle = 'rgba(24, 24, 27, 0.9)';
        octx.beginPath();
        octx.roundRect(coords.x - 10, coords.y - 12, 130, 36, 8);
        octx.fill();
        octx.stroke();

        octx.fillStyle = currentColor;
        octx.font = '11px "Plus Jakarta Sans", system-ui, sans-serif';
        octx.textAlign = 'center';
        octx.textBaseline = 'middle';
        octx.fillText('Solte para anotar...', coords.x + 55, coords.y + 6);
        octx.restore();
      }

      octx.restore();
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (currentTool === 'crop') {
      if (cropRect && (cropRect.w < 20 || cropRect.h < 20)) {
        initCropRect(cropAspect);
      }
      setActiveCropHandle(null);
      setCropDragStart(null);
      return;
    }

    if (!isDrawing) return;
    setIsDrawing(false);

    const coords = getCanvasCoords(e);
    const canvas = canvasRef.current;
    const overlay = overlayCanvasRef.current;
    if (!canvas || !overlay) return;

    const ctx = canvas.getContext('2d');
    const octx = overlay.getContext('2d');
    if (!ctx || !octx) return;

    octx.clearRect(0, 0, overlay.width, overlay.height);

    const w = coords.x - startPoint.x;
    const h = coords.y - startPoint.y;

    if (currentTool === 'rectangle') {
      ctx.save();
      ctx.lineWidth = strokeWidth;
      ctx.strokeStyle = currentColor;
      ctx.fillStyle = filled ? currentColor : 'transparent';
      ctx.beginPath();
      ctx.rect(startPoint.x, startPoint.y, w, h);
      if (filled) ctx.fill();
      ctx.stroke();
      ctx.restore();
      pushHistory();
    } else if (currentTool === 'circle') {
      ctx.save();
      ctx.lineWidth = strokeWidth;
      ctx.strokeStyle = currentColor;
      ctx.fillStyle = filled ? currentColor : 'transparent';
      ctx.beginPath();
      ctx.ellipse(
        startPoint.x + w / 2, 
        startPoint.y + h / 2, 
        Math.abs(w / 2), 
        Math.abs(h / 2), 
        0, 0, Math.PI * 2
      );
      if (filled) ctx.fill();
      ctx.stroke();
      ctx.restore();
      pushHistory();
    } else if (currentTool === 'arrow') {
      drawArrow(ctx, startPoint.x, startPoint.y, coords.x, coords.y, strokeWidth, currentColor);
      pushHistory();
    } else if (currentTool === 'censor') {
      applyPixelateFilter(ctx, startPoint.x, startPoint.y, w, h);
      pushHistory();
      onTriggerToast('Área censurada com sucesso.', 'info');
    } else if (currentTool === 'magnifier') {
      const radius = Math.max(25, Math.hypot(coords.x - startPoint.x, coords.y - startPoint.y));
      ctx.save();
      ctx.beginPath();
      ctx.arc(startPoint.x, startPoint.y, radius, 0, Math.PI * 2);
      ctx.clip();
      const zoomFactor = 2.0;
      const srcW = (radius * 2) / zoomFactor;
      const srcH = (radius * 2) / zoomFactor;
      ctx.drawImage(
        canvas,
        startPoint.x - srcW / 2,
        startPoint.y - srcH / 2,
        srcW,
        srcH,
        startPoint.x - radius,
        startPoint.y - radius,
        radius * 2,
        radius * 2
      );
      ctx.restore();

      ctx.save();
      ctx.beginPath();
      ctx.arc(startPoint.x, startPoint.y, radius, 0, Math.PI * 2);
      ctx.lineWidth = Math.max(3, strokeWidth);
      ctx.strokeStyle = currentColor;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      ctx.shadowBlur = 8;
      ctx.stroke();

      const badgeText = '2.0×';
      ctx.font = 'bold 11px "JetBrains Mono", monospace';
      const badgeW = ctx.measureText(badgeText).width + 14;
      ctx.fillStyle = 'rgba(24, 24, 27, 0.95)';
      ctx.beginPath();
      ctx.roundRect(startPoint.x - badgeW / 2, startPoint.y + radius - 10, badgeW, 20, 10);
      ctx.fill();
      ctx.strokeStyle = currentColor;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = currentColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(badgeText, startPoint.x, startPoint.y + radius);
      ctx.restore();

      pushHistory();
      onTriggerToast('Destaque com lupa aplicado!', 'info');
    } else if (currentTool === 'dimension') {
      const dist = Math.round(Math.hypot(coords.x - startPoint.x, coords.y - startPoint.y));
      const angle = Math.atan2(coords.y - startPoint.y, coords.x - startPoint.x);
      const normal = angle + Math.PI / 2;
      const capLen = 7;

      ctx.save();
      ctx.strokeStyle = currentColor;
      ctx.fillStyle = currentColor;
      ctx.lineWidth = Math.max(2, strokeWidth * 0.75);
      ctx.lineCap = 'round';

      ctx.beginPath();
      ctx.moveTo(startPoint.x, startPoint.y);
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(startPoint.x + Math.cos(normal) * capLen, startPoint.y + Math.sin(normal) * capLen);
      ctx.lineTo(startPoint.x - Math.cos(normal) * capLen, startPoint.y - Math.sin(normal) * capLen);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(coords.x + Math.cos(normal) * capLen, coords.y + Math.sin(normal) * capLen);
      ctx.lineTo(coords.x - Math.cos(normal) * capLen, coords.y - Math.sin(normal) * capLen);
      ctx.stroke();

      const midX = (startPoint.x + coords.x) / 2;
      const midY = (startPoint.y + coords.y) / 2;
      const label = `${dist} px`;
      ctx.font = 'bold 11px "JetBrains Mono", monospace';
      const textW = ctx.measureText(label).width;
      const badgeW = textW + 14;
      const badgeH = 20;

      ctx.fillStyle = 'rgba(24, 24, 27, 0.92)';
      ctx.beginPath();
      ctx.roundRect(midX - badgeW / 2, midY - badgeH / 2, badgeW, badgeH, 6);
      ctx.fill();
      ctx.strokeStyle = currentColor;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.fillStyle = currentColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, midX, midY);
      ctx.restore();

      pushHistory();
      onTriggerToast(`Régua de medição: ${dist} px aplicada!`, 'info');
    } else if (currentTool === 'callout') {
      setActiveTextInput({
        x: Math.round(coords.x),
        y: Math.round(coords.y),
        text: '',
        fontSize: Math.max(16, strokeWidth * 4),
        withPill: true,
        isCallout: true,
        targetPoint: { x: Math.round(startPoint.x), y: Math.round(startPoint.y) }
      });
      return;
    } else if (currentTool === 'brush' || currentTool === 'highlighter') {
      pushHistory();
    }
  };

  // Determine dynamic canvas cursor
  const getCanvasCursor = (): string => {
    if (isPanning || isSpacePressed) return isPanning ? 'grabbing' : 'grab';
    if (currentTool === 'crop') {
      const handle = activeCropHandle || hoveredCropHandle;
      switch (handle) {
        case 'nw':
        case 'se':
          return 'nwse-resize';
        case 'ne':
        case 'sw':
          return 'nesw-resize';
        case 'n':
        case 's':
          return 'ns-resize';
        case 'w':
        case 'e':
          return 'ew-resize';
        case 'move':
          return 'move';
        default:
          return 'crosshair';
      }
    }
    if (currentTool === 'text') return 'text';
    return 'crosshair';
  };

  // Rotate 90° Clockwise
  const handleRotate = () => {
    const canvas = canvasRef.current;
    const overlay = overlayCanvasRef.current;
    if (!canvas || !overlay) return;

    const off = document.createElement('canvas');
    off.width = canvas.width;
    off.height = canvas.height;
    off.getContext('2d')?.drawImage(canvas, 0, 0);

    canvas.width = off.height;
    canvas.height = off.width;
    overlay.width = off.height;
    overlay.height = off.width;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(Math.PI / 2);
      ctx.drawImage(off, -off.width / 2, -off.height / 2);
      setImageDims({ w: canvas.width, h: canvas.height });
      pushHistory();
      onTriggerToast('Imagem girada em 90°', 'info');
    }
  };

  // Flip Horizontal
  const handleFlipH = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const off = document.createElement('canvas');
    off.width = canvas.width;
    off.height = canvas.height;
    off.getContext('2d')?.drawImage(canvas, 0, 0);

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.save();
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(off, 0, 0);
      ctx.restore();
      pushHistory();
      onTriggerToast('Imagem invertida horizontalmente.', 'info');
    }
  };

  // Clear Annotations (restore initial state)
  const handleClear = () => {
    if (history.length > 0) {
      const initial = history[0];
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (canvas && ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          pushHistory();
          setStepCounter(1);
          onTriggerToast('Anotações limpas.', 'info');
        }
      };
      img.src = initial;
    }
  };

  // Copy final canvas image to system clipboard
  const handleCopyImageToClipboard = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      canvas.toBlob(async (blob) => {
        if (blob) {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          setCopiedSuccess(true);
          setTimeout(() => setCopiedSuccess(false), 2000);
          onTriggerToast('Imagem copiada para a área de transferência!', 'success');
        }
      }, 'image/png');
    } catch (err) {
      console.error('Clipboard write error:', err);
      onTriggerToast('Erro ao copiar imagem. Permissão negada pelo navegador.', 'error');
    }
  };

  // Save to My Clips in IndexedDB
  const handleSaveToClips = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    await saveClip(dataUrl, title, ['Geral'], canvas.width, canvas.height);
    onSavedToClips();
    onTriggerToast('Captura salva em "Meus Clips"!', 'success');
  };

  // Direct Download
  const handleQuickDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `${title.replace(/\s+/g, '_').toLowerCase()}.png`;
    a.click();
    onTriggerToast('Download concluído.', 'success');
  };

  // Apply Framed Composite Image back to Editor Canvas
  const handleApplyFramedImage = (dataUrl: string) => {
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      const overlay = overlayCanvasRef.current;
      if (!canvas || !overlay) return;

      canvas.width = img.width;
      canvas.height = img.height;
      overlay.width = img.width;
      overlay.height = img.height;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, img.width, img.height);
        ctx.drawImage(img, 0, 0);
        setImageDims({ w: img.width, h: img.height });
        pushHistory();
        onTriggerToast('Moldura de apresentação aplicada com sucesso!', 'success');
      }
    };
    img.src = dataUrl;
  };

  // Register editor actions with parent
  useEffect(() => {
    if (onRegisterEditorActions) {
      onRegisterEditorActions({
        selectTool: (t: ToolType) => setCurrentTool(t),
        openFrameModal: () => setIsFrameOpen(true),
        copyImage: handleCopyImageToClipboard,
        saveImage: handleSaveToClips,
        downloadImage: handleQuickDownload
      });
    }
  }, [onRegisterEditorActions, handleCopyImageToClipboard, handleSaveToClips, handleQuickDownload]);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] w-full bg-obsidian-950 overflow-hidden">
      
      {/* Top Controls Bar */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-2.5 bg-obsidian-900 border-b border-zinc-800 gap-2 w-full overflow-hidden">
        
        {/* Left Actions: Back & Editable Title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold border border-zinc-700/60 transition-colors shrink-0"
            title={strings.editor.back}
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">{strings.editor.back}</span>
          </button>

          <div className="h-4 w-[1px] bg-zinc-800 shrink-0" />

          {/* Editable Title */}
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            {isEditingTitle ? (
              <input
                type="text"
                value={title}
                autoFocus
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => setIsEditingTitle(false)}
                onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
                className="bg-obsidian-950 border border-amber-500/80 rounded-lg px-2.5 py-1 text-xs sm:text-sm font-bold text-white focus:outline-none max-w-[120px] sm:max-w-xs"
              />
            ) : (
              <div 
                onClick={() => setIsEditingTitle(true)}
                className="flex items-center gap-1.5 cursor-pointer group min-w-0"
                title={strings.editor.textModal.title}
              >
                <span className="text-xs sm:text-sm font-bold text-zinc-200 group-hover:text-amber-accent transition-colors max-w-[110px] sm:max-w-[180px] md:max-w-xs truncate">
                  {title}
                </span>
                <FileEdit className="w-3.5 h-3.5 text-zinc-500 group-hover:text-amber-accent transition-colors shrink-0" />
              </div>
            )}
            
            <span className="hidden md:inline-block text-[11px] font-mono text-zinc-500 bg-obsidian-950 px-2 py-0.5 rounded border border-zinc-800 shrink-0">
              {imageDims.w} × {imageDims.h} px
            </span>
          </div>
        </div>

        {/* Right Actions: Copy, Save, Share, Download */}
        <div data-tour="editor-top-actions" className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          
          {/* Quick Copy to Clipboard Button */}
          <button
            onClick={handleCopyImageToClipboard}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-zinc-800/90 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs border border-zinc-700/80 transition-all active:scale-95 shadow-sm shrink-0"
            title={strings.editor.copyImage}
          >
            {copiedSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">{strings.common.copied}</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{strings.editor.copyImage}</span>
              </>
            )}
          </button>

          {/* Save to Local Clips Button */}
          <button
            onClick={handleSaveToClips}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-zinc-800/90 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs border border-zinc-700/80 transition-all active:scale-95 shadow-sm shrink-0"
            title={strings.editor.saveClip}
          >
            <Save className="w-3.5 h-3.5 text-amber-accent" />
            <span className="hidden sm:inline">{strings.editor.saveClip}</span>
          </button>

          {/* Quick Download */}
          <button
            onClick={handleQuickDownload}
            className="flex items-center gap-1.5 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-zinc-800/90 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs border border-zinc-700/80 transition-all shrink-0"
            title={strings.editor.download}
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {/* Share Button (Primary Accent) */}
          <button
            onClick={() => setIsShareOpen(true)}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-xl bg-amber-accent hover:bg-amber-glow text-obsidian-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all hover:scale-105 active:scale-95 shrink-0"
          >
            <Share2 className="w-3.5 h-3.5 text-obsidian-950" />
            <span className="hidden sm:inline">{strings.editor.share}</span>
          </button>

        </div>

      </div>

      {/* Tools Toolbar */}
      <EditorToolbar
        currentTool={currentTool}
        setCurrentTool={setCurrentTool}
        currentColor={currentColor}
        setCurrentColor={setCurrentColor}
        strokeWidth={strokeWidth}
        setStrokeWidth={setStrokeWidth}
        filled={filled}
        setFilled={setFilled}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onClear={handleClear}
        onRotate={handleRotate}
        onFlipH={handleFlipH}
        zoom={zoom}
        onZoomIn={() => setZoom(prev => Math.min(prev + 0.15, 3))}
        onZoomOut={() => setZoom(prev => Math.max(prev - 0.15, 0.2))}
        onZoomReset={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
        cropAspect={cropAspect}
        setCropAspect={handleCropAspectChange}
        onApplyCrop={executeCrop}
        onCancelCrop={handleCancelCrop}
        onOpenFrameModal={() => setIsFrameOpen(true)}
      />

      {/* Main Canvas Workspace Area */}
      <div 
        ref={containerRef}
        className="relative flex-1 w-full bg-obsidian-950 overflow-hidden flex items-center justify-center bg-grid-dots"
      >
        
        {/* Canvas Presentation Wrapper */}
        <div
          data-tour="editor-canvas"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
            transition: isPanning ? 'none' : 'transform 0.1s ease-out'
          }}
          className="relative shadow-2xl shadow-black/80 rounded-lg overflow-visible border border-zinc-800"
        >
          {/* Main Drawing Canvas */}
          <canvas
            ref={canvasRef}
            style={{ cursor: getCanvasCursor() }}
            className="block max-w-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onDoubleClick={() => {
              if (currentTool === 'crop' && cropRect) {
                executeCrop();
              }
            }}
          />

          {/* Interaction Overlay Canvas */}
          <canvas
            ref={overlayCanvasRef}
            className="absolute inset-0 pointer-events-none"
          />

          {/* Floating Crop Action Controls Bar directly under the crop window */}
          {currentTool === 'crop' && cropRect && (
            <div 
              style={{
                position: 'absolute',
                left: `${cropRect.x + cropRect.w / 2}px`,
                top: `${cropRect.y + cropRect.h + 14}px`,
                transform: 'translateX(-50%)'
              }}
              className="z-40 flex items-center gap-2 bg-obsidian-900/95 border border-zinc-700/80 px-3.5 py-2 rounded-2xl shadow-2xl backdrop-blur-md animate-in fade-in duration-150 whitespace-nowrap"
            >
              <div className="flex items-center gap-1.5 pr-2 border-r border-zinc-800">
                <span className="text-[10px] font-bold text-amber-accent font-mono uppercase">
                  {cropAspect === 'free' ? strings.editor.crop.free : cropAspect}
                </span>
                <span className="text-[11px] font-mono text-zinc-300 font-semibold">
                  {Math.round(cropRect.w)} × {Math.round(cropRect.h)} px
                </span>
              </div>
              <button
                onClick={executeCrop}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-accent text-obsidian-950 font-bold text-xs hover:bg-amber-glow shadow-md shadow-amber-500/20 transition-all active:scale-95"
                title={`${strings.common.apply} (Enter)`}
              >
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{strings.common.apply}</span>
              </button>
              <button
                onClick={handleCancelCrop}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition-colors"
                title={`${strings.common.cancel} (Esc)`}
              >
                <X className="w-3.5 h-3.5" />
                <span>{strings.common.cancel}</span>
              </button>
            </div>
          )}

          {/* Inline On-Canvas Text Input Card (No prompt!) */}
          {activeTextInput && (
            <div
              style={{
                position: 'absolute',
                left: `${Math.min(activeTextInput.x, Math.max(0, (canvasRef.current?.width || 800) - 290))}px`,
                top: `${Math.max(10, activeTextInput.y - 120)}px`,
              }}
              className="z-50 bg-obsidian-900/95 border border-amber-500/50 rounded-2xl p-3.5 shadow-2xl shadow-black/90 backdrop-blur-xl w-72 flex flex-col gap-2.5 animate-in fade-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between text-xs pb-1 border-b border-zinc-800">
                <span className="font-bold text-amber-accent flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5" />
                  {strings.editor.textModal.title}
                </span>
                <button
                  onClick={() => setActiveTextInput(null)}
                  className="text-zinc-500 hover:text-zinc-300 p-0.5 rounded-lg"
                  title={`${strings.editor.textModal.cancel} (Esc)`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Text Area */}
              <textarea
                autoFocus
                rows={2}
                value={activeTextInput.text}
                onChange={(e) => setActiveTextInput(prev => prev ? { ...prev, text: e.target.value } : null)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    commitTextInput();
                  } else if (e.key === 'Escape') {
                    setActiveTextInput(null);
                  }
                }}
                placeholder={strings.editor.textModal.placeholder}
                className="w-full bg-obsidian-950 border border-zinc-700/80 focus:border-amber-accent rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none resize-none font-medium"
              />

              {/* Controls: Size & Pill toggle */}
              <div className="flex items-center justify-between gap-2 pt-0.5">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-zinc-400 font-mono">{strings.editor.textModal.fontSize}:</span>
                  <select
                    value={activeTextInput.fontSize}
                    onChange={(e) => setActiveTextInput(prev => prev ? { ...prev, fontSize: Number(e.target.value) } : null)}
                    className="bg-obsidian-950 border border-zinc-700 text-zinc-200 text-[11px] rounded-lg px-2 py-0.5 focus:outline-none focus:border-amber-accent font-mono"
                  >
                    <option value={14}>14px</option>
                    <option value={18}>18px</option>
                    <option value={24}>24px</option>
                    <option value={32}>32px</option>
                    <option value={44}>44px</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTextInput(prev => prev ? { ...prev, withPill: !prev.withPill } : null)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-semibold border transition-all ${
                    activeTextInput.withPill
                      ? 'bg-amber-500/20 text-amber-accent border-amber-500/40'
                      : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-zinc-200'
                  }`}
                  title={strings.editor.textModal.darkBg}
                >
                  {activeTextInput.withPill ? `✓ ${strings.editor.textModal.darkBg}` : strings.editor.textModal.cleanText}
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-1 border-t border-zinc-800">
                <button
                  onClick={() => setActiveTextInput(null)}
                  className="px-2.5 py-1 text-xs text-zinc-400 hover:text-zinc-200 font-medium transition-colors"
                >
                  {strings.editor.textModal.cancel}
                </button>
                <button
                  onClick={commitTextInput}
                  disabled={!activeTextInput.text.trim()}
                  className="px-3.5 py-1 text-xs font-bold rounded-xl bg-amber-accent text-obsidian-950 hover:bg-amber-glow disabled:opacity-40 disabled:cursor-not-allowed shadow-md transition-all active:scale-95"
                >
                  {strings.editor.textModal.insert}
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Floating Quick Helper Badge in bottom left */}
        <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-obsidian-900/80 border border-zinc-800/80 backdrop-blur-md text-[11px] text-zinc-400">
          <span>{strings.editor.panTip}</span>
          {currentTool === 'crop' && (
            <>
              <span className="mx-1">•</span>
              <span className="kbd-badge text-[10px]">Enter</span>
              <span className="text-amber-accent font-medium">{strings.common.apply}</span>
            </>
          )}
        </div>

      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        imageDataUrl={canvasRef.current?.toDataURL('image/png') || initialImage}
        imageTitle={title}
        onTriggerToast={onTriggerToast}
      />

      {/* Frame Presentation Modal */}
      <FrameModal
        isOpen={isFrameOpen}
        onClose={() => setIsFrameOpen(false)}
        sourceCanvas={canvasRef.current}
        title={title}
        onApplyToCanvas={handleApplyFramedImage}
        onTriggerToast={onTriggerToast}
      />

    </div>
  );
};
