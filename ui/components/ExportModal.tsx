
import React, { useState, useMemo } from 'react';
import { GeneratedArt, AnimationSettings } from '../../domain/entities';
import { generateAsepriteMetadata } from '../../utils/asepriteFormatter.ts';
import { generateKotlinFleksCode } from '../../utils/codeGenerator.ts';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeArt: GeneratedArt | null;
  settings: AnimationSettings;
  onExport: (mode: 'gif' | 'video' | 'png' | 'aseprite' | 'mobile' | 'atlas') => void;
}

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, activeArt, settings, onExport }) => {
  const [exportTab, setExportTab] = useState<'png' | 'gif' | 'video' | 'aseprite' | 'mobile' | 'atlas' | 'code'>('gif');
  const [copyFeedback, setCopyFeedback] = useState(false);

  const asepritePreview = useMemo(() => {
    if (!activeArt) return null;
    return generateAsepriteMetadata(activeArt, settings);
  }, [activeArt, settings]);

  const codePreview = useMemo(() => {
    if (!activeArt) return null;
    return generateKotlinFleksCode(activeArt, settings);
  }, [activeArt, settings]);

  const handleCopyCode = () => {
    if (codePreview) {
      navigator.clipboard.writeText(codePreview);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
       <div className="w-full max-w-2xl fantasy-card bg-[#1c1917] flex flex-col shadow-2xl border-amber-900/50 max-h-[90vh]">
          <div className="flex items-center justify-between p-4 border-b border-[#44403c] bg-[#0c0a09]">
             <h2 className="fantasy-font text-sm text-amber-500 uppercase tracking-widest flex items-center gap-2"><span>📦</span> Export Manifest</h2>
             <button onClick={onClose} className="text-stone-500 hover:text-red-400 text-2xl leading-none transition-colors">×</button>
          </div>
          
          <div className="flex bg-[#0a0807] border-b border-[#44403c] overflow-x-auto custom-scrollbar">
             {(['gif', 'png', 'video', 'aseprite', 'mobile', 'atlas', 'code'] as const).map(tab => (
                <button 
                  key={tab} 
                  onClick={() => setExportTab(tab)}
                  className={`px-6 py-3 text-[10px] fantasy-font uppercase tracking-widest transition-all whitespace-nowrap shrink-0 ${exportTab === tab ? 'bg-[#1c1917] text-amber-500 border-t-2 border-amber-600' : 'text-stone-600 hover:text-stone-400'}`}
                >
                  {tab === 'aseprite' ? 'Aseprite Flux' : tab === 'mobile' ? 'Universal Bundle' : tab === 'code' ? 'Code (Kotlin)' : tab === 'atlas' ? 'Atlas (LittleKT)' : tab}
                </button>
             ))}
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
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
                     <div className="bg-[#0c0a09] p-3 border border-stone-800 rounded">
                        <h4 className="text-[9px] fantasy-font text-stone-500 uppercase mb-2">Metadata Details</h4>
                        <ul className="text-[9px] text-stone-400 space-y-1">
                           <li>• Format: Aseprite JSON (Hash)</li>
                           <li>• Layers: {activeArt?.category.toUpperCase()}</li>
                           <li>• Frames: {settings.cols * settings.rows}</li>
                           <li>• Tags: {(activeArt?.actions || ['none']).join(", ").toUpperCase()}</li>
                        </ul>
                     </div>
                     <div className="bg-[#0c0a09] p-3 border border-stone-800 rounded">
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
                            <p className="text-[10px] text-stone-500 italic">Auto-scales to integer multipliers for crisp rendering on Android & iOS retina screens.</p>
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
                  </div>
                  
                  <div className="bg-[#0c0a09] p-3 border border-stone-800 rounded">
                      <h4 className="text-[9px] fantasy-font text-stone-500 uppercase mb-2">Payload Contents (ZIP)</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                            <span className="text-[9px] text-emerald-500 font-bold block mb-1">Android Structure</span>
                            <ul className="text-[9px] text-stone-400 space-y-1 font-mono">
                                <li>📁 android/drawable-mdpi/ (1x)</li>
                                <li>📁 android/drawable-xhdpi/ (2x)</li>
                                <li>📁 android/drawable-xxhdpi/ (3x)</li>
                                <li>📁 android/drawable-xxxhdpi/ (4x)</li>
                            </ul>
                        </div>
                        <div>
                            <span className="text-[9px] text-sky-500 font-bold block mb-1">iOS Asset Catalog</span>
                            <ul className="text-[9px] text-stone-400 space-y-1 font-mono">
                                <li>📁 ios/Assets.xcassets/</li>
                                <li>&nbsp;&nbsp;└ 📄 Contents.json</li>
                                <li>&nbsp;&nbsp;└ 🖼️ 1x, @2x, @3x</li>
                            </ul>
                        </div>
                      </div>
                  </div>
               </div>
             ) : exportTab === 'atlas' ? (
                <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
                   <div className="bg-purple-950/20 border border-purple-900/40 p-4 rounded space-y-3">
                      <div className="flex items-center gap-3">
                         <span className="text-2xl">🗺️</span>
                         <div>
                            <h3 className="fantasy-font text-xs text-purple-400 uppercase tracking-wide">LittleKT Texture Atlas</h3>
                            <p className="text-[10px] text-stone-500 italic">Packed ZIP containing Sprite Sheet (PNG) and Atlas Definition (JSON).</p>
                         </div>
                      </div>
                      <div className="bg-[#0c0a09] p-3 border border-stone-800 rounded">
                        <h4 className="text-[9px] fantasy-font text-stone-500 uppercase mb-2">Usage in Kotlin</h4>
                        <div className="bg-black/80 border border-stone-800 p-2 rounded font-mono text-[9px] text-stone-400">
                           <p className="mb-1 text-purple-400">val atlas = resourcesVfs["{activeArt?.prompt.substring(0,10).replace(/\s/g,'_')}.json"].readAtlas()</p>
                           <p className="text-stone-500">// Access regions by name (e.g., 'idle_0', 'icon_5')</p>
                           <p>val sprite = atlas["{activeArt?.category === 'icon_set' ? 'icon_0' : 'idle_0'}"]</p>
                        </div>
                      </div>
                   </div>
                   <div className="bg-[#0c0a09] p-3 border border-stone-800 rounded">
                      <h4 className="text-[9px] fantasy-font text-stone-500 uppercase mb-2">Region Naming Protocol</h4>
                      <ul className="text-[9px] text-stone-400 space-y-1 ml-2 list-disc">
                         <li><strong className="text-purple-400">Icon Sets:</strong> icon_0, icon_1, icon_2...</li>
                         <li><strong className="text-purple-400">Characters:</strong> action_0, action_1 (e.g., walk_0, attack_0)</li>
                         <li><strong className="text-purple-400">Generic:</strong> frame_0, frame_1...</li>
                      </ul>
                   </div>
                </div>
             ) : exportTab === 'code' ? (
                <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
                  <div className="bg-orange-950/20 border border-orange-900/40 p-4 rounded space-y-3">
                      <div className="flex items-center gap-3">
                          <span className="text-2xl">💻</span>
                          <div>
                              <h3 className="fantasy-font text-xs text-orange-400 uppercase tracking-wide">Kotlin / Fleks Manifest</h3>
                              <p className="text-[10px] text-stone-500 italic">LittleKT + Fleks ECS entity definition.</p>
                          </div>
                      </div>
                      <div className="bg-black/80 border border-stone-800 p-3 rounded font-mono text-[10px] text-stone-400 overflow-x-auto whitespace-pre custom-scrollbar">
                          {codePreview}
                      </div>
                  </div>
                  <div className="bg-[#0c0a09] p-3 border border-stone-800 rounded">
                      <h4 className="text-[9px] fantasy-font text-stone-500 uppercase mb-2">Integration Instructions</h4>
                      <p className="text-[9px] text-stone-400 italic leading-tight">
                        This snippet defines a World Entity compatible with Fleks ECS. Ensure your asset is loaded into the `resources` object with the generated name before invoking this builder.
                      </p>
                  </div>
                </div>
             ) : (
               <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300 text-center">
                  <div className="flex justify-center bg-[#020202] p-4 border border-[#292524] rounded aspect-square max-w-[300px] mx-auto overflow-hidden">
                     {activeArt && <img src={activeArt.imageUrl} className="w-full h-full object-contain image-pixelated" style={{ imageRendering: 'pixelated' }} />}
                  </div>
                  <div className="bg-[#0c0a09] p-4 border border-stone-800 rounded max-w-md mx-auto">
                     <h3 className="fantasy-font text-xs text-amber-600 uppercase mb-2">Export Preparation</h3>
                     <p className="text-[10px] text-stone-500 leading-relaxed">Preparing {exportTab.toUpperCase()} at {settings.targetResolution}px base resolution. Color-accurate downsampling is active.</p>
                  </div>
               </div>
             )}
          </div>

          <div className="p-6 border-t border-[#44403c] bg-[#0c0a09] flex gap-3">
             {exportTab === 'aseprite' && (
                <button onClick={() => onExport('png')} className="flex-1 py-4 bg-sky-900 text-sky-100 fantasy-font text-xs font-bold border border-sky-600 uppercase transition-all hover:bg-sky-800">1. Download PNG</button>
             )}
             
             {exportTab === 'code' ? (
                <button 
                  onClick={handleCopyCode}
                  className={`flex-1 py-4 fantasy-font text-xs font-bold uppercase transition-all shadow-[0_0_15px_rgba(249,115,22,0.3)] ${copyFeedback ? 'bg-green-700 text-white border border-green-500' : 'bg-orange-700 text-white border border-orange-600 hover:bg-orange-600'}`}
                >
                  {copyFeedback ? '✨ Copied to Clipboard' : 'Copy Snippet to Clipboard'}
                </button>
             ) : (
                <button 
                    onClick={() => onExport(exportTab as any)} 
                    className="flex-1 py-4 bg-amber-600 text-black fantasy-font text-xs font-bold uppercase transition-all hover:bg-amber-500 shadow-[0_0_15px_rgba(217,119,6,0.3)]"
                >
                    {exportTab === 'aseprite' ? '2. Download Metadata' : exportTab === 'mobile' ? 'Download .ZIP Bundle' : exportTab === 'atlas' ? 'Download Atlas (.zip)' : `Begin ${exportTab.toUpperCase()} Download`}
                </button>
             )}
          </div>
       </div>
    </div>
  );
};

export default ExportModal;
