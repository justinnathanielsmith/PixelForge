
import React, { useEffect, useRef, useState } from 'react';
import { GeneratedArt, AnimationSettings } from '../../domain/entities';
import { imageProcessingService } from '../../data/imageProcessingService';

interface AutotileModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeArt: GeneratedArt;
  settings: AnimationSettings;
}

const AutotileModal: React.FC<AutotileModalProps> = ({ isOpen, onClose, activeArt, settings }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [seed, setSeed] = useState(Date.now());
  const [scale, setScale] = useState(3);
  const [islandSize, setIslandSize] = useState(12);

  // 3x3 Source Mapping Indices (Row-Major)
  // 0:TL, 1:T, 2:TR
  // 3:L,  4:C, 5:R
  // 6:BL, 7:B, 8:BR
  
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;
    
    const renderSandbox = async () => {
      const img = await imageProcessingService.loadImage(activeArt.imageUrl);
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 1. Slice Source Image into 9 bitmaps
      // Note: activeArt.imageUrl is likely the full 3x3 grid
      // We need to know the tile size. 
      // The image width/height divided by 3.
      
      // Usually activeArt for tileset_bitmask is a 3x3 grid.
      // settings.targetResolution usually refers to the CELL height in other modes, 
      // but for 'tileset_bitmask' the generation logic tries to make a 3x3 grid where each cell is roughly targetResolution.
      // However, the actual image dimensions are what matters here.
      
      const srcW = (img as HTMLImageElement).width;
      const srcH = (img as HTMLImageElement).height;
      const tileW = Math.floor(srcW / 3);
      const tileH = Math.floor(srcH / 3);

      const tiles: HTMLCanvasElement[] = [];
      
      for (let y = 0; y < 3; y++) {
        for (let x = 0; x < 3; x++) {
          const tCanvas = document.createElement('canvas');
          tCanvas.width = tileW;
          tCanvas.height = tileH;
          const tCtx = tCanvas.getContext('2d');
          if (tCtx) {
            tCtx.drawImage(img as any, x * tileW, y * tileH, tileW, tileH, 0, 0, tileW, tileH);
          }
          tiles.push(tCanvas);
        }
      }

      // 2. Generate Map
      const mapW = islandSize;
      const mapH = islandSize;
      const map: number[][] = Array(mapH).fill(0).map(() => Array(mapW).fill(0));

      // Simple Cellular Automata / Random Blob
      const rng = (s: number) => {
        let t = s + 0x6D2B79F5;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };

      // Fill center-ish
      for (let y = 0; y < mapH; y++) {
        for (let x = 0; x < mapW; x++) {
          const dx = x - mapW / 2;
          const dy = y - mapH / 2;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const noise = rng(seed + x * 99 + y * 7);
          if (dist < (mapW / 3) + noise * 1.5) {
            map[y][x] = 1;
          }
        }
      }

      // Ensure at least one solid block to avoid empty canvas
      map[Math.floor(mapH/2)][Math.floor(mapW/2)] = 1;

      // 3. Render Map
      canvas.width = mapW * tileW * scale;
      canvas.height = mapH * tileH * scale;
      
      // Background pattern
      ctx.fillStyle = '#0f172a'; // Deep space/void
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw Grid lines (faint)
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for(let i=0; i<=mapW; i++) { ctx.moveTo(i*tileW*scale, 0); ctx.lineTo(i*tileW*scale, canvas.height); }
      for(let i=0; i<=mapH; i++) { ctx.moveTo(0, i*tileH*scale); ctx.lineTo(canvas.width, i*tileH*scale); }
      ctx.stroke();

      ctx.imageSmoothingEnabled = false;

      for (let y = 0; y < mapH; y++) {
        for (let x = 0; x < mapW; x++) {
          if (map[y][x] === 0) continue;

          // Autotile Logic
          const N = y > 0 ? map[y - 1][x] : 0;
          const S = y < mapH - 1 ? map[y + 1][x] : 0;
          const W = x > 0 ? map[y][x - 1] : 0;
          const E = x < mapW - 1 ? map[y][x + 1] : 0;

          // Index logic based on 3x3 blob Layout:
          // 0 1 2
          // 3 4 5
          // 6 7 8
          
          let tileIdx = 4; // Default Center

          // Corners priority
          if (!N && !W) tileIdx = 0;
          else if (!N && !E) tileIdx = 2;
          else if (!S && !W) tileIdx = 6;
          else if (!S && !E) tileIdx = 8;
          // Edges
          else if (!N) tileIdx = 1;
          else if (!S) tileIdx = 7;
          else if (!W) tileIdx = 3;
          else if (!E) tileIdx = 5;
          // Center
          else tileIdx = 4;

          // Note: This minimal logic doesn't handle inner corners (concave). 
          // 3x3 blob sets technically require a 4th column or separate handling for inner corners to be perfect.
          // For this 'Blob' format, usually inner corners map to Center (4) or we accept the limitation.
          // The visual result will show sharp intersections for inner corners.

          const drawX = x * tileW * scale;
          const drawY = y * tileH * scale;
          const drawW = tileW * scale;
          const drawH = tileH * scale;

          ctx.drawImage(tiles[tileIdx], drawX, drawY, drawW, drawH);
        }
      }
    };

    renderSandbox();
  }, [isOpen, activeArt, seed, scale, islandSize]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-4xl fantasy-card bg-[#1c1917] flex flex-col shadow-2xl border-emerald-900/50 max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#44403c] bg-[#0c0a09]">
           <div className="flex items-center gap-3">
             <span className="text-2xl">🗺️</span>
             <div>
               <h2 className="fantasy-font text-sm text-emerald-500 uppercase tracking-widest leading-none">Autotile Architect Sandbox</h2>
               <span className="text-[10px] text-stone-500 font-mono">3x3 Blob Connectivity Test</span>
             </div>
           </div>
           <button onClick={onClose} aria-label="Close Autotile Modal" className="text-stone-500 hover:text-red-400 text-2xl leading-none transition-colors">×</button>
        </div>

        {/* Viewport */}
        <div className="flex-1 overflow-auto bg-[#020202] p-4 flex items-center justify-center relative custom-scrollbar">
           <div className="border border-stone-800 shadow-2xl bg-black">
              <canvas ref={canvasRef} />
           </div>
        </div>

        {/* Controls */}
        <div className="p-4 border-t border-[#44403c] bg-[#0c0a09] flex gap-4 items-center justify-between">
           <div className="flex gap-4 items-center">
              <div className="space-y-1">
                 <label htmlFor="island-zoom" className="text-[9px] fantasy-font text-stone-500 uppercase tracking-widest block">Island Zoom</label>
                 <input 
                    id="island-zoom"
                    type="range" min="1" max="6" step="1" 
                    value={scale} onChange={(e) => setScale(parseInt(e.target.value))} 
                    className="w-24 accent-emerald-600"
                 />
              </div>
              <div className="space-y-1">
                 <label htmlFor="map-size" className="text-[9px] fantasy-font text-stone-500 uppercase tracking-widest block">Map Size</label>
                 <input 
                    id="map-size"
                    type="range" min="6" max="24" step="1" 
                    value={islandSize} onChange={(e) => setIslandSize(parseInt(e.target.value))} 
                    className="w-24 accent-emerald-600"
                 />
              </div>
           </div>

           <div className="flex gap-2">
              <button 
                onClick={() => setSeed(Date.now())}
                className="px-6 py-2 bg-stone-800 text-stone-300 border border-stone-600 fantasy-font text-[10px] font-bold uppercase hover:bg-stone-700 hover:text-white transition-all rounded shadow-md flex items-center gap-2"
              >
                <span>🎲</span> Reroll Terrain
              </button>
              <button 
                onClick={onClose}
                className="px-6 py-2 bg-emerald-900 text-emerald-100 border border-emerald-600 fantasy-font text-[10px] font-bold uppercase hover:bg-emerald-800 transition-all rounded shadow-md"
              >
                Done
              </button>
           </div>
        </div>

      </div>
    </div>
  );
};

export default AutotileModal;
