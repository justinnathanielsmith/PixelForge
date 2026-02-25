
import React from 'react';
import { useEscapeKey } from '../hooks/useEscapeKey';

interface UserGuideProps {
  onClose: () => void;
}

const UserGuide: React.FC<UserGuideProps> = ({ onClose }) => {
  useEscapeKey(onClose);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-3xl fantasy-card bg-[#1c1917] flex flex-col shadow-2xl border-amber-900/50 max-h-[90vh] relative">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#44403c] bg-[#0c0a09]">
           <div className="flex items-center gap-3">
             <span className="text-2xl">📜</span>
             <div>
               <h2 className="fantasy-font text-lg text-amber-500 uppercase tracking-widest leading-none">The Arcane Grimoire</h2>
               <span className="text-[10px] text-stone-500 font-mono">v1.3.0-stable • Gemini 3 Pro Vision</span>
             </div>
           </div>
           <button onClick={onClose} aria-label="Close Grimoire" className="text-stone-500 hover:text-red-400 text-2xl leading-none transition-colors">×</button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 font-serif text-stone-300 custom-scrollbar">
          
          {/* Introduction */}
          <section className="space-y-2">
            <h3 className="fantasy-font text-xl text-amber-600 border-b border-stone-800 pb-2 mb-4">🌟 Introduction</h3>
            <p className="leading-relaxed text-sm">
              <strong className="text-amber-500">PixelForge</strong> is a professional-grade pixel art generator designed for indie game developers. It bridges the gap between text prompts and game-ready assets, offering sprite sheets, normal maps, auto-rigging, and engine-ready exports.
            </p>
          </section>

          {/* Phase 1 */}
          <section className="space-y-4">
            <h3 className="fantasy-font text-xl text-amber-600 border-b border-stone-800 pb-2">🔑 Phase 1: Initiation</h3>
            <div className="bg-black/20 p-4 rounded border border-stone-800 space-y-2">
               <h4 className="fantasy-font text-sm text-stone-400 uppercase">The Authorization Ritual</h4>
               <ul className="list-disc list-inside space-y-1 text-sm text-stone-400 ml-2">
                 <li><strong className="text-stone-300">API Key Selection:</strong> You must select a Google Cloud Project with a billing-enabled API Key.</li>
                 <li><strong className="text-stone-300">Model Access:</strong> This authorizes the app to use <span className="text-sky-400">Gemini 3 Pro</span>, the high-fidelity vision model required for pixel-perfect generation.</li>
                 <li><strong className="text-stone-300">Security:</strong> Your key is handled securely via the AI Studio standard flow.</li>
               </ul>
            </div>
          </section>

          {/* Phase 2 */}
          <section className="space-y-4">
            <h3 className="fantasy-font text-xl text-amber-600 border-b border-stone-800 pb-2">🔮 Phase 2: The Summoning (Generation)</h3>
            <p className="text-sm italic text-stone-500 mb-4">Located in the left panel (The Grimoire), this is where you define your asset.</p>
            
            <div className="grid md:grid-cols-2 gap-6">
               <div className="space-y-2">
                 <h4 className="fantasy-font text-sm text-amber-500">1. The Oracle (Image Input)</h4>
                 <p className="text-sm">Click the dotted box (🔮) to upload an existing image. The AI will use this as a structural reference.</p>
               </div>
               <div className="space-y-2">
                 <h4 className="fantasy-font text-sm text-amber-500">2. Inscription (Prompt)</h4>
                 <p className="text-sm">Describe your entity. Example: <em>"A cyberpunk samurai with a neon katana."</em> The AI handles technical constraints automatically.</p>
               </div>
               <div className="space-y-2">
                 <h4 className="fantasy-font text-sm text-amber-500">3. Asset Mode</h4>
                 <ul className="text-sm space-y-1 text-stone-400 ml-2">
                    <li><strong className="text-stone-300">SINGLE:</strong> Large static portrait.</li>
                    <li><strong className="text-stone-300">SHEET:</strong> 4x4 animation grid. Automatically selected for Armory/VFX.</li>
                 </ul>
               </div>
               <div className="space-y-2">
                 <h4 className="fantasy-font text-sm text-amber-500">4. Entity Essence</h4>
                 <p className="text-sm">Helps the AI understand anatomy and layout rules:</p>
                 <ul className="text-xs text-stone-400 ml-2 mt-1 space-y-1">
                   <li><strong className="text-stone-300">HERO / FOE:</strong> Character sprites.</li>
                   <li><strong className="text-stone-300">ARMORY (⚔️):</strong> Generates a 4x4 grid of 16 <em>unique</em> icon variations.</li>
                   <li><strong className="text-stone-300">AMMO (☄️):</strong> Rotational projectiles.</li>
                   <li><strong className="text-stone-300">FX (✨):</strong> Particle bursts (Ignition → Dissipation).</li>
                   <li><strong className="text-emerald-500">AUTOTILE:</strong> 3x3 layout for terrain bitmasking.</li>
                 </ul>
               </div>
            </div>
          </section>

          {/* Phase 3 */}
          <section className="space-y-4">
            <h3 className="fantasy-font text-xl text-amber-600 border-b border-stone-800 pb-2">🎛️ Phase 3: The Control Panel</h3>
            <p className="text-sm italic text-stone-500 mb-4">Located on the right side, refining processing and view.</p>

            <div className="space-y-3">
               <h4 className="fantasy-font text-sm text-stone-400 uppercase border-b border-stone-800/50 pb-1 w-max">Grid Protocol</h4>
               <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm text-stone-400">
                  <li><span className="text-sky-400 font-bold">Vector Rite (📐):</span> Sharpening filter for "fuzzy" upscaled edges.</li>
                  <li><span className="text-amber-500 font-bold">Consistency (🔄):</span> Diffusion tech to reduce animation flicker.</li>
                  <li><span className="text-purple-400 font-bold">Breeding (🧬):</span> Generates 4 unique design variations (2x2).</li>
                  <li><span className="text-emerald-500 font-bold">Void Key:</span> Removes magenta backgrounds. Now supports deep shadow protection.</li>
                  <li><span className="text-stone-300 font-bold">Seamless:</span> Tiles image 3x3 to check looping.</li>
               </ul>
            </div>

            <div className="space-y-3 mt-4">
               <h4 className="fantasy-font text-sm text-stone-400 uppercase border-b border-stone-800/50 pb-1 w-max">Alchemy (Color)</h4>
               <ul className="text-sm text-stone-400 space-y-1 ml-2">
                  <li><strong className="text-red-400">Neural Ramps:</strong> Type a material (e.g., "Rusty Iron") and click <em>Synthesize</em> to generate a physics-based palette.</li>
                  <li><strong className="text-red-400">Palette Lock:</strong> Forces colors to hardware limits (e.g., NES 4-color) or your generated Neural Ramp.</li>
               </ul>
            </div>
          </section>

           {/* Phase 4 */}
           <section className="space-y-4">
            <h3 className="fantasy-font text-xl text-amber-600 border-b border-stone-800 pb-2">👁️ Phase 4: Advanced Tools</h3>
            <div className="flex flex-col md:flex-row gap-4">
               <div className="flex-1 bg-[#0a0807] p-3 border border-purple-900/30 rounded">
                  <h4 className="fantasy-font text-sm text-purple-400 mb-2">🔮 Alchemist (Normal Maps)</h4>
                  <p className="text-xs leading-relaxed">Generates a Tangent Space Normal Map. Click <strong>"Ignite Torch"</strong> to preview real-time dynamic lighting on your 2D sprite.</p>
               </div>
               <div className="flex-1 bg-[#0a0807] p-3 border border-sky-900/30 rounded">
                  <h4 className="fantasy-font text-sm text-sky-400 mb-2">🦴 Auto-Rigger (Skeleton)</h4>
                  <p className="text-xs leading-relaxed">Uses Vision AI to detect joints. Click <strong>"Skeleton"</strong> to toggle bone overlay for rigging tools like Spine.</p>
               </div>
            </div>
          </section>

          {/* Phase 5 */}
          <section className="space-y-4">
            <h3 className="fantasy-font text-xl text-amber-600 border-b border-stone-800 pb-2">📦 Phase 5: Export Manifest</h3>
            <div className="bg-sky-900/10 border border-sky-900/30 p-4 rounded">
               <h4 className="fantasy-font text-sm text-sky-400 mb-2">Aseprite Flux (Recommended)</h4>
               <ol className="list-decimal list-inside text-sm text-stone-400 space-y-1 ml-2">
                  <li>Select <strong>Aseprite Flux</strong> tab in Export.</li>
                  <li>Click <strong>"1. Download PNG"</strong> (Sprite Sheet).</li>
                  <li>Click <strong>"2. Download Metadata"</strong> (JSON).</li>
                  <li>Place both in your project folder. Engines like Unity/Godot can read the JSON to slice frames automatically.</li>
               </ol>
            </div>
          </section>

          <div className="text-center pt-8 opacity-50 text-xs fantasy-font">
             For the glory of the 8-bit era.
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#44403c] bg-[#0c0a09] flex justify-end">
           <button onClick={onClose} className="px-8 py-2 bg-amber-700 text-black fantasy-font font-bold uppercase hover:bg-amber-600 transition-all rounded shadow-lg">Close Grimoire</button>
        </div>
      </div>
    </div>
  );
};

export default UserGuide;
