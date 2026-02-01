
import { useState, useEffect, useCallback } from 'react';
import { AnimationSettings, PixelStyle } from '../../domain/entities';
import { orchestrator } from '../../domain/pixelForgeOrchestrator';

export const DEFAULT_SETTINGS: AnimationSettings = {
  rows: 4, cols: 4, fps: 8, isPlaying: true, showGuides: false, tiledPreview: false, 
  targetResolution: 32, aspectRatio: '1:1', paletteLock: false, autoTransparency: true, chromaTolerance: 5, batchMode: false, zoom: 1.0, 
  panOffset: { x: 0, y: 0 },
  onionSkin: false, hue: 0, saturation: 100, contrast: 100, brightness: 100,
  temporalStability: false,
  vectorRite: false,
  gifRepeat: 0,
  gifDither: false,
  gifDisposal: 2,
  customPalette: null
};

export const getSystemDefaults = (style: PixelStyle) => {
  switch (style) {
    case '8-bit': return { hue: 0, saturation: 85, contrast: 125, brightness: 110 };
    case '16-bit': return { hue: 0, saturation: 110, contrast: 100, brightness: 100 };
    case 'hi-bit': return { hue: 0, saturation: 100, contrast: 105, brightness: 100 };
    case 'gameboy': return { hue: 0, saturation: 120, contrast: 110, brightness: 100 };
    default: return { hue: 0, saturation: 100, contrast: 100, brightness: 100 };
  }
};

export const useForgeSettings = () => {
  const [settings, setSettingsState] = useState<AnimationSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    const loadSettings = async () => {
      const session = await orchestrator.loadSession();
      if (session.settings) {
        setSettingsState(prev => ({ ...prev, ...session.settings }));
      }
    };
    loadSettings();
  }, []);

  const updateSettings = useCallback((newSettings: Partial<AnimationSettings>) => {
    setSettingsState(prev => {
      const updated = { ...prev, ...newSettings };
      orchestrator.persistSession({ animationSettings: updated });
      return updated;
    });
  }, []);

  return { settings, updateSettings };
};
