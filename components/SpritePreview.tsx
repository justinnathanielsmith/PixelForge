import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AnimationSettings } from '../types';
import { imageProcessingService } from '../services/imageProcessingService';

interface SpritePreviewProps {
  imageUrl: string;
  settings: AnimationSettings;
  style: string;
}

const SpritePreview: React.FC<SpritePreviewProps> = ({ imageUrl, settings, style }) => {
  const [currentFrame, setCurrentFrame] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const drawCheckerboard = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const size = 16;
    for (let y = 0; y < height; y += size) {
      for (let x = 0; x < width; x += size) {
        ctx.fillStyle = ((x / size + y / size) % 2 === 0) ? '#1c1917' : '#292524';
        ctx.fillRect(x, y, size, size);
      }
    }
  }, []);

  const renderFrame = useCallback((frame: number) => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Use shared logic to process the single frame (scale, filter, chroma key)
    const processedFrame = imageProcessingService.processFrame(img, frame, settings, style);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;

    // Background handling
    if (settings.autoTransparency) {
      drawCheckerboard(ctx, canvas.width, canvas.height);
    } else if (settings.showGuides || settings.tiledPreview) {
      ctx.fillStyle = '#0a0807';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Onion Skinning (draw previous frame with low opacity)
    const hasMultipleFrames = (settings.rows * settings.cols) > 1;
    if (settings.onionSkin && !settings.tiledPreview && hasMultipleFrames) {
       const total = settings.rows * settings.cols;
       const prevFrameIdx = (frame - 1 + total) % total;
       const prevFrameCanvas = imageProcessingService.processFrame(img, prevFrameIdx, settings, style);
       
       ctx.globalAlpha = 0.3;
       drawProcessedFrameToCanvas(ctx, prevFrameCanvas, settings);
       ctx.globalAlpha = 1.0;
    }

    // Draw Current Frame
    drawProcessedFrameToCanvas(ctx, processedFrame, settings);

    // Guides
    if (settings.showGuides && !settings.tiledPreview) {
      drawGuides(ctx, canvas.width, canvas.height);
    }

  }, [settings, style, drawCheckerboard]);

  const drawProcessedFrameToCanvas = (ctx: CanvasRenderingContext2D, sourceFrame: HTMLCanvasElement, settings: AnimationSettings) => {
    const canvas = ctx.canvas;
    
    if (settings.tiledPreview) {
      // Calculate tile size as roughly 1/3 of the canvas at 1.0 zoom
      const tileSize = Math.round((canvas.width / 3) * settings.zoom);
      
      // Calculate start position to center the central tile (x=0, y=0)
      const startX = Math.floor((canvas.width - tileSize) / 2);
      const startY = Math.floor((canvas.height - tileSize) / 2);

      for (let x = -1; x <= 1; x++) {
        for (let y = -1; y <= 1; y++) {
          const dx = startX + (x * tileSize);
          const dy = startY + (y * tileSize);
          
          ctx.drawImage(
            sourceFrame, 
            0, 0, sourceFrame.width, sourceFrame.height, 
            dx, dy, tileSize, tileSize
          );
          
          // Add a subtle border to the central tile to indicate primary source
          if (x === 0 && y === 0) {
            ctx.strokeStyle = 'rgba(217, 119, 6, 0.4)';
            ctx.lineWidth = 2;
            ctx.strokeRect(dx, dy, tileSize, tileSize);
          }
        }
      }
    } else {
      const dw = Math.round(canvas.width * settings.zoom);
      const dh = Math.round(canvas.height * settings.zoom);
      const dx = Math.floor((canvas.width - dw) / 2);
      const dy = Math.floor((canvas.height - dh) / 2);
      ctx.drawImage(sourceFrame, 0, 0, sourceFrame.width, sourceFrame.height, dx, dy, dw, dh);
    }
  };

  const drawGuides = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      ctx.strokeStyle = 'rgba(217, 119, 6, 0.3)'; 
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(width / 2, 0); ctx.lineTo(width / 2, height);
      ctx.moveTo(0, height / 2); ctx.lineTo(width, height / 2);
      ctx.stroke();
      ctx.setLineDash([]);
  };

  // Image Loading Effect
  useEffect(() => {
    const img = new Image();
    img.src = imageUrl;
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imageRef.current = img;
      renderFrame(currentFrame);
    };
  }, [imageUrl, renderFrame]);

  // Animation Loop Effect
  useEffect(() => {
    let interval: number | undefined;
    if (settings.isPlaying) {
      interval = window.setInterval(() => {
        setCurrentFrame((prev) => (prev + 1) % (settings.rows * settings.cols));
      }, 1000 / settings.fps);
    } else if (!settings.isPlaying) {
      setCurrentFrame(0);
    }
    return () => clearInterval(interval);
  }, [settings.isPlaying, settings.fps, settings.rows, settings.cols]);

  // Render Trigger Effect
  useEffect(() => {
    if (imageRef.current) {
      renderFrame(currentFrame);
    }
  }, [currentFrame, renderFrame]);

  return (
    <div className="flex flex-col gap-2 w-full h-full">
      <div className="relative flex-1 bg-[#020202] flex items-center justify-center overflow-hidden group border border-[#292524] shadow-inner">
        
        {/* Main Viewport Overlay: Vignette for Tiled mode */}
        {settings.tiledPreview && (
          <div className="absolute inset-0 pointer-events-none z-10 shadow-[inset_0_0_100px_rgba(0,0,0,0.8)]" />
        )}

        <canvas 
          ref={canvasRef} 
          width={512} 
          height={512} 
          className="max-w-full max-h-full object-contain image-pixelated z-0" 
          style={{ imageRendering: 'pixelated' }} 
        />
        
        {/* Status Indicators Top-Right */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end z-30">
            {settings.paletteLock && (
              <div className="bg-red-950/80 border border-red-500/50 px-2 py-0.5 rounded shadow-lg backdrop-blur-sm flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <span className="fantasy-font text-[8px] text-red-200 font-bold uppercase tracking-widest">Spectral Constraint</span>
              </div>
            )}
            {settings.autoTransparency && (
              <div className="bg-emerald-950/80 border border-emerald-500/50 px-2 py-0.5 rounded shadow-lg backdrop-blur-sm flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="fantasy-font text-[8px] text-emerald-200 font-bold uppercase tracking-widest">Transparency Rite</span>
              </div>
            )}
            {settings.onionSkin && (
              <div className="bg-indigo-950/80 border border-indigo-500/50 px-2 py-0.5 rounded shadow-lg backdrop-blur-sm flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 opacity-60" />
                <span className="fantasy-font text-[8px] text-indigo-200 font-bold uppercase tracking-widest">Ghost Echo</span>
              </div>
            )}
        </div>

        {/* Mode Indicators Top-Left */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start z-30">
            {settings.tiledPreview && (
              <div className="bg-amber-950/90 border border-amber-600 px-2 py-1 rounded shadow-xl backdrop-blur-sm">
                <span className="fantasy-font text-[9px] text-amber-400 font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                  <span className="text-xs">⊞</span> SEAMLESS NEXUS
                </span>
              </div>
            )}
            {settings.showGuides && (
              <div className="bg-sky-950/60 border border-sky-600/40 px-2 py-0.5 rounded shadow-md backdrop-blur-sm">
                <span className="fantasy-font text-[8px] text-sky-300 font-bold uppercase tracking-widest flex items-center gap-1.5">
                   <span className="opacity-50">＋</span> Alignment Axis
                </span>
              </div>
            )}
        </div>

        {/* Frame / Playback Status Bottom Area */}
        <div className="absolute bottom-3 left-3 flex gap-2 items-center z-20">
           <div className="bg-black/80 border border-stone-800 px-2 py-1 rounded backdrop-blur-md flex items-center gap-3">
              <span className="terminal-font text-[10px] text-stone-300 font-bold tracking-wider">
                {settings.tiledPreview ? 'LOOP-VIEW' : `FRAME ${String(currentFrame + 1).padStart(2, '0')}`}
              </span>
              <div className="w-px h-3 bg-stone-800" />
              <span className="terminal-font text-[10px] text-amber-600/80 font-bold">
                {settings.fps} FPS
              </span>
           </div>
           
           {settings.isPlaying && (
              <div className="flex gap-0.5">
                {[...Array(4)].map((_, i) => (
                  <div 
                    key={i} 
                    className="w-1 h-3 bg-emerald-600/40 animate-pulse" 
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
           )}
        </div>

        {/* Resolution Badge Bottom-Right */}
        <div className="absolute bottom-3 right-3 bg-black/70 border border-stone-800 px-2 py-1 z-20 rounded shadow-md backdrop-blur-md">
          <span className="terminal-font text-[10px] text-stone-500 font-bold tracking-widest uppercase">
            {settings.targetResolution}px RES
          </span>
        </div>
      </div>
    </div>
  );
};

export default SpritePreview;