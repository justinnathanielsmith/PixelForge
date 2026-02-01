import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AnimationSettings, Skeleton, SliceData, GeneratedArt } from '../../domain/entities';
import { imageProcessingService } from '../../data/imageProcessingService';

interface SpritePreviewProps {
  activeArt: GeneratedArt;
  settings: AnimationSettings;
  style: string;
  isBatch?: boolean;
  onUpdateArt: (updatedArt: GeneratedArt) => void;
  normalMapUrl?: string;
  onGenerateNormalMap?: () => void;
  skeleton?: Skeleton;
  onGenerateSkeleton?: () => void;
  sliceData?: SliceData;
  isGenerating?: boolean;
}

type Tool = 'none' | 'pencil' | 'eraser';

const SpritePreview: React.FC<SpritePreviewProps> = ({ 
  activeArt, settings, style, isBatch, onUpdateArt, normalMapUrl, onGenerateNormalMap, skeleton, onGenerateSkeleton, sliceData, isGenerating 
}) => {
  const imageUrl = activeArt.imageUrl;
  const [currentFrame, setCurrentFrame] = useState(0);
  const [lightingMode, setLightingMode] = useState(false);
  const [skeletonMode, setSkeletonMode] = useState(false);
  const [sliceMode, setSliceMode] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 256, y: 256 });
  const [tool, setTool] = useState<Tool>('none');
  const [brushColor, setBrushColor] = useState('#ffffff');
  const [isDrawing, setIsDrawing] = useState(false);
  
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
       const colorFrame = imageProcessingService.processFrame(img, frame, settings, style);
       const normalSettings = { 
         ...settings, 
         hue: 0, saturation: 100, contrast: 100, brightness: 100, 
         paletteLock: false, vectorRite: false,
         autoTransparency: false 
       };
       const normalFrame = imageProcessingService.processFrame(normalMapRef.current, frame, normalSettings, style);

       const lightingCanvas = document.createElement('canvas');
       lightingCanvas.width = settings.targetResolution;
       lightingCanvas.height = settings.targetResolution;
       const lCtx = lightingCanvas.getContext('2d');
       
       if (lCtx) {
         // Fix: Explicitly cast colorFrame to any to avoid type mismatch with OffscreenCanvas in drawImage
         lCtx.drawImage(colorFrame as any, 0, 0);
         const colorData = lCtx.getImageData(0, 0, lightingCanvas.width, lightingCanvas.height);
         // Fix: Access getContext via any cast to handle union type of HTMLCanvasElement and OffscreenCanvas
         const normalCtx = (normalFrame as any).getContext('2d');
         const normalData = normalCtx?.getImageData(0, 0, lightingCanvas.width, lightingCanvas.height);
         
         if (colorData && normalData) {
            const data = colorData.data;
            const normals = normalData.data;
            
            const relX = mousePos.x - dx;
            const relY = mousePos.y - dy;
            const spriteMouseX = (relX / dw) * settings.targetResolution;
            const spriteMouseY = (relY / dh) * settings.targetResolution;
            
            const lightColor = { r: 255, g: 245, b: 220 }; 
            const ambient = 0.25;
            const zDistance = 30; 
            const falloff = 100; 

            for (let i = 0; i < data.length; i += 4) {
               if (data[i + 3] < 10) continue; 
               const px = (i / 4) % lightingCanvas.width;
               const py = Math.floor((i / 4) / lightingCanvas.width);
               const nx = (normals[i] / 255) * 2 - 1;
               const ny = (normals[i + 1] / 255) * 2 - 1;
               const nz = (normals[i + 2] / 255) * 2 - 1;
               let lx = spriteMouseX - px;
               let ly = spriteMouseY - py;
               let lz = zDistance;
               const distance = Math.sqrt(lx * lx + ly * ly);
               const mag = Math.sqrt(lx * lx + ly * ly + lz * lz);
               lx /= mag; ly /= mag; lz /= mag;
               const dot = Math.max(0, nx * lx + ny * ly + nz * lz);
               const attenuation = Math.max(0, 1 - (distance / falloff));
               const intensity = ambient + (dot * attenuation * 2.0);
               data[i] = Math.min(255, data[i] * intensity * (lightColor.r / 255));
               data[i + 1] = Math.min(255, data[i + 1] * intensity * (lightColor.g / 255));
               data[i + 2] = Math.min(255, data[i + 2] * intensity * (lightColor.b / 255));
            }
            lCtx.putImageData(colorData, 0, 0);
         }
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

    if (skeletonMode && skeleton && !settings.tiledPreview && !isBatch) {
      drawSkeleton(ctx, skeleton, dx, dy, dw, dh);
    }

    if (sliceMode && sliceData && !settings.tiledPreview && !isBatch) {
      drawSliceGuides(ctx, sliceData, dx, dy, dw, dh, settings.targetResolution);
    }

    if (settings.showGuides && !settings.tiledPreview) {
      drawGuides(ctx, canvas.width, canvas.height);
    }

  }, [settings, style, drawCheckerboard, lightingMode, skeletonMode, sliceMode, mousePos, isBatch, skeleton, sliceData]);

  const drawSkeleton = (ctx: CanvasRenderingContext2D, skeleton: Skeleton, dx: number, dy: number, dw: number, dh: number) => {
    ctx.save();
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.7)';
    ctx.lineWidth = 2;
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

  const drawSliceGuides = (ctx: CanvasRenderingContext2D, data: SliceData, dx: number, dy: number, dw: number, dh: number, res: number) => {
    ctx.save();
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 2]);
    const scale = dw / res;
    const topY = dy + (data.top * scale);
    const bottomY = dy + dh - (data.bottom * scale);
    ctx.beginPath(); ctx.moveTo(dx, topY); ctx.lineTo(dx + dw, topY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(dx, bottomY); ctx.lineTo(dx + dw, bottomY); ctx.stroke();
    const leftX = dx + (data.left * scale);
    const rightX = dx + dw - (data.right * scale);
    ctx.beginPath(); ctx.moveTo(leftX, dy); ctx.lineTo(leftX, dy + dh); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(rightX, dy); ctx.lineTo(rightX, dy + dh); ctx.stroke();
    ctx.restore();
  };

  // Fix: source parameter updated to accept OffscreenCanvas as well to avoid assignment errors from imageProcessingService.processFrame results
  const drawStandardFrame = (ctx: CanvasRenderingContext2D, source: HTMLCanvasElement | OffscreenCanvas, settings: AnimationSettings, dx: number, dy: number, dw: number, dh: number) => {
    if (settings.tiledPreview) {
      const tileSize = Math.round((ctx.canvas.width / 3) * settings.zoom);
      const startX = Math.floor((ctx.canvas.width - tileSize) / 2);
      const startY = Math.floor((ctx.canvas.height - tileSize) / 2);
      for (let x = -1; x <= 1; x++) {
        for (let y = -1; y <= 1; y++) {
          // Fix: cast source to any for drawImage and to access width/height properties safely on both canvas types
          ctx.drawImage(source as any, 0, 0, (source as any).width, (source as any).height, startX + (x * tileSize), startY + (y * tileSize), tileSize, tileSize);
          if (x === 0 && y === 0) {
            ctx.strokeStyle = 'rgba(217, 119, 6, 0.4)'; ctx.lineWidth = 2;
            ctx.strokeRect(startX, startY, tileSize, tileSize);
          }
        }
      }
    } else {
      ctx.drawImage(source as any, 0, 0, (source as any).width, (source as any).height, dx, dy, dw, dh);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (512 / rect.width);
    const y = (e.clientY - rect.top) * (512 / rect.height);
    setMousePos({ x, y });

    if (isDrawing && tool !== 'none') {
      executeDrawAction(x, y);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (tool !== 'none') {
      setIsDrawing(true);
      executeDrawAction(mousePos.x, mousePos.y);
    }
  };

  const handleMouseUp = () => {
    if (isDrawing) {
      setIsDrawing(false);
      persistEdits();
    }
  };

  const executeDrawAction = (mouseX: number, mouseY: number) => {
    const img = imageRef.current;
    if (!img) return;

    // 1. Calculate relative coordinate in active frame view
    const dw = Math.round(512 * settings.zoom);
    const dh = Math.round(512 * settings.zoom);
    const dx = Math.floor((512 - dw) / 2);
    const dy = Math.floor((512 - dh) / 2);

    const relX = mouseX - dx;
    const relY = mouseY - dy;

    if (relX < 0 || relX >= dw || relY < 0 || relY >= dh) return;

    // 2. Map to original image source pixel
    const sw = img.width / settings.cols;
    const sh = img.height / settings.rows;
    
    const frameX = (currentFrame % settings.cols) * sw;
    const frameY = Math.floor(currentFrame / settings.cols) * sh;

    // Calculate normalized position within the frame (0 to 1)
    const normX = relX / dw;
    const normY = relY / dh;

    const sourceX = Math.floor(frameX + (normX * sw));
    const sourceY = Math.floor(frameY + (normY * sh));

    // 3. Perform edit on a scratch canvas representing the FULL source image
    const editCanvas = document.createElement('canvas');
    editCanvas.width = img.width;
    editCanvas.height = img.height;
    const eCtx = editCanvas.getContext('2d');
    if (!eCtx) return;

    eCtx.drawImage(img, 0, 0);
    
    // Pencil size relative to image resolution (approx 1 "pixel" at target res)
    const brushSize = Math.max(1, Math.round(img.width / (settings.cols * settings.targetResolution)));

    if (tool === 'pencil') {
      eCtx.fillStyle = brushColor;
      eCtx.fillRect(sourceX - brushSize / 2, sourceY - brushSize / 2, brushSize, brushSize);
    } else if (tool === 'eraser') {
      eCtx.clearRect(sourceX - brushSize / 2, sourceY - brushSize / 2, brushSize, brushSize);
    }

    // Update the local reference image immediately for smooth feedback
    const updatedImg = new Image();
    updatedImg.onload = () => {
       imageRef.current = updatedImg;
       renderFrame(currentFrame);
    };
    updatedImg.src = editCanvas.toDataURL('image/png');
  };

  const persistEdits = () => {
     if (imageRef.current) {
        onUpdateArt({ ...activeArt, imageUrl: imageRef.current.src });
     }
  };

  useEffect(() => {
    let interval: number | undefined;
    if (settings.isPlaying && tool === 'none') {
      const limit = isBatch ? 1 : (settings.rows * settings.cols);
      interval = window.setInterval(() => {
        setCurrentFrame((prev) => (prev + 1) % limit);
      }, 1000 / settings.fps);
    }
    return () => clearInterval(interval);
  }, [settings.isPlaying, settings.fps, settings.rows, settings.cols, isBatch, tool]);

  useEffect(() => {
    requestAnimationFrame(() => renderFrame(currentFrame));
  }, [currentFrame, renderFrame, mousePos, lightingMode, skeletonMode, sliceMode]);

  return (
    <div className="flex flex-col gap-2 w-full h-full">
      <div 
        ref={containerRef}
        className="relative flex-1 bg-[#020202] flex items-center justify-center overflow-hidden group border border-[#292524] shadow-inner"
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* EDIT TOOLBAR */}
        <div className="absolute left-3 top-3 flex flex-col gap-2 z-50">
           <button 
             onClick={() => setTool(tool === 'pencil' ? 'none' : 'pencil')} 
             className={`w-10 h-10 flex items-center justify-center rounded border transition-all ${tool === 'pencil' ? 'bg-amber-600 border-amber-300 text-black shadow-lg scale-110' : 'bg-stone-900/80 border-stone-700 text-stone-500 hover:text-stone-300'}`}
             title="Scribe Tool (Pencil)"
           >
             <span className="text-lg">🖋️</span>
           </button>
           <button 
             onClick={() => setTool(tool === 'eraser' ? 'none' : 'eraser')} 
             className={`w-10 h-10 flex items-center justify-center rounded border transition-all ${tool === 'eraser' ? 'bg-red-600 border-red-300 text-black shadow-lg scale-110' : 'bg-stone-900/80 border-stone-700 text-stone-500 hover:text-stone-300'}`}
             title="Nullify Tool (Eraser)"
           >
             <span className="text-lg">🧼</span>
           </button>
           {tool === 'pencil' && (
             <div className="flex flex-col gap-1 p-1 bg-black/60 border border-stone-800 rounded mt-1 animate-in slide-in-from-left-2">
                <input 
                  type="color" 
                  value={brushColor} 
                  onChange={(e) => setBrushColor(e.target.value)} 
                  className="w-8 h-8 cursor-pointer bg-transparent border-0 p-0"
                />
             </div>
           )}
        </div>

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
          className={`max-w-full max-h-full object-contain image-pixelated z-0 ${tool !== 'none' ? 'cursor-none' : 'cursor-crosshair'}`} 
          style={{ imageRendering: 'pixelated' }} 
        />

        {/* CUSTOM CURSOR FOR DRAWING */}
        {tool !== 'none' && (
           <div 
            className={`absolute pointer-events-none z-[60] border border-white mix-blend-difference`}
            style={{ 
              left: `${mousePos.x}px`, 
              top: `${mousePos.y}px`,
              width: `${(activeArt.gridSize?.cols ? 1024 / activeArt.gridSize.cols : 1024) / settings.targetResolution * settings.zoom * (512/512)}px`,
              height: `${(activeArt.gridSize?.rows ? 1024 / activeArt.gridSize.rows : 1024) / settings.targetResolution * settings.zoom * (512/512)}px`,
              transform: 'translate(-50%, -50%)'
            }}
           />
        )}
        
        {/* INTERACTION HUB */}
        {!isBatch && (
           <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-3 z-40">
              {!normalMapUrl ? (
                <button onClick={onGenerateNormalMap} disabled={isGenerating} className="bg-purple-900/80 hover:bg-purple-800 border border-purple-500 text-purple-100 px-3 py-1.5 rounded shadow-lg backdrop-blur-md fantasy-font text-[10px] font-bold uppercase flex items-center gap-2">
                   {isGenerating ? <span className="animate-spin">⚙</span> : <span>🔮</span>} Alchemist
                </button>
              ) : (
                <button onClick={() => setLightingMode(!lightingMode)} className={`border px-3 py-1.5 rounded shadow-lg backdrop-blur-md fantasy-font text-[10px] font-bold uppercase flex items-center gap-2 transition-all ${lightingMode ? 'bg-amber-600 border-amber-300 text-black shadow-[0_0_15px_rgba(217,119,6,0.4)]' : 'bg-stone-900/80 border-stone-600 text-stone-300'}`}>
                   <span>🔥</span> {lightingMode ? 'Quench' : 'Ignite'} Torch
                </button>
              )}

              {sliceData && (
                <button onClick={() => setSliceMode(!sliceMode)} className={`border px-3 py-1.5 rounded shadow-lg backdrop-blur-md fantasy-font text-[10px] font-bold uppercase flex items-center gap-2 transition-all ${sliceMode ? 'bg-emerald-600 border-emerald-300 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-stone-900/80 border-stone-600 text-stone-300'}`}>
                   <span>📏</span> 9-Slice Guide
                </button>
              )}

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

        <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end z-30 pointer-events-none">
            {tool !== 'none' && <div className="bg-amber-900/60 border border-amber-500/30 px-2 py-0.5 rounded shadow-lg backdrop-blur-sm flex items-center gap-1.5"><span className="text-[10px]">🎨</span><span className="fantasy-font text-[8px] text-amber-200 font-bold uppercase">Manual Correction Mode</span></div>}
            {sliceData && <div className="bg-emerald-900/60 border border-emerald-500/30 px-2 py-0.5 rounded shadow-lg backdrop-blur-sm flex items-center gap-1.5"><span className="text-[10px]">📏</span><span className="fantasy-font text-[8px] text-emerald-200 font-bold uppercase">UI Slicing Calibrated</span></div>}
            {skeleton && <div className="bg-sky-900/60 border border-sky-500/30 px-2 py-0.5 rounded shadow-lg backdrop-blur-sm flex items-center gap-1.5"><span className="text-[10px]">💀</span><span className="fantasy-font text-[8px] text-sky-200 font-bold uppercase">Anatomy Analyzed</span></div>}
            {normalMapUrl && <div className="bg-purple-900/60 border border-purple-500/30 px-2 py-0.5 rounded shadow-lg backdrop-blur-sm flex items-center gap-1.5"><span className="text-[10px]">🗺️</span><span className="fantasy-font text-[8px] text-purple-200 font-bold uppercase">Surface Mapping Active</span></div>}
        </div>

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