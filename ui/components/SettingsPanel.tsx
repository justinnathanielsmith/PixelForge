
import React, { useState, memo, useId } from 'react';
import { AnimationSettings } from '../../domain/entities';
import { RESOLUTION_PRESETS } from '../../domain/constants';
import { useToast } from '../context/ToastContext';

// --- Shared Types ---
interface SettingsSectionProps {
  settings: AnimationSettings;
  setSettings: (newSettings: Partial<AnimationSettings>) => void;
}

interface AlchemySectionProps extends SettingsSectionProps {
  onGeneratePalette: (prompt: string) => Promise<void>;
}

// --- Shared UI Component ---
const CodexSection = ({ title, icon, children, defaultOpen = false, className = "" }: { title: string, icon: string, children: React.ReactNode, defaultOpen?: boolean, className?: string }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const sectionId = useId();

  return (
    <div className={`group border border-[#292524] bg-[#0c0a09] rounded overflow-hidden transition-all duration-200 hover:border-[#57534e] ${className}`}>
        <button 
            type="button"
            aria-expanded={isOpen}
            aria-controls={sectionId}
            className="w-full flex items-center justify-between p-3 cursor-pointer hover:bg-[#1c1917] active:bg-[#292524] transition-colors select-none outline-none text-left"
            onClick={() => setIsOpen(!isOpen)}
        >
       <div className="flex items-center gap-3">
          <span className="text-lg opacity-50 group-hover:opacity-100 transition-all duration-300 grayscale group-hover:grayscale-0">{icon}</span>
          <span className="fantasy-font text-[10px] font-bold text-stone-400 group-hover:text-amber-500 uppercase tracking-widest transition-colors">{title}</span>
       </div>
       <div className={`w-5 h-5 flex items-center justify-center rounded-full border border-transparent group-hover:border-stone-800 transition-all duration-300 ${isOpen ? 'rotate-180 bg-stone-900' : ''}`}>
          <span className={`text-[8px] text-stone-600 transition-colors ${isOpen ? 'text-amber-600' : ''}`}>▼</span>
       </div>
    </button>
    {isOpen && (
      <div id={sectionId} className="p-3 border-t border-[#292524] bg-[#080706] space-y-4 animate-in slide-in-from-top-1 duration-200">
        {children}
      </div>
    )}
  </div>
  );
};

// --- Exported Components ---

