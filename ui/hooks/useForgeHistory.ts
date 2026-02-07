
import { useState, useEffect, useCallback } from 'react';
import { GeneratedArt } from '../../domain/entities';
import { orchestrator } from '../../domain/pixelForgeOrchestrator';
import { useToast } from '../context/ToastContext';

export const useForgeHistory = () => {
  const [history, setHistory] = useState<GeneratedArt[]>([]);
  const [activeArt, setActiveArt] = useState<GeneratedArt | null>(null);
  const { whisper } = useToast();

  useEffect(() => {
    const loadHistory = async () => {
      const initialHistory = await orchestrator.loadInitialHistory();
      setHistory(initialHistory);
      if (initialHistory.length > 0) {
        setActiveArt(initialHistory[0]);
      }
    };
    loadHistory();
  }, []);

  const addArt = useCallback((art: GeneratedArt) => {
    setHistory(prev => [art, ...prev]);
    setActiveArt(art);
  }, []);

  const updateArt = useCallback((updatedArt: GeneratedArt) => {
    // Force new object references for React re-renders
    setHistory(prev => prev.map(a => a.id === updatedArt.id ? { ...updatedArt } : a));
    setActiveArt(prev => prev?.id === updatedArt.id ? { ...updatedArt } : prev);
  }, []);

  const deleteArt = useCallback(async (id: string) => {
    try {
      // Dynamically import repository to avoid circular deps if any, though orchestrator handles it mostly
      const { pixelRepository } = await import('../../data/repository');
      await pixelRepository.deleteArt(id);
      
      setHistory(prev => {
        const remaining = prev.filter(a => a.id !== id);
        setActiveArt(currentActive => {
          if (currentActive?.id === id) {
            return remaining.length > 0 ? remaining[0] : null;
          }
          return currentActive;
        });
        return remaining;
      });
      whisper("Entity Dissolved", "The vision has been returned to the void.", "info");
    } catch (err) {
      whisper("Dissolution Failed", "The entity clings to reality.", "error");
    }
  }, [whisper]);

  const navigateHistory = useCallback((direction: 'newer' | 'older') => {
    if (!history.length) return;
    const currentIndex = activeArt ? history.findIndex(a => a.id === activeArt.id) : -1;
    
    let newIndex = currentIndex;
    if (currentIndex === -1) {
        newIndex = 0; 
    } else {
        if (direction === 'newer') newIndex = Math.max(0, currentIndex - 1);
        if (direction === 'older') newIndex = Math.min(history.length - 1, currentIndex + 1);
    }
    
    if (newIndex !== currentIndex && history[newIndex]) {
        setActiveArt(history[newIndex]);
    }
  }, [history, activeArt]);

  const setFullHistory = useCallback((newHistory: GeneratedArt[]) => {
    setHistory(newHistory);
    setActiveArt(prev => {
      if (!prev && newHistory.length > 0) {
        return newHistory[0];
      }
      return prev;
    });
  }, []);

  return { 
    history, 
    activeArt, 
    setActiveArt, 
    addArt, 
    updateArt, 
    deleteArt, 
    navigateHistory,
    setFullHistory 
  };
};
