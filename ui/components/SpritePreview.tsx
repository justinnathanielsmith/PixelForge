import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AnimationSettings, Skeleton } from '../../domain/entities';
import { imageProcessingService } from '../../data/imageProcessingService';

interface SpritePreviewProps {
  imageUrl: string;
  settings: AnimationSettings;
  style: string;
  isBatch?: boolean;
  normalMapUrl?: string;
  onGenerateNormalMap?: () => void;
  skeleton?: Skeleton;
  onGenerateSkeleton?: () => void;
  isGenerating?: boolean;
}

const SpritePreview: React.FC<SpritePreviewProps> = ({ 
  imageUrl, settings, style, isBatch, normalMapUrl, onGenerateNormalMap, skeleton, onGenerateSkeleton, isGenerating 
}) => {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [lightingMode, setLightingMode] = useState(false);
  const [skeletonMode, setSkeletonMode] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 256, y: 256 });
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const normalMapRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load Main Image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imageRef.current = img;
      renderFrame(currentFrame);
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // Load Normal Map
  useEffect(() => {
    if (normalMapUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        normalMapRef.current = img;
      };
      img.src = normalMapUrl;
    } else {
      normalMapRef.current = null;
      setLightingMode(false);
    }
  }, [normalMapUrl]);

  const drawCheckerboard = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const size = 16;
    ctx.save();
    for (let y = 0; y < height; y += size) {
      for (let x = 0; x < width; x += size) {
        ctx.fillStyle = ((x / size + y / size) % 2 === 0) ? '#1c1917' : '#141210';
        ctx.fillRect(x, y, size, size);
      }
    }
    ctx.restore();
  }, []);

  const renderFrame = useCallback((frame: number) => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;

    // Background
    if (settings.autoTransparency) {
      drawCheckerboard(ctx, canvas.width, canvas.height);
    } else {
      ctx.fillStyle = '#0a0807';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Geometry Calculation
    const dw = Math.round(canvas.width * settings.zoom);
    const dh = Math.round(canvas.height * settings.zoom);
    const dx = Math.floor((canvas.width - dw) / 2);
    const dy = Math.floor((canvas.height - dh) / 2);

    // --- NORMAL MAP LIGHTING RENDERER ---
    if (lightingMode && normalMapRef.current && !settings.tiledPreview && !isBatch) {
       // 1. Get Base Color & Normal Map Frames (at Target Resolution)
       const colorFrame = imageProcessingService.processFrame(img, frame, settings, style);
       
       // CRITICAL FIX: Ensure normal map isn't affected by transparency or palette locking
       const normalSettings = { 
         ...settings, 
         hue: 0, saturation: 100, contrast: 100, brightness: 100, 
         paletteLock: false, vectorRite: false,
         autoTransparency: false // Disable void key for normal maps to prevent holes
       };
       const normalFrame = imageProcessingService.processFrame(normalMapRef.current, frame, normalSettings, style);

       const lightingCanvas = document.createElement('canvas');
       lightingCanvas.width = settings.targetResolution;
       lightingCanvas.height = settings.targetResolution;
       const lCtx = lightingCanvas.getContext('2d');
       
       if (lCtx) {
         lCtx.drawImage(colorFrame, 0, 0);
         const colorData = lCtx.getImageData(0, 0, lightingCanvas.width, lightingCanvas.height);
         const normalCtx = normalFrame.getContext('2d');
         const normalData = normalCtx?.getImageData(0, 0, lightingCanvas.width, lightingCanvas.height);
         
         if (colorData && normalData) {
            const data = colorData.data;
            const normals = normalData.data;
            
            // Map Mouse to Sprite Space
            const relX = mousePos.x - dx;
            const relY = mousePos.y - dy;
            const spriteMouseX = (relX / dw) * settings.targetResolution;
            const spriteMouseY = (relY / dh) * settings.targetResolution;
            
            // Light Configuration
            const lightColor = { r: 255, g: 245, b: 220 }; // Warm "torch" hue
            const ambient = 0.25;
            const zDistance = 30; // Height of light source above the plane
            const falloff = 100; // Light radius in sprite pixels

            for (let i = 0; i < data.length; i += 4) {
               if (data[i + 3] < 10) continue; // Skip transparency

               const px = (i / 4) % lightingCanvas.width;
               const py = Math.floor((i / 4) / lightingCanvas.width);

               // 1. Extract Normal Vector (Normalized -1 to 1)
               // Normal Map interpretation: R->X, G->Y, B->Z
               const nx = (normals[i] / 255) * 2 - 1;
               const ny = (normals[i + 1] / 255) * 2 - 1;
               const nz = (normals[i + 2] / 255) * 2 - 1;

               // 2. Vector from pixel to light source
               let lx = spriteMouseX - px;
               let ly = spriteMouseY - py;
               let lz = zDistance;

               // Distance for attenuation
               const distance = Math.sqrt(lx * lx + ly * ly);
               
               // Normalize Light Vector
               const mag = Math.sqrt(lx * lx + ly * ly + lz * lz);
               lx /= mag; ly /= mag; lz /= mag;

               // 3. Dot Product (Diffuse Lighting)
               const dot = Math.max(0, nx * lx + ny * ly + nz * lz);
               
               // 4. Attenuation & Final Intensity
               const attenuation = Math.max(0, 1 - (distance / falloff));
               const intensity = ambient + (dot * attenuation * 2.0);

               // Apply to pixel
               data[i] = Math.min(255, data[i] * intensity * (lightColor.r / 255));
               data[i + 1] = Math.min(255, data[i + 1] * intensity * (lightColor.g / 255));
               data[i + 2] = Math.min(255, data[i + 2] * intensity * (lightColor.b / 255));
            }
            lCtx.putImageData(colorData, 0, 0);
         }
         // Final Blit to UI Canvas
         ctx.drawImage(lightingCanvas, 0, 0, lightingCanvas.width, lightingCanvas.height, dx, dy, dw, dh);
       }
    } else {
       // --- STANDARD RENDERER ---
       const processedFrame = imageProcessingService.processFrame(img, frame, settings, style);
       
       if (!settings.autoTransparency && (settings.showGuides || settings.tiledPreview)) {
          ctx.fillStyle = '#0a0807';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
       }
       
       const totalFrames = settings.rows * settings.cols;
       if (settings.onionSkin && !settings.tiledPreview && totalFrames > 1 && !isBatch) {
          const prevFrameIdx = (frame - 1 + totalFrames) % totalFrames;
          const prevFrameCanvas = imageProcessingService.processFrame(img, prevFrameIdx, settings, style);
          ctx.globalAlpha = 0.3;
          drawStandardFrame(ctx, prevFrameCanvas, settings, dx, dy, dw, dh);
          ctx.globalAlpha = 1.0;
       }
       drawStandardFrame(ctx, processedFrame, settings, dx, dy, dw, dh);
    }

    // --- SKELETON OVERLAY ---
    if (skeletonMode && skeleton && !settings.tiledPreview && !isBatch) {
      drawSkeleton(ctx, skeleton, dx, dy, dw, dh);
    }

    // Guides
    if (settings.showGuides && !settings.tiledPreview) {
      drawGuides(ctx, canvas.width, canvas.height);
    }

  }, [settings, style, drawCheckerboard, lightingMode, skeletonMode, mousePos, isBatch, skeleton]);

  const drawSkeleton = (ctx: CanvasRenderingContext2D, skeleton: Skeleton, dx: number, dy: number, dw: number, dh: number) => {
    ctx.save();
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.7)';
    ctx.lineWidth = 2;
    
    // Bones
    skeleton.bones.forEach(bone => {
      const from = skeleton.joints.find(j => j.id === bone.from);
      const to = skeleton.joints.find(j => j.id === bone.to);
      if (from && to) {
        ctx.beginPath();
        ctx.moveTo(dx + (from.x / 100) * dw, dy + (from.y / 100) * dh);
        ctx.lineTo(dx + (to.x / 100) * dw, dy + (to.y / 100) * dh);
        ctx.stroke();
      }
    });

    // Joints
    skeleton.joints.forEach(joint => {
      const jx = dx + (joint.x / 100) * dw;
      const jy = dy + (joint.y / 100) * dh;
      const grad = ctx.createRadialGradient(jx, jy, 0, jx, jy, 6);
      grad.addColorStop(0, 'rgba(217, 119, 6, 0.9)');
      grad.addColorStop(1, 'rgba(217, 119, 6, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(jx, jy, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath(); ctx.arc(jx, jy, 2.5, 0, Math.PI * 2); ctx.fill();
    });
    ctx.restore();
  };

  const drawStandardFrame = (ctx: CanvasRenderingContext2D, source: HTMLCanvasElement, settings: AnimationSettings, dx: number, dy: number, dw: number, dh: number) => {
    if (settings.tiledPreview) {
      const tileSize = Math.round((ctx.canvas.width / 3) * settings.zoom);
      const startX = Math.floor((ctx.canvas.width - tileSize) / 2);
      const startY = Math.floor((ctx.canvas.height - tileSize) / 2);
      for (let x = -1; x <= 1; x++) {
        for (let y = -1; y <= 1; y++) {
          ctx.drawImage(source, 0, 0, source.width, source.height, startX + (x * tileSize), startY + (y * tileSize), tileSize, tileSize);
          if (x === 0 && y === 0) {
            ctx.strokeStyle = 'rgba(217, 119, 6, 0.4)'; ctx.lineWidth = 2;
            ctx.strokeRect(startX, startY, tileSize, tileSize);
          }
        }
      }
    } else {
      ctx.drawImage(source, 0, 0, source.width, source.height, dx, dy, dw, dh);
    }
  };

  const drawGuides = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      ctx.strokeStyle = 'rgba(217, 119, 6, 0.3)'; ctx.setLineDash([5, 5]); ctx.beginPath();
      ctx.moveTo(width / 2, 0); ctx.lineTo(width / 2, height);
      ctx.moveTo(0, height / 2); ctx.lineTo(width, height / 2);
      ctx.stroke(); ctx.setLineDash([]);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (512 / rect.width);
    const y = (e.clientY - rect.top) * (512 / rect.height);
    setMousePos({ x, y });
  };

  useEffect(() => {
    let interval: number | undefined;
    if (settings.isPlaying) {
      const limit = isBatch ? 1 : (settings.rows * settings.cols);
      interval = window.setInterval(() => {
        setCurrentFrame((prev) => (prev + 1) % limit);
      }, 1000 / settings.fps);
    }
    return () => clearInterval(interval);
  }, [settings.isPlaying, settings.fps, settings.rows, settings.cols, isBatch]);

  useEffect(() => {
    requestAnimationFrame(() => renderFrame(currentFrame));
  }, [currentFrame, renderFrame, mousePos, lightingMode, skeletonMode]);

  return (
    <div className="flex flex-col gap-2 w-full h-full">
      <div 
        ref={containerRef}
        className="relative flex-1 bg-[#020202] flex items-center justify-center overflow-hidden group border border-[#292524] shadow-inner"
        onMouseMove={handleMouseMove}
      >
        {/* LIGHTING SOURCE CURSOR */}
        {lightingMode && (
          <div 
            className="absolute pointer-events-none z-50 w-24 h-24 rounded-full"
            style={{ 
              left: `${(mousePos.x / 512) * 100}%`, 
              top: `${(mousePos.y / 512) * 100}%`,
              transform: 'translate(-50%, -50%)',
              background: 'radial-gradient(circle, rgba(255,200,100,0.15) 0%, rgba(255,200,100,0) 70%)'
            }}
          />
        )}

        {settings.tiledPreview && <div className="absolute inset-0 pointer-events-none z-10 shadow-[inset_0_0_100px_rgba(0,0,0,0.8)]" />}

        <canvas 
          ref={canvasRef} 
          width={512} 
          height={512} 
          className="max-w-full max-h-full object-contain image-pixelated z-0 cursor-crosshair" 
          style={{ imageRendering: 'pixelated' }} 
        />
        
        {/* INTERACTION HUB */}
        {!isBatch && (
           <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-3 z-40">
              {/* Alchemist Button */}
              {!normalMapUrl ? (
                <button onClick={onGenerateNormalMap} disabled={isGenerating} className="bg-purple-900/80 hover:bg-purple-800 border border-purple-500 text-purple-100 px-3 py-1.5 rounded shadow-lg backdrop-blur-md fantasy-font text-[10px] font-bold uppercase flex items-center gap-2">
                   {isGenerating ? <span className="animate-spin">⚙</span> : <span>🔮</span>} Alchemist
                </button>
              ) : (
                <button onClick={() => setLightingMode(!lightingMode)} className={`border px-3 py-1.5 rounded shadow-lg backdrop-blur-md fantasy-font text-[10px] font-bold uppercase flex items-center gap-2 transition-all ${lightingMode ? 'bg-amber-600 border-amber-300 text-black shadow-[0_0_15px_rgba(217,119,6,0.4)]' : 'bg-stone-900/80 border-stone-600 text-stone-300'}`}>
                   <span>🔥</span> {lightingMode ? 'Quench' : 'Ignite'} Torch
                </button>
              )}

              {/* Rigging Button */}
              {!skeleton ? (
                <button onClick={onGenerateSkeleton} disabled={isGenerating} className="bg-sky-900/80 hover:bg-sky-800 border border-sky-500 text-sky-100 px-3 py-1.5 rounded shadow-lg backdrop-blur-md fantasy-font text-[10px] font-bold uppercase flex items-center gap-2">
                   {isGenerating ? <span className="animate-spin">⚙</span> : <span>🦴</span>} Auto-Rig
                </button>
              ) : (
                <button onClick={() => setSkeletonMode(!skeletonMode)} className={`border px-3 py-1.5 rounded shadow-lg backdrop-blur-md fantasy-font text-[10px] font-bold uppercase flex items-center gap-2 ${skeletonMode ? 'bg-sky-600 border-sky-300 text-black shadow-[0_0_15px_rgba(14,165,233,0.4)]' : 'bg-stone-900/80 border-stone-600 text-stone-300'}`}>
                   <span>💀</span> Skeleton
                </button>
              )}
           </div>
        )}

        {/* STATUS HUD */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end z-30 pointer-events-none">
            {skeleton && <div className="bg-sky-900/60 border border-sky-500/30 px-2 py-0.5 rounded shadow-lg backdrop-blur-sm flex items-center gap-1.5"><span className="text-[10px]">💀</span><span className="fantasy-font text-[8px] text-sky-200 font-bold uppercase">Anatomy Analyzed</span></div>}
            {normalMapUrl && <div className="bg-purple-900/60 border border-purple-500/30 px-2 py-0.5 rounded shadow-lg backdrop-blur-sm flex items-center gap-1.5"><span className="text-[10px]">🗺️</span><span className="fantasy-font text-[8px] text-purple-200 font-bold uppercase">Surface Mapping Active</span></div>}
        </div>

        {/* INFO BAR */}
        <div className="absolute bottom-3 left-3 flex gap-2 items-center z-20 pointer-events-none">
           <div className="bg-black/80 border border-stone-800 px-2 py-1 rounded backdrop-blur-md flex items-center gap-3">
              <span className="terminal-font text-[10px] text-stone-300 font-bold tracking-wider">{settings.tiledPreview ? 'LOOP-VIEW' : `FRAME ${String(currentFrame + 1).padStart(2, '0')}`}</span>
              <div className="w-px h-3 bg-stone-800" />
              <span className="terminal-font text-[10px] text-amber-600/80 font-bold">{settings.fps} FPS</span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default SpritePreview;