export const CodexDimensions = memo(({ settings, setSettings }: SettingsSectionProps) => {
  const updateSetting = (key: keyof AnimationSettings, value: any) => setSettings({ [key]: value });

  return (
    <CodexSection title="Dimensions & Resolution" icon="📐" defaultOpen={true}>
      <div className="space-y-4">
          <div className="space-y-1.5">
              <label id="resolution-label" className="terminal-font text-[9px] text-stone-500 uppercase flex items-center gap-2">
                  Target Resolution <span className="text-[8px] text-stone-600">(Height)</span>
              </label>
              <div role="group" aria-labelledby="resolution-label" className="grid grid-cols-4 gap-1.5">
                  {RESOLUTION_PRESETS.map(res => (
                  <button 
                      key={res} 
                      onClick={() => updateSetting('targetResolution', res)}
                      aria-pressed={settings.targetResolution === res}
                      className={`py-2 text-[9px] fantasy-font font-bold border transition-all rounded shadow-sm hover:shadow-md ${settings.targetResolution === res ? 'bg-sky-950/80 border-sky-500 text-sky-100 shadow-[0_0_8px_rgba(14,165,233,0.3)]' : 'bg-[#1c1917] border-stone-800 text-stone-500 hover:border-stone-600 hover:text-stone-300'}`}
                  >
                      {res}px
                  </button>
                  ))}
              </div>
          </div>

          <div className="space-y-1.5">
              <label id="ratio-label" className="terminal-font text-[9px] text-stone-500 uppercase">Canvas Ratio</label>
              <div role="group" aria-labelledby="ratio-label" className="grid grid-cols-5 gap-1">
                  {['1:1', '16:9', '9:16', '4:3', '3:4'].map(ratio => (
                      <button 
                          key={ratio}
                          onClick={() => updateSetting('aspectRatio', ratio)}
                          aria-pressed={settings.aspectRatio === ratio}
                          className={`py-1.5 text-[8px] fantasy-font font-bold border rounded transition-all ${settings.aspectRatio === ratio ? 'bg-sky-900 text-white border-sky-500' : 'bg-[#0c0a09] border-stone-800 text-stone-500 hover:text-stone-300 hover:border-stone-600'}`}
                      >
                          {ratio}
                      </button>
                  ))}
              </div>
          </div>

          <div className="space-y-1 bg-black/40 p-3 rounded border border-stone-800 hover:border-stone-700 transition-colors">
              <div className="flex justify-between terminal-font text-[9px] text-stone-500 uppercase tracking-tighter mb-1">
                  <span>Vision Scale</span>
                  <span className="text-amber-500 font-bold">{settings.zoom.toFixed(2)}x</span>
              </div>
              <input 
                  type="range" 
                  min="0.25" 
                  max="4" 
                  step="0.05" 
                  value={settings.zoom} 
                  onChange={(e) => updateSetting('zoom', parseFloat(e.target.value))} 
                  className="accent-amber-600 w-full cursor-pointer" 
                  aria-label="Vision Scale"
              />
          </div>

          {!settings.batchMode && (
              <div className="grid grid-cols-2 gap-2 bg-black/40 p-3 rounded border border-stone-800 hover:border-stone-700 transition-colors">
                  <div className="space-y-1">
                      <div className="flex justify-between terminal-font text-[9px] text-stone-500">
                          <span>COLS</span><span className="text-amber-500 font-bold">{settings.cols}</span>
                      </div>
                      <input type="range" min="1" max="16" value={settings.cols} onChange={(e) => updateSetting('cols', parseInt(e.target.value))} className="accent-amber-600 w-full cursor-pointer" aria-label="Grid Columns" />
                  </div>
                  <div className="space-y-1">
                      <div className="flex justify-between terminal-font text-[9px] text-stone-500">
                          <span>ROWS</span><span className="text-amber-500 font-bold">{settings.rows}</span>
                      </div>
                      <input type="range" min="1" max="16" value={settings.rows} onChange={(e) => updateSetting('rows', parseInt(e.target.value))} className="accent-amber-600 w-full cursor-pointer" aria-label="Grid Rows" />
                  </div>
              </div>
          )}
      </div>
    </CodexSection>
  );
}, (prev, next) => {
  // Only re-render if used settings change. Future settings added to this component must be added here.
  return (
    prev.setSettings === next.setSettings &&
    prev.settings.targetResolution === next.settings.targetResolution &&
    prev.settings.aspectRatio === next.settings.aspectRatio &&
    prev.settings.zoom === next.settings.zoom &&
    prev.settings.batchMode === next.settings.batchMode &&
    prev.settings.cols === next.settings.cols &&
    prev.settings.rows === next.settings.rows
  );
});

export const CodexChronometry = memo(({ settings, setSettings }: SettingsSectionProps) => {
  const updateSetting = (key: keyof AnimationSettings, value: any) => setSettings({ [key]: value });

  return (
    <CodexSection title="Chronometry" icon="⏳" defaultOpen={true}>
      <div className="space-y-4">
          <div className="space-y-1">
              <div className="flex justify-between items-end mb-1">
                  <label className="terminal-font text-[9px] text-stone-500 uppercase">Frame Rate</label>
                  <span className="terminal-font text-xs text-amber-500 font-bold">{settings.fps} FPS</span>
              </div>
              <input type="range" min="1" max="60" value={settings.fps} onChange={(e) => updateSetting('fps', parseInt(e.target.value))} className="w-full accent-amber-600 cursor-pointer" aria-label="Frame Rate" />
          </div>
          
          <button
              onClick={() => updateSetting('isPlaying', !settings.isPlaying)}
              className={`w-full py-3 fantasy-font font-bold text-[10px] border transition-all shadow-md uppercase rounded flex items-center justify-center gap-2 group ${
              settings.isPlaying ? 'bg-red-950/40 border-red-800 text-red-200 hover:bg-red-900/60 hover:border-red-500' : 'bg-emerald-950/40 border-emerald-800 text-emerald-200 hover:bg-emerald-900/60 hover:border-emerald-500'
              }`}
          >
              {settings.isPlaying ? <span className="group-hover:scale-110 transition-transform">❚❚</span> : <span className="group-hover:scale-110 transition-transform">►</span>}
              {settings.isPlaying ? 'Freeze Rite' : 'Channel Flow'}
          </button>
      </div>
    </CodexSection>
  );
}, (prev, next) => {
  // Only re-render if used settings change. Future settings added to this component must be added here.
  return (
    prev.setSettings === next.setSettings &&
    prev.settings.fps === next.settings.fps &&
    prev.settings.isPlaying === next.settings.isPlaying
  );
});

