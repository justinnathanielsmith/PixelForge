
import React, { useState } from 'react';
import { AnimationSettings } from '../../domain/entities';
import { RESOLUTION_PRESETS } from '../../domain/constants';

interface SettingsPanelProps {
  settings: AnimationSettings;
  setSettings: (newSettings: Partial<AnimationSettings>) => void;
  onGeneratePalette: (prompt: string) => Promise<void>;
}

const CodexSection = ({ title, icon, children, isOpen = false }: { title: string, icon: string, children: React.ReactNode, isOpen?: boolean }) => (
  <details className="group border border-[#292524] bg-[#0c0a09] rounded overflow-hidden mb-2" open={isOpen}>
    <summary className="flex items-center justify-between p-3 cursor-pointer hover:bg-[#1c1917] transition-colors select-none list-none outline-none">
       <div className="flex items-center gap-2">
          <span className="text-lg opacity-60 group-hover:opacity-100 transition-opacity">{icon}</span>
          <span className="fantasy-font text-[10px] font-bold text-stone-400 group-hover:text-amber-500 uppercase tracking-widest transition-colors">{title}</span>
       </div>
       <span className="text-[10px] text-stone-600 group-open:text-amber-600 group-open:rotate-180 transition-all duration-300">▼</span>
    </summary>
    <div className="p-3 border-t border-[#292524] bg-[#080706] space-y-4 animate-in slide-in-from-top-1 duration-200">
       {children}
    </div>
  </details>
);

