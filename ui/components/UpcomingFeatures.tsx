import React from 'react';

const UpcomingFeatures: React.FC = () => {
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
      title: "Aseprite Flux", 
      desc: "JSON manifest export preserving frame tags and animation timing.", 
      icon: "📦"
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
      title: "Top-Down Projection", 
      desc: "New orthographic top-down perspective for ARPG and tactics environments.", 
      icon: "📐",
      progress: 15
    }
  ];

  return (
    <section className="fantasy-card p-4 relative overflow-hidden bg-stone-900/60 border-emerald-900/30">
      <div className="absolute -top-3 left-4 bg-[#1c1917] px-2 text-[10px] fantasy-font font-bold text-emerald-500 border border-emerald-800/50 uppercase tracking-widest shadow-[0_0_10px_rgba(16,185,129,0.2)] z-10">
        The Lab Manifesto
      </div>
      
      <div className="pt-2 space-y-5">
        {/* ACTIVE ENCHANTMENTS */}
        <div className="space-y-3">
          <h3 className="text-[9px] fantasy-font text-stone-500 uppercase tracking-[0.2em] border-b border-stone-800 pb-1 mb-2">Active Enchantments</h3>
          <div className="grid grid-cols-2 gap-2">
            {activeFeatures.map((feat, i) => (
              <div key={i} className="bg-black/40 border border-emerald-900/20 p-2 rounded hover:bg-emerald-500/5 transition-colors group">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs">{feat.icon}</span>
                  <h4 className="fantasy-font text-[9px] text-emerald-400 uppercase font-bold truncate">{feat.title}</h4>
                </div>
                <p className="text-[8px] text-stone-500 leading-tight group-hover:text-stone-400 transition-colors line-clamp-2">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ARCANE RESEARCH (ROADMAP) */}
        <div className="space-y-3">
          <h3 className="text-[9px] fantasy-font text-stone-500 uppercase tracking-[0.2em] border-b border-stone-800 pb-1 mb-2">Arcane Research</h3>
          <div className="space-y-2">
            {researchRoadmap.map((feat, i) => (
              <div key={i} className="bg-black/20 border border-stone-800 p-2 rounded group">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs opacity-50 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all">{feat.icon}</span>
                    <h4 className="fantasy-font text-[9px] text-stone-400 group-hover:text-stone-200 transition-colors uppercase font-bold">{feat.title}</h4>
                  </div>
                  <span className="text-[8px] font-mono text-stone-600">{feat.progress}%</span>
                </div>
                <div className="w-full h-0.5 bg-stone-900 rounded-full overflow-hidden mb-1.5">
                  <div 
                    className="h-full bg-stone-600 group-hover:bg-amber-700 transition-all duration-500" 
                    style={{ width: `${feat.progress}%` }} 
                  />
                </div>
                <p className="text-[8px] text-stone-600 italic leading-tight group-hover:text-stone-400 transition-colors">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* LOG PANEL */}
        <div className="p-2 bg-emerald-950/10 border border-emerald-900/20 rounded relative overflow-hidden">
           <div className="flex items-center justify-between text-[8px] fantasy-font text-emerald-600 font-bold uppercase tracking-widest relative z-10">
              <span className="flex items-center gap-1.5">
                <span className="w-1 h-1 bg-emerald-500 rounded-full animate-ping" />
                Forge Uplink
              </span>
              <span>v1.2.4-stable</span>
           </div>
        </div>
      </div>
    </section>
  );
};

export default UpcomingFeatures;