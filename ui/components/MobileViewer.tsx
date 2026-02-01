
import React, { useEffect, useState } from 'react';
import { GeneratedArt } from '../../domain/entities';
import { pixelRepository } from '../../data/repository';

interface MobileViewerProps {
  artId: string;
}

const MobileViewer: React.FC<MobileViewerProps> = ({ artId }) => {
  const [art, setArt] = useState<GeneratedArt | null>(null);
  const [loading, setLoading] = useState(true);
  const [bgMode, setBgMode] = useState<'void' | 'grass' | 'dungeon' | 'space'>('void');
  const [scale, setScale] = useState(2);
  const [isMoving, setIsMoving] = useState(false);

  useEffect(() => {
    const fetchArt = async () => {
      try {
        const history = await pixelRepository.getHistory();
        const found = history.find(a => a.id === artId);
        setArt(found || null);
      } catch (e) {
        console.error("Failed to load art", e);
      } finally {
        setLoading(false);
      }
    };
    fetchArt();
  }, [artId]);

  const bgStyles = {
    void: { backgroundColor: '#0c0a09' },
    grass: { 
        backgroundColor: '#2e8b57',
        backgroundImage: 'linear-gradient(45deg, #277a4c 25%, transparent 25%, transparent 75%, #277a4c 75%, #277a4c), linear-gradient(45deg, #277a4c 25%, transparent 25%, transparent 75%, #277a4c 75%, #277a4c)',
        backgroundSize: '20px 20px',
        backgroundPosition: '0 0, 10px 10px'
    },
    dungeon: { 
        backgroundColor: '#292524',
        backgroundImage: 'radial-gradient(#44403c 15%, transparent 16%), radial-gradient(#44403c 15%, transparent 16%)',
        backgroundSize: '30px 30px',
        backgroundPosition: '0 0, 15px 15px'
    },
    space: { 
        backgroundColor: '#0f172a',
        backgroundImage: 'radial-gradient(white, rgba(255,255,255,.2) 2px, transparent 4px), radial-gradient(white, rgba(255,255,255,.15) 1px, transparent 3px), radial-gradient(white, rgba(255,255,255,.1) 2px, transparent 4px)',
        backgroundSize: '550px 550px, 350px 350px, 250px 250px', 
        backgroundPosition: '0 0, 40px 60px, 130px 270px'
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-[#0c0a09] flex items-center justify-center text-amber-500 fantasy-font animate-pulse">Syncing Crystal...</div>;
  }

  if (!art) {
    return (
      <div className="min-h-screen bg-[#0c0a09] p-6 flex flex-col items-center justify-center text-center">
        <div className="text-4xl mb-4">🔮❓</div>
        <h2 className="text-xl fantasy-font text-stone-500 uppercase tracking-widest mb-2">Vision Not Found</h2>
        <p className="text-stone-400 text-sm font-serif">The artifact ID <code>{artId}</code> could not be materialized from this device's local repository.</p>
        <button onClick={() => window.location.href = window.location.pathname} className="mt-8 px-6 py-2 bg-stone-800 text-stone-300 fantasy-font uppercase text-xs rounded border border-stone-700">Return to Forge</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0c0a09] flex flex-col font-serif text-[#d6d3d1]">
      {/* Header */}
      <header className="p-4 bg-[#1c1917] border-b border-[#292524] flex items-center justify-between shrink-0 shadow-lg z-10">
         <div className="flex items-center gap-2">
            <span className="text-xl">🔮</span>
            <div>
               <h1 className="fantasy-font text-sm text-amber-500 uppercase tracking-widest leading-none">Crystal Viewer</h1>
               <span className="text-[10px] text-stone-500 font-mono">Live Link v1.0</span>
            </div>
         </div>
         <button onClick={() => window.location.href = window.location.pathname} className="text-xs text-stone-500 uppercase font-bold border border-stone-700 px-2 py-1 rounded hover:bg-stone-800 transition-colors">Close</button>
      </header>

      {/* Viewport */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center" style={bgStyles[bgMode]}>
         <div 
           className={`transition-transform duration-[2000ms] ease-in-out ${isMoving ? 'translate-x-12' : '-translate-x-12'}`}
           style={{ 
             width: 'fit-content',
             height: 'fit-content'
           }}
           onTransitionEnd={() => setIsMoving(!isMoving)}
         >
             <img 
               src={art.imageUrl} 
               alt={art.prompt} 
               style={{ 
                 imageRendering: 'pixelated', 
                 transform: `scale(${scale})`,
                 boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
               }}
               className="transition-transform duration-300"
             />
         </div>
         
         {/* Metadata Overlay */}
         <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm p-2 rounded border border-white/10 max-w-[200px]">
            <p className="text-[10px] fantasy-font text-white/80 uppercase tracking-wide mb-1">{art.category}</p>
            <p className="text-[9px] text-white/50 leading-tight line-clamp-2">{art.prompt}</p>
         </div>
      </div>

      {/* Controls */}
      <div className="p-4 bg-[#1c1917] border-t border-[#292524] space-y-4 shrink-0 pb-8">
         {/* Backgrounds */}
         <div className="space-y-1">
            <label className="text-[9px] fantasy-font text-stone-500 uppercase tracking-widest">Environment</label>
            <div className="flex gap-2 overflow-x-auto pb-1">
               {(Object.keys(bgStyles) as Array<keyof typeof bgStyles>).map(mode => (
                 <button 
                   key={mode} 
                   onClick={() => setBgMode(mode)}
                   className={`px-3 py-2 rounded border transition-all text-[10px] fantasy-font uppercase ${bgMode === mode ? 'bg-amber-900/50 border-amber-600 text-amber-500' : 'bg-stone-900/50 border-stone-800 text-stone-500'}`}
                 >
                   {mode}
                 </button>
               ))}
            </div>
         </div>

         {/* Actions */}
         <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
                <label className="text-[9px] fantasy-font text-stone-500 uppercase tracking-widest">Scale</label>
                <div className="flex bg-stone-900 rounded border border-stone-800 p-1 gap-1">
                   {[1, 2, 3, 4].map(s => (
                     <button 
                       key={s} 
                       onClick={() => setScale(s)} 
                       className={`flex-1 py-1 rounded text-[10px] font-mono font-bold transition-all ${scale === s ? 'bg-stone-700 text-white shadow-sm' : 'text-stone-500 hover:text-stone-400'}`}
                     >
                       {s}x
                     </button>
                   ))}
                </div>
            </div>
            <div className="space-y-1">
                <label className="text-[9px] fantasy-font text-stone-500 uppercase tracking-widest">Simulation</label>
                <button 
                   onClick={() => setIsMoving(!isMoving)}
                   className={`w-full py-1.5 border rounded fantasy-font text-[10px] uppercase font-bold transition-all h-[34px] ${isMoving ? 'bg-emerald-900/40 border-emerald-600 text-emerald-400' : 'bg-stone-900 border-stone-700 text-stone-500'}`}
                >
                   {isMoving ? 'Stop Motion' : 'Test Motion'}
                </button>
            </div>
         </div>
      </div>
    </div>
  );
};

export default MobileViewer;