export const CodexGrid = memo(({ settings, setSettings }: SettingsSectionProps) => {
  const updateSetting = (key: keyof AnimationSettings, value: any) => setSettings({ [key]: value });

  return (
    <CodexSection title="Grid Protocol" icon="🕸️" defaultOpen={true}>
       <div className="grid grid-cols-2 gap-2">
          <button 
              onClick={() => updateSetting('vectorRite', !settings.vectorRite)}
              aria-pressed={settings.vectorRite}
              className={`text-[9px] px-2 py-3 border fantasy-font font-bold uppercase transition-all rounded-sm flex items-center justify-center gap-1 hover:brightness-110 ${settings.vectorRite ? 'bg-sky-900/40 border-sky-500 text-sky-200 shadow-[inset_0_0_10px_rgba(14,165,233,0.2)]' : 'bg-black/40 border-stone-800 text-stone-600 hover:text-stone-400 hover:border-stone-600'}`}
              title="Geometric Silhouette Sharpening"
          >
              Vector Rite
          </button>
          <button 
              onClick={() => updateSetting('temporalStability', !settings.temporalStability)}
              aria-pressed={settings.temporalStability}
              className={`text-[9px] px-2 py-3 border fantasy-font font-bold uppercase transition-all rounded-sm flex items-center justify-center gap-1 hover:brightness-110 ${settings.temporalStability ? 'bg-amber-900/40 border-amber-500 text-amber-200 shadow-[inset_0_0_10px_rgba(217,119,6,0.2)]' : 'bg-black/40 border-stone-800 text-stone-600 hover:text-stone-400 hover:border-stone-600'}`}
              title="Strict Temporal Anchoring"
          >
              Consistency
          </button>
          <button 
              onClick={() => updateSetting('batchMode', !settings.batchMode)}
              aria-pressed={settings.batchMode}
              className={`text-[9px] px-2 py-3 border fantasy-font font-bold uppercase transition-all rounded-sm flex items-center justify-center gap-1 hover:brightness-110 ${settings.batchMode ? 'bg-purple-900/40 border-purple-500 text-purple-200 shadow-[inset_0_0_10px_rgba(168,85,247,0.2)]' : 'bg-black/40 border-stone-800 text-stone-600 hover:text-stone-400 hover:border-stone-600'}`}
              title="Generate 4 Variations"
          >
              Breeding
          </button>
          <button 
              onClick={() => updateSetting('tiledPreview', !settings.tiledPreview)}
              aria-pressed={settings.tiledPreview}
              className={`text-[9px] px-2 py-3 border fantasy-font font-bold uppercase transition-all rounded-sm hover:brightness-110 ${settings.tiledPreview ? 'bg-stone-700 border-stone-400 text-white shadow-md' : 'bg-black/40 border-stone-800 text-stone-600 hover:text-stone-400 hover:border-stone-600'}`}
          >
              Seamless
          </button>
          <button 
              onClick={() => updateSetting('showGuides', !settings.showGuides)}
              aria-pressed={settings.showGuides}
              className={`col-span-2 text-[9px] px-2 py-2 border fantasy-font font-bold uppercase transition-all rounded-sm hover:brightness-110 ${settings.showGuides ? 'bg-stone-700 border-stone-400 text-white' : 'bg-black/40 border-stone-800 text-stone-600 hover:text-stone-400 hover:border-stone-600'}`}
          >
              Show Grid Guides
          </button>
      </div>

      {settings.batchMode && (
          <div className="bg-purple-950/20 border border-purple-900/40 p-3 rounded text-center space-y-1 animate-in zoom-in-95 duration-300">
              <p className="fantasy-font text-[9px] text-purple-400 uppercase tracking-widest font-bold">Breeding Rite Active</p>
              <p className="terminal-font text-[9px] text-stone-500 italic leading-tight">Generates 4 variations in a 2x2 grid.</p>
          </div>
      )}
    </CodexSection>
  );
}, (prev, next) => {
  // Only re-render if used settings change. Future settings added to this component must be added here.
  return (
    prev.setSettings === next.setSettings &&
    prev.settings.vectorRite === next.settings.vectorRite &&
    prev.settings.temporalStability === next.settings.temporalStability &&
    prev.settings.batchMode === next.settings.batchMode &&
    prev.settings.tiledPreview === next.settings.tiledPreview &&
    prev.settings.showGuides === next.settings.showGuides
  );
});

