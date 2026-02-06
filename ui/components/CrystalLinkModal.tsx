import React, { useState, useMemo } from 'react';
import { GeneratedArt } from '../../domain/entities';

interface CrystalLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeArt: GeneratedArt | null;
}

const CrystalLinkModal: React.FC<CrystalLinkModalProps> = ({ isOpen, onClose, activeArt }) => {
  const [overrideIp, setOverrideIp] = useState('');
  
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  const viewerUrl = useMemo(() => {
     if (!activeArt) return '';
     const url = new URL(window.location.href.split('?')[0]);
     
     if (isLocal && overrideIp) {
        url.hostname = overrideIp;
     }
     
     url.searchParams.set('view', 'mobile');
     url.searchParams.set('id', activeArt.id);
     return url.toString();
  }, [activeArt, overrideIp, isLocal]);

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(viewerUrl)}&bgcolor=1c1917&color=d97706`;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
       <div className="w-full max-w-sm fantasy-card bg-[#1c1917] flex flex-col shadow-2xl border-amber-900/50 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-[#44403c] bg-[#0c0a09]">
             <div className="flex items-center gap-2">
                <span className="text-xl">💎</span>
                <h2 className="fantasy-font text-sm text-amber-500 uppercase tracking-widest">Crystal Link</h2>
             </div>
             <button onClick={onClose} aria-label="Close Crystal Link Modal" className="text-stone-500 hover:text-red-400 text-2xl leading-none transition-colors">×</button>
          </div>
          
          <div className="p-6 flex flex-col items-center gap-6">
             {!activeArt ? (
                <div className="text-center text-stone-500 space-y-2 py-4">
                   <p className="text-2xl">🌫️</p>
                   <p className="text-xs fantasy-font uppercase">No Artifact Selected</p>
                </div>
             ) : (
                <>
                   {isLocal && (
                      <div className="w-full bg-amber-950/20 border border-amber-900/40 p-3 rounded text-center space-y-2 animate-in slide-in-from-top-2">
                         <p className="text-[10px] fantasy-font text-amber-500 uppercase font-bold">Localhost Detected</p>
                         <p className="text-[9px] text-stone-400 italic leading-tight">Your mobile device cannot resolve 'localhost'. Replace it with your LAN IP (e.g. 192.168.1.5) to sync.</p>
                         <div className="flex gap-1">
                            <input 
                               type="text" 
                               placeholder="Enter Local IP" 
                               value={overrideIp} 
                               onChange={(e) => setOverrideIp(e.target.value)}
                               className="flex-1 bg-black/40 border border-amber-900/30 text-[10px] p-1 text-amber-400 font-mono outline-none focus:border-amber-500"
                            />
                         </div>
                      </div>
                   )}

                   <div className="p-2 bg-white rounded shadow-[0_0_25px_rgba(217,119,6,0.2)]">
                      <img src={qrUrl} alt="Crystal Link QR" className="w-[180px] h-[180px]" />
                   </div>
                   
                   <div className="text-center space-y-2">
                      <p className="fantasy-font text-xs text-amber-600 uppercase tracking-widest font-bold">Scan to Materialize</p>
                      <p className="text-[10px] text-stone-500 max-w-[200px] mx-auto leading-relaxed">
                         Open this artifact in the <strong>Mobile Viewer</strong>.
                         <br/><span className="text-stone-600 italic">(Requires device on same network)</span>
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