const SettingsPanel: React.FC<SettingsPanelProps> = ({ settings, setSettings, onGeneratePalette }) => {
  const [palettePrompt, setPalettePrompt] = useState('');
  const [isGeneratingPalette, setIsGeneratingPalette] = useState(false);

  const updateSetting = (key: keyof AnimationSettings, value: any) => {
    setSettings({ [key]: value });
  };

  const handleGeneratePalette = async () => {
    if (!palettePrompt.trim()) return;
    setIsGeneratingPalette(true);
    await onGeneratePalette(palettePrompt);
    setIsGeneratingPalette(false);
  };

  const handleClearPalette = () => {
    setSettings({ customPalette: null });
  };

  return (
    <div className="h-full flex flex-col pr-1">
      <div className="mb-4 px-1">
        <h2 className="fantasy-font text-sm text-stone-500 uppercase tracking-widest border-b border-[#292524] pb-2 mb-1">Arcane Codex</h2>
        <p className="text-[9px] text-stone-600 italic">Configure the laws of the generated reality.</p>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-1">
        
        {/* --- DIMENSIONS --- */}
        <CodexSection title="Dimensions & Resolution" icon="📐" isOpen={true}>
            <div className="space-y-3">
                {/* Resolution Presets */}
                <div className="space-y-1">
                    <label className="terminal-font text-[9px] text-stone-500 uppercase">Target Resolution (Height)</label>
                    <div className="grid grid-cols-4 gap-1">
                        {RESOLUTION_PRESETS.map(res => (
                        <button 
                            key={res} 
                            onClick={() => updateSetting('targetResolution', res)}
                            className={`py-1.5 text-[9px] fantasy-font font-bold border transition-all rounded ${settings.targetResolution === res ? 'bg-sky-900 border-sky-400 text-sky-100 shadow-[0_0_10px_rgba(56,189,248,0.2)]' : 'bg-transparent border-stone-800 text-stone-600 hover:border-stone-500'}`}
                        >
                            {res}px
                        </button>
                        ))}
                    </div>
                </div>

                {/* Aspect Ratio */}
                <div className="space-y-1">
                    <label className="terminal-font text-[9px] text-stone-500 uppercase">Canvas Ratio</label>
                    <div className="grid grid-cols-5 gap-1">
                        {['1:1', '16:9', '9:16', '4:3', '3:4'].map(ratio => (
                            <button 
                                key={ratio}
                                onClick={() => updateSetting('aspectRatio', ratio)}
                                className={`py-1 text-[8px] fantasy-font font-bold border rounded transition-all ${settings.aspectRatio === ratio ? 'bg-sky-700 text-white border-sky-400' : 'bg-[#0c0a09] border-stone-800 text-stone-500 hover:text-stone-300'}`}
                            >
                                {ratio}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Zoom */}
                <div className="space-y-1 bg-black/20 p-2 rounded border border-stone-800">
                    <div className="flex justify-between terminal-font text-[9px] text-stone-500 uppercase tracking-tighter">
                    <span>Vision Scale</span>
                    <span className="text-amber-500">{settings.zoom.toFixed(2)}x</span>
                    </div>
                    <input 
                    type="range" 
                    min="0.25" 
                    max="4" 
                    step="0.05" 
                    value={settings.zoom} 
                    onChange={(e) => updateSetting('zoom', parseFloat(e.target.value))} 
                    className="accent-amber-600 w-full" 
                    />
                </div>

                {/* Cols/Rows (Conditional) */}
                {!settings.batchMode && (
                    <div className="grid grid-cols-2 gap-2 bg-black/20 p-2 rounded border border-stone-800">
                        <div className="space-y-1">
                            <div className="flex justify-between terminal-font text-[9px] text-stone-500">
                            <span>COLS</span><span className="text-amber-500">{settings.cols}</span>
                            </div>
                            <input type="range" min="1" max="16" value={settings.cols} onChange={(e) => updateSetting('cols', parseInt(e.target.value))} className="accent-amber-600 w-full" />
                        </div>
                        <div className="space-y-1">
                            <div className="flex justify-between terminal-font text-[9px] text-stone-500">
                            <span>ROWS</span><span className="text-amber-500">{settings.rows}</span>
                            </div>
                            <input type="range" min="1" max="16" value={settings.rows} onChange={(e) => updateSetting('rows', parseInt(e.target.value))} className="accent-amber-600 w-full" />
                        </div>
                    </div>
                )}
            </div>
        </CodexSection>

        {/* --- CHRONOMETRY --- */}
        <CodexSection title="Chronometry" icon="⏳" isOpen={true}>
            <div className="space-y-3">
                <div className="flex justify-between items-end">
                    <label className="terminal-font text-[9px] text-stone-500 uppercase">Frame Rate</label>
                    <span className="terminal-font text-xs text-amber-500">{settings.fps} FPS</span>
                </div>
                <input type="range" min="1" max="60" value={settings.fps} onChange={(e) => updateSetting('fps', parseInt(e.target.value))} className="w-full accent-amber-600" />
                
                <button
                    onClick={() => updateSetting('isPlaying', !settings.isPlaying)}
                    className={`w-full py-2 fantasy-font font-bold text-[10px] border transition-all shadow-md uppercase rounded flex items-center justify-center gap-2 ${
                    settings.isPlaying ? 'bg-red-950/40 border-red-800 text-red-200 hover:bg-red-900/60' : 'bg-emerald-950/40 border-emerald-800 text-emerald-200 hover:bg-emerald-900/60'
                    }`}
                >
                    {settings.isPlaying ? <span>❚❚ Freeze Rite</span> : <span>► Channel Flow</span>}
                </button>
            </div>
        </CodexSection>

        {/* --- GRID PROTOCOL --- */}
        <CodexSection title="Grid Protocol" icon="🕸️">
             <div className="grid grid-cols-2 gap-2">
                 {/* Vector Rite */}
                <button 
                    onClick={() => updateSetting('vectorRite', !settings.vectorRite)} 
                    className={`text-[9px] px-2 py-2 border fantasy-font font-bold uppercase transition-all rounded-sm flex items-center justify-center gap-1 ${settings.vectorRite ? 'bg-sky-900/40 border-sky-500 text-sky-200' : 'bg-black/40 border-stone-800 text-stone-600 hover:text-stone-400'}`}
                    title="Geometric Silhouette Sharpening"
                >
                    Vector Rite
                </button>
                {/* Consistency */}
                <button 
                    onClick={() => updateSetting('temporalStability', !settings.temporalStability)} 
                    className={`text-[9px] px-2 py-2 border fantasy-font font-bold uppercase transition-all rounded-sm flex items-center justify-center gap-1 ${settings.temporalStability ? 'bg-amber-900/40 border-amber-500 text-amber-200' : 'bg-black/40 border-stone-800 text-stone-600 hover:text-stone-400'}`}
                    title="Strict Temporal Anchoring"
                >
                    Consistency
                </button>
                {/* Breeding */}
                <button 
                    onClick={() => updateSetting('batchMode', !settings.batchMode)} 
                    className={`text-[9px] px-2 py-2 border fantasy-font font-bold uppercase transition-all rounded-sm flex items-center justify-center gap-1 ${settings.batchMode ? 'bg-amber-900/40 border-amber-500 text-amber-200' : 'bg-black/40 border-stone-800 text-stone-600 hover:text-stone-400'}`}
                    title="Generate 4 Variations"
                >
                    Breeding
                </button>
                {/* Seamless */}
                <button 
                    onClick={() => updateSetting('tiledPreview', !settings.tiledPreview)} 
                    className={`text-[9px] px-2 py-2 border fantasy-font font-bold uppercase transition-all rounded-sm ${settings.tiledPreview ? 'bg-stone-700 border-stone-400 text-white' : 'bg-black/40 border-stone-800 text-stone-600 hover:text-stone-400'}`}
                >
                    Seamless
                </button>
                {/* Guides */}
                <button 
                    onClick={() => updateSetting('showGuides', !settings.showGuides)} 
                    className={`col-span-2 text-[9px] px-2 py-1.5 border fantasy-font font-bold uppercase transition-all rounded-sm ${settings.showGuides ? 'bg-stone-700 border-stone-400 text-white' : 'bg-black/40 border-stone-800 text-stone-600 hover:text-stone-400'}`}
                >
                    Show Grid Guides
                </button>
            </div>

            {settings.batchMode && (
                <div className="bg-amber-950/20 border border-amber-900/40 p-2 rounded text-center space-y-1">
                    <p className="fantasy-font text-[9px] text-amber-500 uppercase tracking-widest">Breeding Rite Active</p>
                    <p className="terminal-font text-[9px] text-stone-500 italic leading-tight">Generates 4 variations in a 2x2 grid.</p>
                </div>
            )}
        </CodexSection>

        {/* --- ALCHEMY --- */}
        <CodexSection title="Alchemy & Essence" icon="⚗️">
            
            {/* Transparency Control */}
             <div className="space-y-2 mb-3 pb-3 border-b border-stone-800">
                <div className="flex justify-between items-center">
                    <span className="fantasy-font text-[9px] text-emerald-600 font-bold uppercase">Void Key (Transparency)</span>
                    <button 
                        onClick={() => updateSetting('autoTransparency', !settings.autoTransparency)} 
                        className={`w-8 h-4 rounded-full border relative transition-colors ${settings.autoTransparency ? 'bg-emerald-900 border-emerald-500' : 'bg-stone-900 border-stone-700'}`}
                    >
                        <div className={`absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white transition-all ${settings.autoTransparency ? 'left-4' : 'left-0.5'}`} />
                    </button>
                </div>
                {settings.autoTransparency && (
                    <div className="space-y-1">
                         <div className="flex justify-between terminal-font text-[9px] text-stone-500">
                            <span>Tolerance</span><span>{settings.chromaTolerance}%</span>
                         </div>
                         <input 
                            type="range" 
                            min="0" 
                            max="50" 
                            step="1" 
                            value={settings.chromaTolerance} 
                            onChange={(e) => updateSetting('chromaTolerance', parseInt(e.target.value))} 
                            className="accent-emerald-600 w-full" 
                        />
                    </div>
                )}
             </div>

             {/* Palette Control */}
             <div className="space-y-3">
                 <div className="flex justify-between items-center">
                    <h4 className="text-[9px] fantasy-font text-red-400 uppercase">Neural Color Ramps</h4>
                    <button 
                        onClick={() => updateSetting('paletteLock', !settings.paletteLock)}
                        className={`text-[8px] px-1.5 py-0.5 border fantasy-font font-bold uppercase transition-all rounded-sm ${settings.paletteLock ? 'bg-red-900/40 border-red-500 text-red-200' : 'bg-transparent border-stone-800 text-stone-600'}`}
                    >
                        {settings.paletteLock ? 'LOCKED' : 'UNLOCKED'}
                    </button>
                 </div>
                 
                 <div className="flex gap-1">
                    <input 
                        type="text" 
                        value={palettePrompt} 
                        onChange={(e) => setPalettePrompt(e.target.value)} 
                        placeholder='e.g. "Toxic Slime"'
                        className="flex-1 bg-black/50 border border-stone-700 text-[10px] p-1 text-stone-300 focus:border-red-500 outline-none fantasy-input"
                    />
                    <button 
                        onClick={handleGeneratePalette} 
                        disabled={isGeneratingPalette || !palettePrompt.trim()}
                        className="px-2 bg-red-900/20 border border-red-800 text-red-400 text-[10px] hover:bg-red-900/40 uppercase font-bold disabled:opacity-50"
                    >
                        Synthesize
                    </button>
                </div>
                
                {settings.customPalette && (
                    <div className="space-y-2 pt-1">
                        <div className="flex flex-wrap gap-0.5">
                        {settings.customPalette.map((c, i) => (
                            <div 
                            key={i} 
                            className="w-4 h-4 rounded-sm border border-black/20" 
                            style={{ backgroundColor: `rgb(${c.r}, ${c.g}, ${c.b})` }} 
                            title={`rgb(${c.r}, ${c.g}, ${c.b})`}
                            />
                        ))}
                        </div>
                        <button onClick={handleClearPalette} className="text-[8px] text-red-500 hover:text-red-300 uppercase w-full text-right">Clear Ramp</button>
                    </div>
                )}
             </div>

             {/* HSL Adjustments */}
             <div className="space-y-2 pt-2 border-t border-stone-800">
                <div className="space-y-1">
                    <div className="flex justify-between terminal-font text-[9px] text-stone-500">
                    <span>TINT SHIFT</span><span className="text-red-500">{settings.hue}°</span>
                    </div>
                    <input type="range" min="-180" max="180" value={settings.hue} onChange={(e) => updateSetting('hue', parseInt(e.target.value))} className="accent-red-600 w-full" />
                </div>
                <div className="space-y-1">
                    <div className="flex justify-between terminal-font text-[9px] text-stone-500">
                    <span>VIBRANCE</span><span className="text-red-500">{settings.saturation}%</span>
                    </div>
                    <input type="range" min="0" max="200" value={settings.saturation} onChange={(e) => updateSetting('saturation', parseInt(e.target.value))} className="accent-red-600 w-full" />
                </div>
             </div>

        </CodexSection>

      </div>
    </div>
  );
};

export default SettingsPanel;
