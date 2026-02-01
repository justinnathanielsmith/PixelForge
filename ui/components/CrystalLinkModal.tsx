
import React from 'react';
import { GeneratedArt } from '../../domain/entities';

interface CrystalLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeArt: GeneratedArt | null;
}

const CrystalLinkModal: React.FC<CrystalLinkModalProps> = ({ isOpen, onClose, activeArt }) => {
  if (!isOpen) return null;

  const getViewerUrl = () => {
     if (!activeArt) return '';
     const baseUrl = window.location.href.split('?')[0];
     return `${baseUrl}?view=mobile&id=${activeArt.id}`;
  };

  const viewerUrl = getViewerUrl();
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(viewerUrl)}&bgcolor=1c1917&color=d97706`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
       <div className="w-full max-w-sm fantasy-card bg-[#1c1917] flex flex-col shadow-2xl border-amber-900/50 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-[#44403c] bg-[#0c0a09]">
             <div className="flex items-center gap-2">
                <span className="text-xl">💎</span>
                <h2 className="fantasy-font text-sm text-amber-500 uppercase tracking-widest">Crystal Link</h2>
             </div>
             <button onClick={onClose} className="text-stone-500 hover:text-red-400 text-2xl leading-none transition-colors">×</button>
          </div>
          
          <div className="p-8 flex flex-col items-center gap-6">
             {!activeArt ? (
                <div className="text-center text-stone-500 space-y-2">
                   <p className="text-2xl">🌫️</p>
                   <p className="text-xs fantasy-font uppercase">No Artifact Selected</p>
                </div>
             ) : (
                <>
                   <div className="p-2 bg-white rounded shadow-[0_0_25px_rgba(217,119,6,0.2)]">
                      <img src={qrUrl} alt="Crystal Link QR" className="w-[200px] h-[200px]" />
                   </div>
                   
                   <div className="text-center space-y-2">
                      <p className="fantasy-font text-xs text-amber-600 uppercase tracking-widest font-bold">Scan to Materialize</p>
                      <p className="text-[10px] text-stone-500 max-w-[200px] mx-auto leading-relaxed">
                         Open this artifact in the <strong>Mobile Viewer</strong>.
                         <br/><span className="text-stone-600 italic">(Requires device on same network or local capability)</span>
                      </p>
                   </div>

                   <div className="w-full bg-black/40 p-2 rounded border border-stone-800 flex gap-2 items-center">
                      <input 
                        type="text" 
                        readOnly 
                        value={viewerUrl} 
                        className="bg-transparent border-none text-[8px] text-stone-500 font-mono w-full outline-none" 
                      />
                      <button 
                        onClick={() => navigator.clipboard.writeText(viewerUrl)}
                        className="text-[10px] text-amber-600 hover:text-amber-500 uppercase font-bold px-2"
                      >
                         Copy
                      </button>
                   </div>
                </>
             )}
          </div>
       </div>
    </div>
  );
};

export default CrystalLinkModal;
