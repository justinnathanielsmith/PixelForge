
import React, { useState, useEffect } from 'react';
import PreparationRitual from './PreparationRitual.tsx';

interface GatekeeperProps {
  children: React.ReactNode;
}

export const Gatekeeper: React.FC<GatekeeperProps> = ({ children }) => {
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);

  useEffect(() => {
    const checkKey = async () => {
      // 1. Dev Mode Bypass: Allow local debugging without AI Studio iframe
      // Safe access to import.meta.env to prevent crashes if undefined
      const isDev = (import.meta as any)?.env?.DEV;

      if (isDev) {
        console.warn("Gatekeeper: Development mode detected. Bypassing AI Studio key check.");
        setHasApiKey(true);
        return;
      }

      // 2. Production/AI Studio Environment Check
      try {
        if ((window as any).aistudio) {
          const selected = await (window as any).aistudio.hasSelectedApiKey();
          setHasApiKey(selected);
        } else {
          // If not in Dev mode and aistudio is missing, we must block access
          // as we rely on the parent frame for the API key in production.
          console.warn("Gatekeeper: window.aistudio not found.");
          setHasApiKey(false);
        }
      } catch (e) {
        console.error("API Key check failed", e);
        setHasApiKey(false);
      }
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    try {
      if ((window as any).aistudio) {
        await (window as any).aistudio.openSelectKey();
        // Assuming success if the modal opens/closes, though strict check happens on re-render/api call
        setHasApiKey(true);
      } else {
         console.error("Cannot select key: window.aistudio is undefined.");
      }
    } catch (e) {
      console.error("Key selection flow error", e);
    }
  };

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
          
          <PreparationRitual />

          <div className="flex flex-col gap-4">
            <button onClick={handleSelectKey} className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-black fantasy-font font-bold text-lg transition-all shadow-[0_0_15px_rgba(217,119,6,0.3)]">Select API Key</button>
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-stone-600 hover:text-amber-700 text-[10px] uppercase fantasy-font tracking-widest transition-colors">Consult the Billing Grimoire ↗</a>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
