import React from 'react';

const PreparationRitual: React.FC = () => {
  return (
    <div className="bg-black/40 border border-stone-800 p-4 rounded text-left space-y-3">
       <p className="text-[10px] fantasy-font text-stone-500 uppercase tracking-widest border-b border-stone-800 pb-2">Preparation Ritual</p>
       <ul className="text-xs text-stone-300 space-y-2 list-disc pl-4">
          <li>Select a project with active billing enabled.</li>
          <li>The forge uses <span className="text-sky-400">Gemini 3 Pro</span> for maximum fidelity.</li>
          <li>The selected API key will be managed securely by the platform.</li>
       </ul>
    </div>
  );
};

export default PreparationRitual;