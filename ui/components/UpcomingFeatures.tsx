import React from 'react';

interface UpcomingFeaturesProps {
  onClose: () => void;
}

const UpcomingFeatures: React.FC<UpcomingFeaturesProps> = ({ onClose }) => {
  const activeFeatures = [
    { 
      title: "Consistency V4", 
      desc: "Diffusion-based temporal anchoring for 32-frame seamless loops.", 
      icon: "🔄"
    },
    { 
      title: "Normal Alchemist", 
      desc: "Real-time tangent space normal mapping for dynamic 2D lighting.", 
      icon: "💡"
    },
    { 
      title: "Auto-Rigger", 
      desc: "Anatomical skeletal identification via Gemini 3 Pro vision reasoning.", 
      icon: "🦴"
    },
    { 
      title: "Top-Down Projection", 
      desc: "New orthographic top-down perspective for ARPG and tactics environments.", 
      icon: "📐"
    }
  ];

  const researchRoadmap = [
    { 
      title: "Autotile Architect", 
      desc: "Generating 47-tile bitmask sets for seamless terrain integration.", 
      icon: "🗺️",
      progress: 65
    },
    { 
      title: "Hardware Emulation", 
      desc: "Physical limit strictness for C64, NES (3-color), and Amiga palettes.", 
      icon: "🕹️",
      progress: 40
    },
    { 
      title: "Neural Color Ramps", 
      desc: "Procedural palette generation based on material physics (wood, metal, slimes).", 
      icon: "🎨",
      progress: 85
    },
    { 
      title: "Aseprite Flux", 
      desc: "JSON manifest export preserving frame tags and animation timing.", 
      icon: "📦",
      progress: 95
    }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl fantasy-card bg-[#1c1917] flex flex-col shadow-2xl border-emerald-900/50 max-h-[90vh] relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-emerald-900/30 bg-[#0c0a09]">
           <div className="flex items-center gap-3">
             <span className="text-2xl">🧪</span>
             <div>
               <h2 className="fantasy-font text-sm text-emerald-500 uppercase tracking-widest leading-none">The Lab Manifesto</h2>
               <span className="text-[10px] text-stone-500 font-mono">v1.2.4-stable • Research Roadmap</span>
             </div>
           </div>
           <button onClick={onClose} className="text-stone-500 hover:text-red-400 text-2xl leading-none transition-colors">×</button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {/* ACTIVE ENCHANTMENTS */}
          <div className="space-y-4">
            <h3 className="text-[10px] fantasy-font text-stone-500 uppercase tracking-[0.2em] border-b border-stone-800 pb-2">Active Enchantments</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeFeatures.map((feat, i) => (
                <div key={i} className="bg-black/40 border border-emerald-900/20 p-3 rounded hover:bg-emerald-500/5 transition-colors group">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xl">{feat.icon}</span>
                    <h4 className="fantasy-font text-[10px] text-emerald-400 uppercase font-bold">{feat.title}</h4>
                  </div>
                  <p className="text-[10px] text-stone-500 leading-tight group-hover:text-stone-400 transition-colors">{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ARCANE RESEARCH (ROADMAP) */}
          <div className="space-y-4">
            <h3 className="text-[10px] fantasy-font text-stone-500 uppercase tracking-[0.2em] border-b border-stone-800 pb-2">Arcane Research Roadmap</h3>
            <div className="space-y-3">
              {researchRoadmap.map((feat, i) => (
                <div key={i} className="bg-black/20 border border-stone-800 p-3 rounded group">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xl opacity-50 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all">{feat.icon}</span>
                      <h4 className="fantasy-font text-[10px] text-stone-400 group-hover:text-stone-200 transition-colors uppercase font-bold">{feat.title}</h4>
                    </div>
                    <span className="text-[10px] font-mono text-stone-600">{feat.progress}%</span>
                  </div>
                  <div className="w-full h-1 bg-stone-900 rounded-full overflow-hidden mb-2">
                    <div 
                      className="h-full bg-emerald-900 group-hover:bg-emerald-600 transition-all duration-700 ease-in-out" 
                      style={{ width: `${feat.progress}%` }} 
                    />
                  </div>
                  <p className="text-[10px] text-stone-600 italic leading-tight group-hover:text-stone-400 transition-colors">{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-emerald-900/30 bg-[#0c0a09] flex justify-between items-center">
           <div className="flex items-center gap-2 text-[9px] fantasy-font text-emerald-600 font-bold uppercase tracking-widest">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
              Forge Uplink Synchronized
           </div>
           <button onClick={onClose} className="px-8 py-2 bg-emerald-900/40 text-emerald-400 border border-emerald-800 fantasy-font text-[10px] font-bold uppercase hover:bg-emerald-800 hover:text-white transition-all rounded shadow-lg">Close Manifesto</button>
        </div>
      </div>
    </div>
  );
};

export default UpcomingFeatures;