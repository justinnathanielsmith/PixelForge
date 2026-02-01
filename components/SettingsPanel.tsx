import React from 'react';
import { AnimationSettings } from '../types';

interface SettingsPanelProps {
  settings: AnimationSettings;
  setSettings: (newSettings: Partial<AnimationSettings>) => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ settings, setSettings }) => {
  const updateSetting = (key: keyof AnimationSettings, value: any) => {
    setSettings({ [key]: value });
  };

  const resolutions = [16, 32, 64, 128];

  return (
    <div className="space-y-6 h-full flex flex-col">
      
      {/* --- GRID LOGIC --- */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-[#44403c] pb-1">
          <h3 className="fantasy-font text-xs font-bold text-amber-600 uppercase tracking-widest">Grid Protocol</h3>
          <div className="flex gap-1.5">
             <button 
                onClick={() => updateSetting('autoTransparency', !settings.autoTransparency)} 
                className={`text-[9px] px-2 py-0.5 border fantasy-font font-bold uppercase transition-all rounded-sm shadow-sm ${settings.autoTransparency ? 'bg-emerald-900 border-emerald-500 text-emerald-100' : 'bg-[#0c0a09] border-stone-700 text-stone-600 hover:text-stone-400'}`}
                title="Toggle Transparency Rite (Magenta Chroma Key)"
             >
                Void Key
             </button>
             <button 
                onClick={() => updateSetting('tiledPreview', !settings.tiledPreview)} 
                className={`text-[9px] px-2 py-0.5 border fantasy-font font-bold uppercase transition-all rounded-sm shadow-sm ${settings.tiledPreview ? 'bg-amber-900 border-amber-600 text-amber-100' : 'bg-[#0c0a09] border-stone-700 text-stone-600 hover:text-stone-400'}`}
             >
                Seamless
             </button>
             <button 
                onClick={() => updateSetting('showGuides', !settings.showGuides)} 
                className={`text-[9px] px-2 py-0.5 border fantasy-font font-bold uppercase transition-all rounded-sm shadow-sm ${settings.showGuides ? 'bg-sky-900 border-sky-500 text-sky-100' : 'bg-[#0c0a09] border-stone-700 text-stone-600 hover:text-stone-400'}`}
             >
                Guides
             </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 bg-[#0c0a09] p-3 border border-[#292524] rounded">
          <div className="space-y-1">
            <div className="flex justify-between terminal-font text-[10px] text-stone-500">
              <span>COLS</span><span className="text-amber-500">{settings.cols}</span>
            </div>
            <input type="range" min="1" max="16" value={settings.cols} onChange={(e) => updateSetting('cols', parseInt(e.target.value))} className="accent-amber-600" />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between terminal-font text-[10px] text-stone-500">
              <span>ROWS</span><span className="text-amber-500">{settings.rows}</span>
            </div>
            <input type="range" min="1" max="16" value={settings.rows} onChange={(e) => updateSetting('rows', parseInt(e.target.value))} className="accent-amber-600" />
          </div>
        </div>
        
        {/* --- ZOOM CONTROL --- */}
        <div className="space-y-1 bg-[#0c0a09] p-3 border border-[#292524] rounded">
            <div className="flex justify-between terminal-font text-[10px] text-stone-500 uppercase tracking-tighter">
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
              className="accent-amber-600" 
            />
        </div>
      </div>

      {/* --- RESOLUTION DAC --- */}
      <div className="space-y-3">
         <h3 className="fantasy-font text-xs font-bold text-sky-500 uppercase tracking-widest border-b border-[#44403c] pb-1">Asset Resolution</h3>
         <div className="grid grid-cols-4 gap-1">
            {resolutions.map(res => (
              <button 
                key={res} 
                onClick={() => updateSetting('targetResolution', res)}
                className={`py-2 text-[9px] fantasy-font font-bold border transition-all rounded ${settings.targetResolution === res ? 'bg-sky-900 border-sky-400 text-sky-100 shadow-[0_0_10px_rgba(56,189,248,0.2)]' : 'bg-transparent border-stone-800 text-stone-600 hover:border-stone-500'}`}
              >
                {res}px
              </button>
            ))}
         </div>
      </div>

      {/* --- COLOR ALCHEMY --- */}
      <div className="space-y-3 pt-2">
         <div className="flex justify-between items-center border-b border-[#44403c] pb-1">
            <h3 className="fantasy-font text-xs font-bold text-red-500 uppercase tracking-widest">Alchemy</h3>
            <button 
                onClick={() => updateSetting('paletteLock', !settings.paletteLock)}
                className={`text-[9px] px-2 py-0.5 border fantasy-font font-bold uppercase transition-all rounded-sm ${settings.paletteLock ? 'bg-red-900 border-red-500 text-red-100 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : 'bg-[#0c0a09] border-stone-700 text-stone-600 hover:text-stone-400'}`}
            >
                {settings.paletteLock ? 'Palette Locked' : 'Unlock Colors'}
            </button>
         </div>
         <div className="space-y-3 px-1">
            <div className="space-y-1">
                <div className="flex justify-between terminal-font text-[9px] text-stone-500">
                  <span>TINT</span><span className="text-red-500">{settings.hue}°</span>
                </div>
                <input type="range" min="-180" max="180" value={settings.hue} onChange={(e) => updateSetting('hue', parseInt(e.target.value))} />
            </div>
            <div className="space-y-1">
                <div className="flex justify-between terminal-font text-[9px] text-stone-500">
                  <span>VIBRANCE</span><span className="text-red-500">{settings.saturation}%</span>
                </div>
                <input type="range" min="0" max="200" value={settings.saturation} onChange={(e) => updateSetting('saturation', parseInt(e.target.value))} />
            </div>
         </div>
      </div>

      {/* --- CLOCK CONTROL --- */}
      <div className="mt-auto pt-4 border-t border-[#44403c] space-y-2">
          <div className="flex justify-between items-end">
             <label className="fantasy-font font-bold text-[10px] text-amber-700 uppercase">Chronometry</label>
             <span className="terminal-font text-xs text-amber-500">{settings.fps} FPS</span>
          </div>
          <input type="range" min="1" max="60" value={settings.fps} onChange={(e) => updateSetting('fps', parseInt(e.target.value))} className="w-full accent-amber-600" />
          <button
              onClick={() => updateSetting('isPlaying', !settings.isPlaying)}
              className={`w-full mt-2 py-3 fantasy-font font-bold text-xs border-2 transition-all shadow-md uppercase rounded ${
              settings.isPlaying ? 'bg-red-950/80 border-red-800 text-red-200' : 'bg-emerald-950/80 border-emerald-800 text-emerald-200'
              }`}
          >
              {settings.isPlaying ? '❚❚ Freeze Rite' : '► Channel Flow'}
          </button>
      </div>
    </div>
  );
};

export default SettingsPanel;