export const CodexAlchemy = memo(({ settings, setSettings, onGeneratePalette }: AlchemySectionProps) => {
  const [palettePrompt, setPalettePrompt] = useState('');
  const [isGeneratingPalette, setIsGeneratingPalette] = useState(false);
  const { whisper } = useToast();

  const updateSetting = (key: keyof AnimationSettings, value: any) => setSettings({ [key]: value });

  const handleGeneratePalette = async () => {
    if (!palettePrompt.trim()) return;
    setIsGeneratingPalette(true);
    await onGeneratePalette(palettePrompt);
    setIsGeneratingPalette(false);
  };

  const handleClearPalette = () => {
    setSettings({ customPalette: null });
    whisper("Palette Purged", "Custom colors returned to the void.", "info");
  };

  return (
    <CodexSection title="Alchemy & Essence" icon="⚗️" defaultOpen={true}>
       <div className="space-y-2 mb-3 pb-3 border-b border-stone-800/50">
          <button
              type="button"
              aria-pressed={settings.autoTransparency}
              aria-label="Toggle Transparency"
              className="w-full flex justify-between items-center group cursor-pointer bg-transparent border-none p-0 focus:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500 rounded-sm"
              onClick={() => updateSetting('autoTransparency', !settings.autoTransparency)}
          >
              <span className="fantasy-font text-[9px] text-emerald-600 font-bold uppercase group-hover:text-emerald-500 transition-colors">Void Key (Transparency)</span>
              <div 
                  className={`w-8 h-4 rounded-full border relative transition-colors duration-300 ${settings.autoTransparency ? 'bg-emerald-900 border-emerald-500' : 'bg-stone-900 border-stone-700'}`}
              >
                  <div className={`absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white transition-all duration-300 shadow-sm ${settings.autoTransparency ? 'left-4' : 'left-0.5'}`} />
              </div>
          </button>
          {settings.autoTransparency && (
              <div className="space-y-1 pl-2 border-l-2 border-emerald-900/30">
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
                      className="accent-emerald-600 w-full cursor-pointer" 
                      aria-label="Transparency Tolerance"
                  />
              </div>
          )}
       </div>

       <div className="space-y-3">
           <div className="flex justify-between items-center">
              <h4 className="text-[9px] fantasy-font text-red-400 uppercase font-bold">Neural Color Ramps</h4>
              <button 
                  onClick={() => updateSetting('paletteLock', !settings.paletteLock)}
                  aria-pressed={settings.paletteLock}
                  className={`text-[8px] px-2 py-0.5 border fantasy-font font-bold uppercase transition-all rounded-full ${settings.paletteLock ? 'bg-red-900/40 border-red-500 text-red-200 shadow-[0_0_8px_rgba(239,68,68,0.3)]' : 'bg-transparent border-stone-800 text-stone-600 hover:border-stone-600'}`}
              >
                  {settings.paletteLock ? 'LOCKED' : 'UNLOCKED'}
              </button>
           </div>
           
           <div className="flex gap-1.5">
              <input 
                  type="text" 
                  value={palettePrompt} 
                  onChange={(e) => setPalettePrompt(e.target.value)} 
                  placeholder='e.g. "Toxic Slime"'
                  className="flex-1 bg-black/50 border border-stone-700 text-[10px] p-2 text-stone-300 focus:border-red-500 focus:bg-black outline-none fantasy-input rounded-sm transition-colors"
                  aria-label="Palette Prompt"
              />
              <button 
                  onClick={handleGeneratePalette} 
                  disabled={isGeneratingPalette || !palettePrompt.trim()}
                  className="px-3 bg-red-900/20 border border-red-800 text-red-400 text-[10px] hover:bg-red-900/40 hover:text-red-200 uppercase font-bold disabled:opacity-50 transition-all rounded-sm"
              >
                  Synthesize
              </button>
          </div>
          
          {settings.customPalette && (
              <div className="space-y-2 pt-1 animate-in fade-in duration-300">
                  <div className="flex flex-wrap gap-1 p-2 bg-black/20 rounded border border-stone-800/50">
                  {settings.customPalette.map((c, i) => (
                      <div 
                      key={i} 
                      role="img"
                      aria-label={`Color swatch: rgb(${c.r}, ${c.g}, ${c.b})`}
                      className="w-4 h-4 rounded-full border border-black/50 shadow-sm hover:scale-125 transition-transform" 
                      style={{ backgroundColor: `rgb(${c.r}, ${c.g}, ${c.b})` }} 
                      title={`rgb(${c.r}, ${c.g}, ${c.b})`}
                      />
                  ))}
                  </div>
                  <button onClick={handleClearPalette} className="text-[8px] text-red-500 hover:text-red-300 uppercase w-full text-right hover:underline">Clear Ramp</button>
              </div>
          )}
       </div>

       <div className="space-y-3 pt-3 border-t border-stone-800/50">
          <div className="space-y-1">
              <div className="flex justify-between terminal-font text-[9px] text-stone-500">
              <span>TINT SHIFT</span><span className="text-red-500 font-bold">{settings.hue}°</span>
              </div>
              <input type="range" min="-180" max="180" value={settings.hue} onChange={(e) => updateSetting('hue', parseInt(e.target.value))} className="accent-red-600 w-full cursor-pointer" aria-label="Tint Shift" />
          </div>
          <div className="space-y-1">
              <div className="flex justify-between terminal-font text-[9px] text-stone-500">
              <span>VIBRANCE</span><span className="text-red-500 font-bold">{settings.saturation}%</span>
              </div>
              <input type="range" min="0" max="200" value={settings.saturation} onChange={(e) => updateSetting('saturation', parseInt(e.target.value))} className="accent-red-600 w-full cursor-pointer" aria-label="Vibrance" />
          </div>
       </div>
    </CodexSection>
  );
}, (prev, next) => {
  // Only re-render if used settings change. Future settings added to this component must be added here.
  return (
    prev.setSettings === next.setSettings &&
    prev.onGeneratePalette === next.onGeneratePalette &&
    prev.settings.autoTransparency === next.settings.autoTransparency &&
    prev.settings.chromaTolerance === next.settings.chromaTolerance &&
    prev.settings.paletteLock === next.settings.paletteLock &&
    prev.settings.customPalette === next.settings.customPalette &&
    prev.settings.hue === next.settings.hue &&
    prev.settings.saturation === next.settings.saturation
  );
});

// Legacy Default Export (optional wrapper, mostly unused in new layout)
const SettingsPanel: React.FC<AlchemySectionProps> = (props) => {
  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="mb-4 px-1 shrink-0">
        <h2 className="fantasy-font text-sm text-stone-500 uppercase tracking-widest border-b border-[#292524] pb-2 mb-1 flex items-center gap-2">
            <span>⚙️</span> Arcane Codex
        </h2>
        <p className="text-[9px] text-stone-600 italic">Configure the laws of the generated reality.</p>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-1 min-h-0 pb-6">
        <CodexDimensions {...props} />
        <CodexChronometry {...props} />
        <CodexGrid {...props} />
        <CodexAlchemy {...props} />
      </div>
    </div>
  );
};

export default SettingsPanel;
