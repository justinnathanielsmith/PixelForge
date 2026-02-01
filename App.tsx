import React, { useState, useEffect, useMemo } from 'react';
import { usePixelForge } from './ui/hooks/usePixelForge.ts';
import { GenerationState, PixelStyle, AssetCategory, AnimationAction, PixelPerspective } from './domain/entities.ts';
import SpritePreview from './ui/components/SpritePreview.tsx';
import SettingsPanel from './ui/components/SettingsPanel.tsx';
import UpcomingFeatures from './ui/components/UpcomingFeatures.tsx';
import UserGuide from './ui/components/UserGuide.tsx';

const App: React.FC = () => {
  const { state, dispatch, actions, refs } = usePixelForge();
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showUserGuide, setShowUserGuide] = useState(false);
  const [exportTab, setExportTab] = useState<'png' | 'gif' | 'video' | 'aseprite'>('gif');
  
  const { 
    prompt, genState, history, activeArt, inspiration, 
    animationSettings, isSpriteSheet, category, selectedActions, perspective, isExporting
  } = state;

  useEffect(() => {
    const checkKey = async () => {
      const selected = await (window as any).aistudio.hasSelectedApiKey();
      setHasApiKey(selected);
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    try {
      await (window as any).aistudio.openSelectKey();
      setHasApiKey(true);
    } catch (e) {
      console.error("Key selection flow error", e);
    }
  };

  const asepritePreview = useMemo(() => {
    if (!activeArt) return null;
    const { cols, rows, targetResolution, fps } = animationSettings;
    const frameDuration = Math.round(1000 / fps);
    const frames: Record<string, any> = {};
    
    // Safety check for actions array
    const artActions = activeArt.actions || ['none'];
    
    const frameTags = artActions.map((act, idx) => ({
      name: act.toUpperCase(),
      from: idx * cols,
      to: (idx + 1) * cols - 1,
      direction: "forward"
    }));

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        frames[`${activeArt.category}_${activeArt.id}_${i}.png`] = {
          frame: { x: c * targetResolution, y: r * targetResolution, w: targetResolution, h: targetResolution },
          duration: frameDuration
        };
      }
    }
    return JSON.stringify({
      frames,
      meta: {
        app: "Arcane Pixel Forge",
        version: "1.0",
        image: `pxl_flux_${activeArt.id}.png`,
        frameTags
      }
    }, null, 2);
  }, [activeArt, animationSettings]);

  if (hasApiKey === null) return null;

  if (!hasApiKey) {
    return (
      <div className="min-h-screen bg-[#0c0a09] flex items-center justify-center p-6 font-serif">
        <div className="max-w-xl w-full fantasy-card bg-[#1c1917] p-8 space-y-8 text-center border-amber-900/50 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-600 to-transparent"></div>
          <div className="space-y-4">
             <div className="w-16 h-16 bg-amber-600/20 border border-amber-500/50 mx-auto rotate-45 flex items-center justify-center shadow-[0_0_20px_rgba(217,119,6,0.2)]">
                <span className="text-3xl -rotate-45">✨</span>
             </div>
             <h1 className="fantasy-font text-3xl text-amber-500 tracking-tighter uppercase">Forge Authorization</h1>
             <p className="text-stone-400 text-sm leading-relaxed max-w-sm mx-auto">
               To access the <span className="text-amber-600 font-bold">Arcane Pixel Forge</span> and harness Gemini 3 Pro, you must authenticate with a billing-enabled API key.
             </p>
          </div>
          <div className="bg-black/40 border border-stone-800 p-4 rounded text-left space-y-3">
             <p className="text-[10px] fantasy-font text-stone-500 uppercase tracking-widest border-b border-stone-800 pb-2">Preparation Ritual</p>
             <ul className="text-xs text-stone-300 space-y-2 list-disc pl-4">
                <li>Select a project with active billing enabled.</li>
                <li>The forge uses <span className="text-sky-400">Gemini 3 Pro</span> for maximum fidelity.</li>
                <li>The selected API key will be managed securely by the platform.</li>
             </ul>
          </div>
          <div className="flex flex-col gap-4">
            <button onClick={handleSelectKey} className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-black fantasy-font font-bold text-lg transition-all shadow-[0_0_15px_rgba(217,119,6,0.3)]">Select API Key</button>
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-stone-600 hover:text-amber-700 text-[10px] uppercase fantasy-font tracking-widest transition-colors">Consult the Billing Grimoire ↗</a>
          </div>
        </div>
      </div>
    );
  }

  const assetCategories: { id: AssetCategory; label: string; icon: string }[] = [
    { id: 'character', label: 'HERO', icon: '👤' },
    { id: 'enemy', label: 'FOE', icon: '👹' },
    { id: 'tileset', label: 'TILE', icon: '🧱' },
    { id: 'prop', label: 'PROP', icon: '📦' },
    { id: 'background', label: 'SCENE', icon: '🌅' },
  ];

  const animationActions: { id: AnimationAction; label: string }[] = [
    { id: 'idle', label: 'IDLE' },
    { id: 'walk', label: 'WALK' },
    { id: 'jump', label: 'JUMP' },
    { id: 'attack', label: 'ATK' },
    { id: 'death', label: 'DIE' },
  ];

  const viewPerspectives: { id: PixelPerspective; label: string; icon: string }[] = [
    { id: 'side', label: 'SIDE', icon: '↔️' },
    { id: 'isometric', label: 'ISO', icon: '💎' },
  ];

  return (
    <div className="min-h-screen flex flex-col selection:bg-amber-500 selection:text-black">
      <header className="border-b-4 border-[#44403c] bg-[#1c1917] py-3 shadow-lg relative z-20">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-gradient-to-tr from-amber-600 to-red-800 border-2 border-[#d97706] shadow-[2px_2px_0_#000] rotate-45 transform ml-2" />
             <div className="ml-2">
                <h1 className="fantasy-font text-2xl text-amber-500 drop-shadow-[2px_2px_0_#000] leading-none tracking-wide">ARCANE FORGE</h1>
                <div className="flex gap-2 text-[10px] fantasy-font uppercase text-stone-500 tracking-widest mt-1">
                   <span>GEMINI 3 PRO</span>
                   <span className="text-emerald-600">ENCHANTMENT ACTIVE</span>
                </div>
             </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowUserGuide(true)} className="text-[9px] fantasy-font text-amber-600 hover:text-amber-500 uppercase tracking-widest border border-amber-900/50 bg-amber-950/20 px-3 py-1 rounded transition-all">📜 Grimoire Guide</button>
            <button onClick={handleSelectKey} className="text-[9px] fantasy-font text-stone-500 hover:text-amber-500 uppercase tracking-widest border border-stone-800 px-3 py-1 rounded transition-all">Switch Key</button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 grid lg:grid-cols-12 gap-6 items-start relative">
        <div className="lg:col-span-4 space-y-6">
          <section className="fantasy-card p-4 relative overflow-hidden">
            <div className="absolute -top-3 left-4 bg-[#1c1917] px-2 text-[10px] fantasy-font font-bold text-amber-500 border border-[#57534e] uppercase tracking-widest">The Grimoire</div>
            <form onSubmit={actions.generateArt} className="space-y-5 pt-2">
               <div className="space-y-2">
                  <div className="flex gap-2 h-28">
                     <div onClick={() => refs.fileInputRef.current?.click()} className={`w-20 border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all relative shrink-0 ${inspiration ? 'border-emerald-600 bg-emerald-900/10 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'border-[#44403c] bg-[#0c0a09]'}`}>
                        {inspiration ? (
                          <div className="relative w-full h-full p-1 group">
                            <img src={inspiration.url} className="w-full h-full object-contain" style={{ imageRendering: 'pixelated' }} />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><span className="text-[8px] fantasy-font text-white text-center px-1 text-xs">Change</span></div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center"><span className="fantasy-font text-2xl">🔮</span><span className="text-[7px] fantasy-font text-stone-500 mt-1 uppercase">Oracle</span></div>
                        )}
                        <input ref={refs.fileInputRef} type="file" accept="image/*" onChange={actions.handleImageUpload} className="hidden" />
                     </div>
                     <textarea value={prompt} onChange={(e) => dispatch({ type: 'SET_PROMPT', payload: e.target.value })} placeholder="Inscribe entity description (e.g. 'Undead Lich in dark robes')..." className="flex-1 fantasy-input p-3 text-sm resize-none leading-relaxed" />
                  </div>
               </div>
               
               <div className="space-y-4 bg-black/20 p-3 border border-stone-800 rounded">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] fantasy-font text-stone-500 uppercase tracking-widest">Asset Mode</label>
                      <div className="flex gap-1">
                        <button type="button" onClick={() => dispatch({ type: 'SET_SPRITE_SHEET', payload: false })} className={`flex-1 py-1.5 text-[8px] fantasy-font border rounded transition-all ${!isSpriteSheet ? 'bg-amber-600 text-black border-amber-300' : 'bg-transparent border-stone-800 text-stone-600'}`}>SINGLE</button>
                        <button type="button" onClick={() => dispatch({ type: 'SET_SPRITE_SHEET', payload: true })} className={`flex-1 py-1.5 text-[8px] fantasy-font border rounded transition-all ${isSpriteSheet ? 'bg-amber-600 text-black border-amber-300' : 'bg-transparent border-stone-800 text-stone-600'}`}>SHEET</button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] fantasy-font text-stone-500 uppercase tracking-widest text-right block">View Angle</label>
                      <div className="flex gap-1">
                        {viewPerspectives.map(p => (
                          <button key={p.id} type="button" onClick={() => dispatch({ type: 'SET_PERSPECTIVE', payload: p.id })} className={`flex-1 py-1.5 text-[8px] fantasy-font border rounded transition-all flex items-center justify-center gap-1 ${perspective === p.id ? 'bg-sky-600 text-black border-sky-300' : 'bg-transparent border-stone-800 text-stone-600'}`}>{p.label}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] fantasy-font text-stone-500 uppercase tracking-widest">Entity Essence</label>
                    <div className="grid grid-cols-5 gap-1">
                      {assetCategories.map(cat => (
                        <button key={cat.id} type="button" onClick={() => dispatch({ type: 'SET_CATEGORY', payload: cat.id })} className={`py-1.5 flex flex-col items-center justify-center border rounded transition-all ${category === cat.id ? 'bg-amber-600 text-black border-amber-300' : 'bg-[#0c0a09] border-stone-800 text-stone-600'}`}>
                          <span className="text-xs">{cat.icon}</span>
                          <span className="text-[7px] font-bold mt-0.5">{cat.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  {isSpriteSheet && (
                    <div className="space-y-1">
                      <div className="flex justify-between items-end mb-1">
                        <label className="text-[9px] fantasy-font text-stone-500 uppercase tracking-widest">Action Atlas (Multi-Select)</label>
                        {selectedActions.length > 1 && <span className="text-[8px] font-mono text-emerald-500 uppercase">Multi-Sheet Mode</span>}
                      </div>
                      <div className="grid grid-cols-5 gap-1">
                        {animationActions.map(act => (
                          <button 
                            key={act.id} 
                            type="button" 
                            onClick={() => dispatch({ type: 'TOGGLE_ACTION', payload: act.id })} 
                            className={`py-1.5 text-[8px] fantasy-font border rounded transition-all ${selectedActions.includes(act.id) ? 'bg-red-800 text-red-50 border-red-500 shadow-[0_0_8px_rgba(153,27,27,0.4)]' : 'bg-[#0c0a09] border-stone-800 text-stone-600'}`}
                          >
                            {act.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
               </div>

               <button type="submit" disabled={genState === GenerationState.GENERATING || !prompt.trim() || (isSpriteSheet && selectedActions.length === 0)} className="w-full py-4 fantasy-btn bg-red-800 text-red-50 hover:bg-red-700 disabled:opacity-50">
                  {genState === GenerationState.GENERATING ? 'TRANSMUTING...' : 'SUMMON ENTITY'}
               </button>
            </form>
          </section>
          <UpcomingFeatures />
        </div>

        <div className="lg:col-span-8 flex flex-col h-full gap-6">
           <div className="grid md:grid-cols-12 gap-6 h-full">
              <div className="md:col-span-7 flex flex-col gap-4">
                 <div className="fantasy-card p-2 bg-[#0c0a09] relative aspect-square flex flex-col border-[#78350f]">
                    <div className="flex-1 relative bg-[#020202] flex items-center justify-center overflow-hidden border border-[#292524] shadow-inner">
                       {genState === GenerationState.GENERATING ? (
                         <div className="flex flex-col items-center gap-4 text-center">
                            <div className="w-12 h-12 border-4 border-amber-950 border-t-amber-500 rounded-full animate-spin" />
                            <p className="fantasy-font text-xs text-amber-500 animate-pulse uppercase tracking-widest">Scribing to Reality...</p>
                         </div>
                       ) : (
                         activeArt && (
                           <SpritePreview 
                              imageUrl={activeArt.imageUrl} 
                              settings={animationSettings} 
                              style={activeArt.style} 
                              isBatch={activeArt.type === 'batch'}
                              normalMapUrl={activeArt.normalMapUrl}
                              onGenerateNormalMap={actions.generateNormalMap}
                              skeleton={activeArt.skeleton}
                              onGenerateSkeleton={actions.generateSkeleton}
                              isGenerating={isExporting} 
                           />
                         )
                       )}
                    </div>
                 </div>
                 {activeArt && (
                    <div className="flex gap-2 justify-end">
                       <button onClick={() => dispatch({ type: 'PIN_DESIGN', payload: activeArt })} className="px-6 py-2 bg-emerald-700 text-white text-[10px] fantasy-font rounded border-b-2 border-emerald-900 uppercase hover:bg-emerald-600 transition-all">✨ Refine Design</button>
                       <button onClick={() => setShowExportModal(true)} className="px-6 py-2 bg-[#1e3a8a] text-white text-[10px] fantasy-font rounded border-b-2 border-blue-900 uppercase hover:bg-blue-800 transition-all">Export Manifest</button>
                    </div>
                 )}
              </div>
              <div className="md:col-span-5 h-full">
                 <div className="fantasy-card h-full p-5 bg-[#1c1917] border-[#44403c]">
                    <SettingsPanel settings={animationSettings} setSettings={(s) => dispatch({ type: 'UPDATE_SETTINGS', payload: s })} />
                 </div>
              </div>
           </div>
           
           <section className="w-full bg-black/20 p-2 border border-stone-800/50 rounded flex gap-4 overflow-x-auto h-28 items-center custom-scrollbar">
              {history.map(art => (
                 <button key={art.id} onClick={() => dispatch({ type: 'SET_ACTIVE_ART', payload: art })} className={`w-20 h-20 border-2 rounded shrink-0 overflow-hidden transition-all relative ${activeArt?.id === art.id ? 'border-amber-500 scale-95 shadow-[0_0_15px_rgba(217,119,6,0.3)]' : 'border-[#44403c] grayscale opacity-60 hover:grayscale-0 hover:opacity-100'}`}>
                    <img src={art.imageUrl} className="w-full h-full object-cover" style={{ imageRendering: 'pixelated' }} />
                    <div className="absolute top-0 right-0 p-0.5 bg-black/60 text-[6px] font-mono text-stone-400">{art.type.split('-')[0].toUpperCase()}</div>
                 </button>
              ))}
           </section>
        </div>

        {showUserGuide && <UserGuide onClose={() => setShowUserGuide(false)} />}

        {showExportModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
             <div className="w-full max-w-2xl fantasy-card bg-[#1c1917] flex flex-col shadow-2xl border-amber-900/50 max-h-[90vh]">
                <div className="flex items-center justify-between p-4 border-b border-[#44403c] bg-[#0c0a09]">
                   <h2 className="fantasy-font text-sm text-amber-500 uppercase tracking-widest flex items-center gap-2"><span>📦</span> Export Manifest</h2>
                   <button onClick={() => setShowExportModal(false)} className="text-stone-500 hover:text-red-400 text-2xl leading-none transition-colors">×</button>
                </div>
                
                <div className="flex bg-[#0a0807] border-b border-[#44403c]">
                   {(['gif', 'png', 'video', 'aseprite'] as const).map(tab => (
                      <button 
                        key={tab} 
                        onClick={() => setExportTab(tab)}
                        className={`px-6 py-3 text-[10px] fantasy-font uppercase tracking-widest transition-all ${exportTab === tab ? 'bg-[#1c1917] text-amber-500 border-t-2 border-amber-600' : 'text-stone-600 hover:text-stone-400'}`}
                      >
                        {tab === 'aseprite' ? 'Aseprite Flux' : tab}
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
                                 <li>• Frames: {animationSettings.cols * animationSettings.rows}</li>
                                 <li>• Tags: {(activeArt?.actions || ['none']).join(", ").toUpperCase()}</li>
                              </ul>
                           </div>
                           <div className="bg-[#0c0a09] p-3 border border-stone-800 rounded">
                              <h4 className="text-[9px] fantasy-font text-stone-500 uppercase mb-2">Import Rite</h4>
                              <p className="text-[9px] text-stone-400 italic leading-tight">Download both the Sprite Sheet (PNG) and this Metadata (JSON) into your project folder.</p>
                           </div>
                        </div>
                     </div>
                   ) : (
                     <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300 text-center">
                        <div className="flex justify-center bg-[#020202] p-4 border border-[#292524] rounded aspect-square max-w-[300px] mx-auto overflow-hidden">
                           {activeArt && <img src={activeArt.imageUrl} className="w-full h-full object-contain image-pixelated" style={{ imageRendering: 'pixelated' }} />}
                        </div>
                        <div className="bg-[#0c0a09] p-4 border border-stone-800 rounded max-w-md mx-auto">
                           <h3 className="fantasy-font text-xs text-amber-600 uppercase mb-2">Export Preparation</h3>
                           <p className="text-[10px] text-stone-500 leading-relaxed">Preparing {exportTab.toUpperCase()} at {animationSettings.targetResolution}px base resolution. Color-accurate downsampling is active.</p>
                        </div>
                     </div>
                   )}
                </div>

                <div className="p-6 border-t border-[#44403c] bg-[#0c0a09] flex gap-3">
                   {exportTab === 'aseprite' && (
                      <button onClick={() => actions.exportAsset('png')} className="flex-1 py-4 bg-sky-900 text-sky-100 fantasy-font text-xs font-bold border border-sky-600 uppercase transition-all hover:bg-sky-800">1. Download PNG</button>
                   )}
                   <button onClick={() => actions.exportAsset(exportTab)} className="flex-1 py-4 bg-amber-600 text-black fantasy-font text-xs font-bold uppercase transition-all hover:bg-amber-500 shadow-[0_0_15px_rgba(217,119,6,0.3)]">
                      {exportTab === 'aseprite' ? '2. Download Metadata' : `Begin ${exportTab.toUpperCase()} Download`}
                   </button>
                </div>
             </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;