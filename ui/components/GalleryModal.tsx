
import React, { useState, useCallback } from 'react';
import { GeneratedArt } from '../../domain/entities';
import { useToast } from '../context/ToastContext';
import JSZip from 'jszip';

interface GalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: GeneratedArt[];
  activeArtId: string | undefined;
  onSelect: (art: GeneratedArt) => void;
  onDelete: (id: string) => void;
}

interface GalleryItemProps {
  art: GeneratedArt;
  isActive: boolean;
  isSelected: boolean;
  onSelect: (art: GeneratedArt) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

// Optimized component using React.memo to prevent re-renders of the entire list when selection changes
const GalleryItem = React.memo(({ art, isActive, isSelected, onSelect, onToggle, onDelete }: GalleryItemProps) => {
  return (
    <div
      className={`relative group aspect-square bg-[#020202] border-2 transition-all hover:scale-105 focus-within:scale-105 ${isActive ? 'border-amber-500 shadow-[0_0_20px_rgba(217,119,6,0.3)]' : 'border-[#292524] hover:border-stone-500 focus-within:border-stone-500'}`}
    >
      {/* Primary Action - Invisible Button */}
      <button
        onClick={() => onSelect(art)}
        className="absolute inset-0 w-full h-full cursor-pointer z-0 bg-transparent opacity-0 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
        aria-label={`View ${art.prompt}`}
      />

      <img src={art.imageUrl} className="w-full h-full object-contain image-pixelated p-2 pointer-events-none" style={{ imageRendering: 'pixelated' }} alt="" />

      {/* Selection Ring */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(art.id); }}
        aria-label={isSelected ? "Deselect" : "Select for export"}
        aria-pressed={isSelected}
        className={`absolute top-2 left-2 w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center z-10 focus:outline-none focus:ring-2 focus:ring-amber-500 ${isSelected ? 'bg-amber-600 border-amber-300' : 'bg-black/60 border-stone-700 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100'}`}
      >
        {isSelected && <span className="text-[10px] text-black font-bold">✓</span>}
      </button>

      {/* Metadata Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity p-3 flex flex-col justify-end pointer-events-none z-20">
          <p className="text-[8px] terminal-font text-stone-400 line-clamp-2 leading-tight mb-1">{art.prompt}</p>
          <div className="flex justify-between items-center">
            <span className="text-[7px] fantasy-font text-amber-600 uppercase font-bold">{art.type.split('-')[0]}</span>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(art.id); }}
              className="w-6 h-6 bg-red-950/60 text-red-400 border border-red-900 rounded hover:bg-red-800 hover:text-white transition-all flex items-center justify-center pointer-events-auto focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-500"
              title="Dissolve Entity"
              aria-label="Delete Art"
            >
                🗑️
            </button>
          </div>
      </div>
    </div>
  );
});

const GalleryModal: React.FC<GalleryModalProps> = ({ isOpen, onClose, history, activeArtId, onSelect, onDelete }) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { whisper } = useToast();

  if (!isOpen) return null;

  // Stable callback using functional update to prevent re-creation on every render, allowing GalleryItem to remain memoized
  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleBatchExport = async () => {
    if (selectedIds.size === 0) return;
    whisper("Batch Export Started", `Bundling ${selectedIds.size} entities...`, "mana");
    
    const zip = new JSZip();
    const selectedArts = history.filter(a => selectedIds.has(a.id));
    
    for (const art of selectedArts) {
      const response = await fetch(art.imageUrl);
      const blob = await response.blob();
      zip.file(`asset_${art.id}.png`, blob);
    }
    
    const content = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = `pxl_forge_batch_${Date.now()}.zip`;
    link.click();
    whisper("Export Complete", "Neural bundle manifested as ZIP.", "success");
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/95 backdrop-blur-xl p-2 md:p-6 animate-in fade-in duration-300">
      <div className="w-full max-w-6xl h-[90vh] md:h-[85vh] fantasy-card bg-[#0c0a09] flex flex-col border-amber-900/40 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-3 md:p-5 border-b border-[#292524] bg-[#1c1917] shrink-0">
          <div className="flex items-center gap-3 md:gap-4">
             <span className="text-2xl md:text-3xl">🖼️</span>
             <div>
               <h2 className="fantasy-font text-lg md:text-xl text-amber-500 uppercase tracking-widest leading-none">The Great Gallery</h2>
               <span className="text-[10px] text-stone-500 font-mono">Viewing {history.length} Manifestations</span>
             </div>
          </div>
          <div className="flex items-center gap-2 md:gap-6">
             {selectedIds.size > 0 && (
               <button 
                 onClick={handleBatchExport}
                 className="px-3 md:px-6 py-1.5 md:py-2 bg-emerald-800 text-emerald-50 border border-emerald-500 fantasy-font text-[9px] md:text-[10px] font-bold uppercase hover:bg-emerald-700 transition-all rounded shadow-[0_0_15px_rgba(16,185,129,0.2)] animate-in zoom-in-95 whitespace-nowrap"
               >
                 Export ({selectedIds.size})
               </button>
             )}
             <button onClick={onClose} aria-label="Close Gallery" className="text-stone-500 hover:text-red-400 text-2xl md:text-3xl transition-colors p-2 leading-none">×</button>
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
           {history.length === 0 ? (
             <div className="h-full flex flex-col items-center justify-center text-stone-600 gap-4">
                <span className="text-6xl grayscale opacity-20">🌫️</span>
                <p className="fantasy-font text-sm uppercase tracking-widest italic">The scrying history is blank.</p>
             </div>
           ) : (
             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
                {history.map(art => (
                  <GalleryItem
                    key={art.id}
                    art={art}
                    isActive={activeArtId === art.id}
                    isSelected={selectedIds.has(art.id)}
                    onSelect={onSelect}
                    onToggle={toggleSelection}
                    onDelete={onDelete}
                  />
                ))}
             </div>
           )}
        </div>

        {/* Footer */}
        <div className="p-3 md:p-4 border-t border-[#292524] bg-[#0c0a09] flex flex-col md:flex-row justify-between items-center px-4 md:px-8 gap-3 md:gap-0 shrink-0">
           <p className="text-[9px] md:text-[10px] terminal-font text-stone-600 uppercase tracking-widest italic text-center md:text-left">Tip: Use the selection ring for batch artifacts.</p>
           <button onClick={onClose} className="w-full md:w-auto px-10 py-2 bg-stone-900 border border-stone-700 text-stone-500 hover:text-stone-300 fantasy-font text-[10px] uppercase transition-all rounded">Return to Forge</button>
        </div>
      </div>
    </div>
  );
};

export default GalleryModal;
