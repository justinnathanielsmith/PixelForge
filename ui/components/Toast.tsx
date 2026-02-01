
import React from 'react';
import { useToast, ToastMessage, ToastType } from '../context/ToastContext';

const ToastIcon = ({ type }: { type: ToastType }) => {
  switch (type) {
    case 'success': return <span className="text-emerald-500">✨</span>;
    case 'error': return <span className="text-red-500">💥</span>;
    case 'warning': return <span className="text-amber-500">⚠️</span>;
    case 'mana': return <span className="text-sky-400">🌀</span>;
    default: return <span className="text-amber-500">📜</span>;
  }
};

const Toast: React.FC<{ toast: ToastMessage }> = ({ toast }) => {
  const { dismiss } = useToast();

  const borderColor = {
    success: 'border-emerald-900/50',
    error: 'border-red-900/50',
    warning: 'border-amber-900/50',
    mana: 'border-sky-900/50',
    info: 'border-stone-700/50'
  }[toast.type];

  const glowColor = {
    success: 'shadow-[0_0_15px_rgba(16,185,129,0.2)]',
    error: 'shadow-[0_0_15px_rgba(239,68,68,0.2)]',
    warning: 'shadow-[0_0_15px_rgba(245,158,11,0.2)]',
    mana: 'shadow-[0_0_15px_rgba(14,165,233,0.2)]',
    info: 'shadow-md'
  }[toast.type];

  return (
    <div 
      onClick={() => dismiss(toast.id)}
      className={`max-w-xs w-full bg-[#1c1917] border-2 ${borderColor} ${glowColor} p-3 cursor-pointer animate-in slide-in-from-right-full fade-in duration-300 relative group overflow-hidden`}
    >
      <div className="absolute top-0 left-0 w-1 h-full bg-stone-800 group-hover:bg-amber-600 transition-colors" />
      <div className="flex gap-3">
        <div className="shrink-0 text-xl">
          <ToastIcon type={toast.type} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="fantasy-font text-[10px] font-bold text-amber-500 uppercase tracking-widest">{toast.title}</h4>
          {toast.message && <p className="text-[10px] text-stone-500 leading-tight mt-0.5 line-clamp-2">{toast.message}</p>}
        </div>
      </div>
      <div className="absolute top-1 right-2 text-[8px] text-stone-700 group-hover:text-stone-500">×</div>
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const { toasts } = useToast();
  
  return (
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3 pointer-events-none">
      <div className="pointer-events-auto flex flex-col gap-3">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} />
        ))}
      </div>
    </div>
  );
};
