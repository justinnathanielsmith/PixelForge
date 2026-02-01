
import React, { useState, useEffect } from 'react';
import { usePixelForge } from './ui/hooks/usePixelForge.ts';
import { GenerationState } from './domain/entities.ts';
import { ASSET_CATEGORIES, ANIMATION_ACTIONS, VIEW_PERSPECTIVES } from './domain/constants.ts';
import SpritePreview from './ui/components/SpritePreview.tsx';
import SettingsPanel from './ui/components/SettingsPanel.tsx';
import UpcomingFeatures from './ui/components/UpcomingFeatures.tsx';
import UserGuide from './ui/components/UserGuide.tsx';
import { Gatekeeper } from './ui/components/Gatekeeper.tsx';
import ExportModal from './ui/components/ExportModal.tsx';
import GalleryModal from './ui/components/GalleryModal.tsx';
import CrystalLinkModal from './ui/components/CrystalLinkModal.tsx';
import MobileViewer from './ui/components/MobileViewer.tsx';
import { ToastProvider } from './ui/context/ToastContext.tsx';
import { ToastContainer } from './ui/components/Toast.tsx';

const AppContent: React.FC = () => {
  const { state, dispatch, actions, refs } = usePixelForge();
  const [showExportModal, setShowExportModal] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [showUserGuide, setShowUserGuide] = useState(false);
  const [showManifesto, setShowManifesto] = useState(false);
  const [showCrystalLink, setShowCrystalLink] = useState(false);
  
  const { 
    prompt, genState, history, activeArt, inspiration, 
    animationSettings, isSpriteSheet, category, selectedActions, perspective, isExporting, errorMessage
  } = state;

  const handleSwitchKey = async () => {
    try {
      await window.aistudio.openSelectKey();
    } catch (e) {
      console.error("Key selection error", e);
    }
  };

  // --- Keyboard Shortcuts (Power User Suite) ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

      // 1. Generate: Ctrl+Enter (Allowed while typing)
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        actions.generateArt();
        return;
      }

      // 2. Export PNG: Ctrl+S (Allowed while typing)
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        actions.exportAsset('png');
        return;
      }

      // 3. Toggle Play/Pause: Space (Only if not typing)
      if (e.code === 'Space' && !isTyping) {
        e.preventDefault();
        dispatch({ type: 'UPDATE_SETTINGS', payload: { isPlaying: !animationSettings.isPlaying } });
        return;
      }

      // 4. Navigate History: Arrows (Only if not typing)
      if (!isTyping) {
        if (e.key === 'ArrowLeft') {
           // Left = Newer (Index 0 is visual left)
           actions.navigateHistory('newer');
        } else if (e.key === 'ArrowRight') {
           // Right = Older
           actions.navigateHistory('older');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [actions, animationSettings.isPlaying, dispatch]);

  return (
    <Gatekeeper>
      {/* --- Arcane Aura Background Layers --- */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          {/* Amber Glow (Top Left) */}
          <div className="aura-orb w-[800px] h-[800px] bg-amber-600/10 -top-[200px] -left-[200px] animate-float-slow" />
          {/* Mana Glow (Bottom Right) */}
          <div className="aura-orb w-[700px] h-[700px] bg-purple-900/15 bottom-[-150px] right-[-150px] animate-float-medium" />
          {/* Ethereal Center */}
          <div className="aura-orb w-[500px] h-[500px] bg-emerald-900/5 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-float-fast" />
      </div>
      
      {/* Film Grain Texture */}
      <div className="noise-overlay" />

      <div className="min-h-[100dvh] flex flex-col selection:bg-amber-500 selection:text-black relative z-10">
        <header className="border-b-4 border-[#44403c] bg-[#1c1917]/90 backdrop-blur-md py-3 shadow-lg relative z-20 shrink-0">
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
            <div className="hidden md:flex gap-3 items-center">
              <div className="flex border border-stone-800 rounded-sm overflow-hidden h-7">
                <button onClick={() => refs.projectInputRef.current?.click()} className="px-3 text-[9px] fantasy-font text-stone-400 hover:text-white hover:bg-stone-800 transition-all border-r border-stone-800 uppercase tracking-widest">Import .forge</button>
                <button onClick={actions.exportProject} className="px-3 text-[9px] fantasy-font text-stone-400 hover:text-white hover:bg-stone-800 transition-all uppercase tracking-widest">Export .forge</button>
                <input ref={refs.projectInputRef} type="file" accept=".forge" onChange={actions.handleProjectImport} className="hidden" />
              </div>
              <div className="w-px h-6 bg-stone-800 mx-2" />
              <button onClick={() => setShowManifesto(true)} className="text-[9px] fantasy-font text-emerald-500 hover:text-emerald-400 uppercase tracking-widest border border-emerald-900/50 bg-emerald-950/20 px-3 py-1 rounded transition-all">🧪 Lab Manifesto</button>
              <button onClick={() => setShowUserGuide(true)} className="text-[9px] fantasy-font text-amber-600 hover:text-amber-500 uppercase tracking-widest border border-amber-900/50 bg-amber-950/20 px-3 py-1 rounded transition-all">📜 Grimoire Guide</button>
              <button onClick={() => setShowCrystalLink(true)} className="text-[9px] fantasy-font text-purple-400 hover:text-purple-300 uppercase tracking-widest border border-purple-900/50 bg-purple-950/20 px-3 py-1 rounded transition-all flex items-center gap-1"><span>💎</span> Link</button>
              <button onClick={handleSwitchKey} className="text-[9px] fantasy-font text-stone-500 hover:text-amber-500 uppercase tracking-widest border border-stone-800 px-3 py-1 rounded transition-all">Key</button>
            </div>
            <div className="md:hidden flex items-center gap-2">
               <button onClick={() => setShowUserGuide(true)} className="p-2 bg-amber-950/20 rounded border border-amber-900/50">📜</button>
               <button onClick={() => setShowCrystalLink(true)} className="p-2 bg-purple-950/20 rounded border border-purple-900/50 text-purple-400">💎</button>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 grid lg:grid-cols-12 gap-6 relative">
          {/* Sidebar / Form Column */}
          <div className="lg:col-span-4 space-y-6">
            <section className="fantasy-card p-4 relative">
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
                          {VIEW_PERSPECTIVES.map(p => (
                            <button key={p.id} type="button" onClick={() => dispatch({ type: 'SET_PERSPECTIVE', payload: p.id })} className={`flex-1 py-1.5 text-[8px] fantasy-font border rounded transition-all flex items-center justify-center gap-1 ${perspective === p.id ? 'bg-sky-600 text-black border-sky-300' : 'bg-transparent border-stone-800 text-stone-600'}`}>{p.label}</button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] fantasy-font text-stone-500 uppercase tracking-widest">Entity Essence</label>
                      <div className="grid grid-cols-5 gap-1">
                        {ASSET_CATEGORIES.map(cat => (
                          <button key={cat.id} type="button" onClick={() => dispatch({ type: 'SET_CATEGORY', payload: cat.id })} className={`py-1.5 flex flex-col items-center justify-center border rounded transition-all ${category === cat.id ? 'bg-amber-600 text-black border-amber-300' : 'bg-[#0c0a09] border-stone-800 text-stone-600'}`}>
                            <span className="text-xs">{cat.icon}</span>
                            <span className="text-[7px] font-bold mt-0.5">{cat.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    {isSpriteSheet && !['icon_set', 'vfx', 'projectile'].includes(category) && (
                      <div className="space-y-1">
                        <div className="flex justify-between items-end mb-1">
                          <label className="text-[9px] fantasy-font text-stone-500 uppercase tracking-widest">Action Atlas (Multi-Select)</label>
                          {selectedActions.length > 1 && <span className="text-[8px] font-mono text-emerald-500 uppercase">Multi-Sheet Mode</span>}
                        </div>
                        <div className="grid grid-cols-5 gap-1">
                          {ANIMATION_ACTIONS.map(act => (
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
          </div>

          {/* Main Content Column */}
          <div className="lg:col-span-8 flex flex-col gap-6">
             <div className="grid md:grid-cols-12 gap-6 flex-1 min-h-0">
                <div className="md:col-span-7 flex flex-col gap-4">
                   <div className="fantasy-card p-2 bg-[#0c0a09] relative aspect-square flex flex-col border-[#78350f] overflow-hidden">
                      <div className="flex-1 relative bg-[#020202] flex items-center justify-center overflow-hidden border border-[#292524] shadow-inner">
                         {genState === GenerationState.GENERATING ? (
                           <div className="flex flex-col items-center gap-4 text-center">
                              <div className="w-12 h-12 border-4 border-amber-950 border-t-amber-500 rounded-full animate-spin" />
                              <p className="fantasy-font text-xs text-amber-500 animate-pulse uppercase tracking-widest">Scribing to Reality...</p>
                           </div>
                         ) : genState === GenerationState.ERROR ? (
                           <div className="flex flex-col items-center gap-4 text-center px-4 max-w-xs animate-in zoom-in duration-300">
                              <div className="text-4xl">🔮💥</div>
                              <div>
                                <h3 className="fantasy-font text-red-500 uppercase tracking-widest font-bold mb-1">Ritual Failed</h3>
                                <p className="text-xs text-stone-400 font-serif leading-relaxed">{errorMessage || "Unknown anomaly encountered."}</p>
                              </div>
                           </div>
                         ) : (
                           activeArt && (
                             <SpritePreview 
                                activeArt={activeArt} 
                                settings={animationSettings} 
                                style={activeArt.style} 
                                isBatch={activeArt.type === 'batch'}
                                onUpdateArt={(updatedArt) => dispatch({ type: 'UPDATE_ART', payload: updatedArt })}
                                onUpdateSettings={(updatedSettings) => dispatch({ type: 'UPDATE_SETTINGS', payload: updatedSettings })}
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
                      <div className="flex gap-2 justify-end shrink-0">
                         <button onClick={() => dispatch({ type: 'PIN_DESIGN', payload: activeArt })} className="px-6 py-2 bg-emerald-700 text-white text-[10px] fantasy-font rounded border-b-2 border-emerald-900 uppercase hover:bg-emerald-600 transition-all">✨ Refine Design</button>
                         <button onClick={() => setShowExportModal(true)} className="px-6 py-2 bg-[#1e3a8a] text-white text-[10px] fantasy-font rounded border-b-2 border-blue-900 uppercase hover:bg-blue-800 transition-all">Export Manifest</button>
                      </div>
                   )}
                </div>
                <div className="md:col-span-5">
                   <div className="fantasy-card h-full p-5 bg-[#1c1917] border-[#44403c] overflow-y-auto max-h-[600px] custom-scrollbar">
                      <SettingsPanel 
                        settings={animationSettings} 
                        setSettings={(s) => dispatch({ type: 'UPDATE_SETTINGS', payload: s })} 
                        onGeneratePalette={actions.generatePalette} 
                      />
                   </div>
                </div>
             </div>
             
             {/* History Bar */}
             <section className="w-full shrink-0 bg-black/20 p-3 border border-stone-800/50 rounded flex gap-4 overflow-x-auto h-32 items-center custom-scrollbar pb-4 mb-4 md:mb-0 relative group/history">
                <button 
                  onClick={() => setShowGallery(true)}
                  className="absolute right-3 top-3 z-10 w-8 h-8 bg-amber-900/60 hover:bg-amber-600 border border-amber-500 text-white flex items-center justify-center rounded shadow-lg transition-all opacity-0 group-hover/history:opacity-100 scale-90 hover:scale-100"
                  title="Expand Gallery"
                >
                  ↖️
                </button>
                {history.length === 0 ? (
                  <div className="flex-1 text-center terminal-font text-stone-600 uppercase text-[10px] tracking-widest">History is empty...</div>
                ) : (
                  history.map(art => (
                    <button key={art.id} onClick={() => dispatch({ type: 'SET_ACTIVE_ART', payload: art })} className={`w-20 h-20 border-2 rounded shrink-0 overflow-hidden transition-all relative ${activeArt?.id === art.id ? 'border-amber-500 scale-95 shadow-[0_0_15px_rgba(217,119,6,0.3)]' : 'border-[#44403c] grayscale opacity-60 hover:grayscale-0 hover:opacity-100'}`}>
                        <img src={art.imageUrl} className="w-full h-full object-cover" style={{ imageRendering: 'pixelated' }} />
                        <div className="absolute top-0 right-0 p-0.5 bg-black/60 text-[6px] font-mono text-stone-400">{art.type.split('-')[0].toUpperCase()}</div>
                    </button>
                  ))
                )}
             </section>
          </div>

          {showUserGuide && <UserGuide onClose={() => setShowUserGuide(false)} />}
          {showManifesto && <UpcomingFeatures onClose={() => setShowManifesto(false)} />}
          {showCrystalLink && <CrystalLinkModal isOpen={showCrystalLink} onClose={() => setShowCrystalLink(false)} activeArt={activeArt} />}
          
          <ExportModal 
            isOpen={showExportModal}
            onClose={() => setShowExportModal(false)}
            activeArt={activeArt}
            settings={animationSettings}
            onExport={actions.exportAsset}
          />

          <GalleryModal 
            isOpen={showGallery}
            onClose={() => setShowGallery(false)}
            history={history}
            activeArtId={activeArt?.id}
            onSelect={(art) => { dispatch({ type: 'SET_ACTIVE_ART', payload: art }); setShowGallery(false); }}
            onDelete={actions.deleteArt}
          />
        </main>
        
        {/* Mobile Spacer to avoid navigation chrome */}
        <div className="h-24 md:hidden shrink-0" />
      </div>
      <ToastContainer />
    </Gatekeeper>
  );
};

const App: React.FC = () => {
  const [params, setParams] = useState(new URLSearchParams(window.location.search));
  
  useEffect(() => {
     const handlePopState = () => {
        setParams(new URLSearchParams(window.location.search));
     };
     window.addEventListener('popstate', handlePopState);
     return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const isMobileView = params.get('view') === 'mobile';
  const artId = params.get('id');

  if (isMobileView && artId) {
     return <MobileViewer artId={artId} />;
  }

  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
};

export default App;
