
import React, { useState, useMemo } from 'react';
import { GeneratedArt, AnimationSettings } from '../../domain/entities';
import { generateAsepriteMetadata } from '../../utils/asepriteFormatter.ts';
import { generateKotlinFleksCode, generateComposeCode } from '../../utils/codeGenerator.ts';
import { useToast } from '../context/ToastContext';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeArt: GeneratedArt | null;
  settings: AnimationSettings;
  onExport: (mode: 'gif' | 'video' | 'png' | 'aseprite' | 'mobile' | 'atlas' | 'svg', options?: any) => void;
  isExporting?: boolean;
}

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, activeArt, settings, onExport, isExporting }) => {
  const [exportTab, setExportTab] = useState<'png' | 'gif' | 'video' | 'aseprite' | 'mobile' | 'atlas' | 'code' | 'compose' | 'svg'>('gif');
  const [adaptiveIcons, setAdaptiveIcons] = useState(true);
  const [useWebp, setUseWebp] = useState(true);
  const { whisper } = useToast();

  const asepritePreview = useMemo(() => {
    if (!activeArt) return null;
    return generateAsepriteMetadata(activeArt, settings);
  }, [activeArt, settings]);

  const codePreview = useMemo(() => {
    if (!activeArt) return null;
    return generateKotlinFleksCode(activeArt, settings);
  }, [activeArt, settings]);

  const composePreview = useMemo(() => {
    if (!activeArt) return null;
    return generateComposeCode(activeArt, settings);
  }, [activeArt, settings]);

  const handleCopyCode = (code: string | null) => {
    if (code) {
      navigator.clipboard.writeText(code);
      whisper("Snippet Inscribed", "Code successfully copied to clipboard.", "success");
    }
  };

  const handleExport = () => {
    if (exportTab === 'mobile') {
      onExport('mobile', { adaptiveIcons, useWebp });
    } else {
      onExport(exportTab as any);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
       <div className="w-full max-w-2xl fantasy-card bg-stone-900 flex flex-col shadow-2xl border-amber-900/50 max-h-[90vh]">
          <div className="flex items-center justify-between p-4 border-b border-stone-800 bg-stone-950">
             <h2 className="fantasy-font text-sm text-amber-500 uppercase tracking-widest flex items-center gap-2"><span>📦</span> Export Manifest</h2>
             <button onClick={onClose} aria-label="Close Export Modal" className="text-stone-500 hover:text-red-400 text-2xl leading-none transition-colors">×</button>
          </div>
          
          <div role="tablist" aria-label="Export Formats" className="flex bg-stone-950 border-b border-stone-800 overflow-x-auto custom-scrollbar">
             {(['gif', 'png', 'video', 'aseprite', 'mobile', 'atlas', 'code', 'compose', 'svg'] as const).map(tab => (
                <button 
                  key={tab} 
                  role="tab"
                  aria-selected={exportTab === tab}
                  aria-controls={`panel-${tab}`}
                  id={`tab-${tab}`}
                  onClick={() => setExportTab(tab)}
                  className={`px-6 py-3 text-[10px] fantasy-font uppercase tracking-widest transition-all whitespace-nowrap shrink-0 ${exportTab === tab ? 'bg-stone-900 text-amber-500 border-t-2 border-amber-600' : 'text-stone-600 hover:text-stone-400'}`}
                >
                  {tab === 'aseprite' ? 'Aseprite Flux' : tab === 'mobile' ? 'Universal Bundle' : tab === 'code' ? 'Code (Fleks)' : tab === 'compose' ? 'Compose (KMP)' : tab === 'atlas' ? 'Atlas (LittleKT)' : tab === 'svg' ? 'Vector (SVG)' : tab}
                </button>
             ))}
          </div>

          <div role="tabpanel" id={`panel-${exportTab}`} aria-labelledby={`tab-${exportTab}`} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
             {exportTab === 'aseprite' ? (
               <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
                  <div className="bg-sky-950/20 border border-sky-900/40 p-4 rounded space-y-3">
                     <div className="flex items-center gap-3">
                        <span className="text-2xl">📦</span>
                        <div>
                           <h3 className="fantasy-font text-xs text-sky-400 uppercase tracking-wide">Aseprite Metadata Grimoire</h3>
                           <p className="text-[10px] text-stone-500 italic">Universal JSON manifest with layer tags and frame timings.</p>
                        </div>
                     </div>
                     <div className="bg-black/80 border border-stone-800 p-3 rounded font-mono text-[10px] text-stone-400 overflow-x-auto whitespace-pre custom-scrollbar">
                        {asepritePreview}
                     </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="bg-stone-950 p-3 border border-stone-800 rounded">
                        <h4 className="text-[9px] fantasy-font text-stone-500 uppercase mb-2">Metadata Details</h4>
                        <ul className="text-[9px] text-stone-400 space-y-1">
                           <li>• Format: Aseprite JSON (Hash)</li>
                           <li>• Layers: {activeArt?.category.toUpperCase()}</li>
                           <li>• Frames: {settings.cols * settings.rows}</li>
                           <li>• Tags: {(activeArt?.actions || ['none']).join(", ").toUpperCase()}</li>
                        </ul>
                     </div>
                     <div className="bg-stone-950 p-3 border border-stone-800 rounded">
                        <h4 className="text-[9px] fantasy-font text-stone-500 uppercase mb-2">Import Rite</h4>
                        <p className="text-[9px] text-stone-400 italic leading-tight">Download both the Sprite Sheet (PNG) and this Metadata (JSON) into your project folder.</p>
                     </div>
                  </div>
               </div>
             ) : exportTab === 'mobile' ? (
               <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
                  <div className="bg-emerald-950/20 border border-emerald-900/40 p-4 rounded space-y-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">📱</span>
                        <div>
                            <h3 className="fantasy-font text-xs text-emerald-400 uppercase tracking-wide">Universal Mobile Bundle</h3>
                            <p className="text-[10px] text-stone-500 italic">Auto-scales to integer multipliers for Android & iOS retina screens.</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-2 text-center mt-4">
                         {[1, 2, 3, 4].map(scale => (
                           <div key={scale} className="bg-black/40 p-2 rounded border border-stone-800">
                              <div className="text-[8px] font-mono text-emerald-600 mb-1">@{scale}x</div>
                              <div className="text-[10px] fantasy-font text-stone-400">{scale * settings.targetResolution}px</div>
                           </div>
                         ))}
                      </div>

                      <div className="pt-4 border-t border-emerald-900/30 space-y-3">
                         <div className="flex items-center justify-between">
                            <div>
                               <h4 className="fantasy-font text-[10px] text-emerald-500 uppercase mb-1">Android Adaptive Icons</h4>
                               <p className="text-[9px] text-stone-500 italic">Generates Foreground + Background layers in mipmap-anydpi-v26.</p>
                            </div>
                            <button 
                               onClick={() => setAdaptiveIcons(!adaptiveIcons)}
                               className={`px-4 py-2 border rounded fantasy-font text-[9px] transition-all ${adaptiveIcons ? 'bg-emerald-900 border-emerald-500 text-emerald-200' : 'bg-black border-stone-800 text-stone-600'}`}
                            >
                               {adaptiveIcons ? 'ENABLED' : 'DISABLED'}
                            </button>
                         </div>

                         <div className="flex items-center justify-between border-t border-emerald-900/10 pt-3">
                            <div>
                               <h4 className="fantasy-font text-[10px] text-emerald-500 uppercase mb-1">WebP (Android Optimized)</h4>
                               <p className="text-[9px] text-stone-500 italic">Reduces APK size by using WebP for Android drawables.</p>
                            </div>
                            <button 
                               onClick={() => setUseWebp(!useWebp)}
                               className={`px-4 py-2 border rounded fantasy-font text-[9px] transition-all ${useWebp ? 'bg-emerald-900 border-emerald-500 text-emerald-200' : 'bg-black border-stone-800 text-stone-600'}`}
                            >
                               {useWebp ? 'WEB P' : 'PNG'}
                            </button>
                         </div>
                      </div>
                  </div>
               </div>
             ) : exportTab === 'compose' ? (
               <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
                  <div className="bg-sky-950/20 border border-sky-900/40 p-4 rounded space-y-3">
                      <div className="flex items-center gap-3">
                          <span className="text-2xl">📱</span>
                          <div>
                              <h3 className="fantasy-font text-xs text-sky-400 uppercase tracking-wide">Compose Multiplatform Resource</h3>
                              <p className="text-[10px] text-stone-500 italic">Kotlin code for Jetpack Compose (Android/Desktop/iOS).</p>
                          </div>
                      </div>
                      <div className="bg-black/80 border border-stone-800 p-3 rounded font-mono text-[10px] text-stone-400 overflow-x-auto whitespace-pre custom-scrollbar">
                          {composePreview}
                      </div>
                  </div>
               </div>
             ) : exportTab === 'code' ? (
                <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
                  <div className="bg-orange-950/20 border border-orange-900/40 p-4 rounded space-y-3">
                      <div className="flex items-center gap-3">
                          <span className="text-2xl">💻</span>
                          <div>
                              <h3 className="fantasy-font text-xs text-orange-400 uppercase tracking-wide">Fleks ECS Manifest</h3>
                              <p className="text-[10px] text-stone-500 italic">LittleKT + Fleks ECS entity definition.</p>
                          </div>
                      </div>
                      <div className="bg-black/80 border border-stone-800 p-3 rounded font-mono text-[10px] text-stone-400 overflow-x-auto whitespace-pre custom-scrollbar">
                          {codePreview}
                      </div>
                  </div>
                </div>
             ) : (
               <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300 text-center">
                  <div className="flex justify-center bg-black p-4 border border-stone-800 rounded aspect-square max-w-[300px] mx-auto overflow-hidden">
                     {activeArt && <img src={activeArt.imageUrl} className="w-full h-full object-contain image-pixelated" style={{ imageRendering: 'pixelated' }} />}
                  </div>
                  <div className="bg-stone-950 p-4 border border-stone-800 rounded max-w-md mx-auto">
                     <h3 className="fantasy-font text-xs text-amber-600 uppercase mb-2">Export Preparation</h3>
                     <p className="text-[10px] text-stone-500 leading-relaxed">Preparing {exportTab.toUpperCase()} at {settings.targetResolution}px base resolution.</p>
                  </div>
               </div>
             )}
          </div>

          <div className="p-6 border-t border-stone-800 bg-stone-950 flex gap-3">
             {exportTab === 'aseprite' && (
                <button onClick={() => onExport('png')} className="flex-1 py-4 bg-sky-900 text-sky-100 fantasy-font text-xs font-bold border border-sky-600 uppercase transition-all hover:bg-sky-800">1. Download PNG</button>
             )}
             
             {['code', 'compose'].includes(exportTab) ? (
                <button 
                  onClick={() => handleCopyCode(exportTab === 'code' ? codePreview : composePreview)}
                  className={`flex-1 py-4 fantasy-font text-xs font-bold uppercase transition-all shadow-lg ${exportTab === 'code' ? 'bg-orange-700 text-white border-orange-600 hover:bg-orange-600' : 'bg-sky-700 text-white border-sky-600 hover:bg-sky-600'}`}
                >
                  Copy Snippet
                </button>
             ) : (
                <button 
                    onClick={handleExport} 
                    disabled={isExporting}
                    aria-busy={isExporting}
                    className={`flex-1 py-4 bg-amber-600 text-black fantasy-font text-xs font-bold uppercase transition-all hover:bg-amber-500 shadow-[0_0_15px_rgba(217,119,6,0.3)] ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {isExporting ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        <span>Exporting...</span>
                      </span>
                    ) : (
                      exportTab === 'aseprite' ? '2. Download Metadata' : exportTab === 'mobile' ? 'Download .ZIP Bundle' : exportTab === 'atlas' ? 'Download Atlas (.zip)' : exportTab === 'svg' ? 'Download Vector (.svg)' : `Begin ${exportTab.toUpperCase()} Download`
                    )}
                </button>
             )}
          </div>
       </div>
    </div>
  );
};

export default ExportModal;
