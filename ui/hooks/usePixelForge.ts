
import React, { useReducer, useRef, useCallback, useEffect } from 'react';
import { orchestrator } from '../../domain/pixelForgeOrchestrator';
import { 
  GeneratedArt, 
  GenerationState, 
  AnimationSettings, 
  PixelStyle, 
  PixelForgeState,
  PixelForgeIntent
} from '../../domain/entities';

export const DEFAULT_SETTINGS: AnimationSettings = {
  rows: 4, cols: 4, fps: 8, isPlaying: true, showGuides: false, tiledPreview: false, 
  targetResolution: 32, paletteLock: false, autoTransparency: true, chromaTolerance: 5, batchMode: false, zoom: 1.0, 
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

export function pixelForgeReducer(state: PixelForgeState, intent: PixelForgeIntent): PixelForgeState {
  switch (intent.type) {
    case 'SET_PROMPT': return { ...state, prompt: intent.payload };
    case 'SET_SPRITE_SHEET': return { ...state, isSpriteSheet: intent.payload };
    case 'SET_STYLE': return { ...state, selectedStyle: intent.payload };
    case 'SET_PERSPECTIVE': return { ...state, perspective: intent.payload };
    case 'SET_CATEGORY': return { ...state, category: intent.payload };
    case 'TOGGLE_ACTION': 
      const actions = state.selectedActions.includes(intent.payload)
        ? state.selectedActions.filter(a => a !== intent.payload)
        : [...state.selectedActions, intent.payload];
      return { ...state, selectedActions: actions };
    case 'SUMMON_START': return { ...state, genState: GenerationState.GENERATING, errorMessage: '' };
    case 'SUMMON_SUCCESS':
      const art = intent.payload;
      const colorDefaults = getSystemDefaults(state.selectedStyle);
      return { 
        ...state, 
        genState: GenerationState.SUCCESS, 
        activeArt: art,
        history: [art, ...state.history],
        animationSettings: {
          ...state.animationSettings,
          rows: art.gridSize!.rows,
          cols: art.gridSize!.cols,
          isPlaying: !state.animationSettings.batchMode && state.isSpriteSheet,
          tiledPreview: false,
          ...colorDefaults
        }
      };
    case 'SUMMON_FAILURE': return { ...state, genState: GenerationState.ERROR, errorMessage: intent.payload };
    case 'SET_ACTIVE_ART': return { ...state, activeArt: intent.payload };
    case 'UPDATE_ART': 
      const updatedArt = intent.payload;
      const updatedHistory = state.history.map(a => a.id === updatedArt.id ? updatedArt : a);
      return { 
        ...state, 
        activeArt: state.activeArt?.id === updatedArt.id ? updatedArt : state.activeArt,
        history: updatedHistory
      };
    case 'UPDATE_SETTINGS': return { ...state, animationSettings: { ...state.animationSettings, ...intent.payload } };
    case 'SET_INSPIRATION': return { ...state, inspiration: intent.payload };
    case 'SET_EXPORTING': return { ...state, isExporting: intent.payload };
    case 'PIN_DESIGN':
      const design = intent.payload;
      return {
        ...state,
        prompt: design.prompt,
        selectedStyle: design.style,
        perspective: design.perspective,
        category: design.category,
        inspiration: { url: design.imageUrl, data: design.imageUrl.split(',')[1], mimeType: 'image/png', isRefining: true }
      };
    case 'SET_HISTORY':
      return {
        ...state,
        history: intent.payload,
        activeArt: state.activeArt || (intent.payload.length > 0 ? intent.payload[0] : null)
      };
    case 'IMPORT_PROJECT':
      return {
        ...state,
        history: intent.payload.history,
        prompt: intent.payload.prompt,
        animationSettings: intent.payload.settings || state.animationSettings,
        activeArt: intent.payload.history.length > 0 ? intent.payload.history[0] : null
      };
    default: return state;
  }
}

export const usePixelForge = () => {
  const getInitialState = (): PixelForgeState => {
    const session = orchestrator.loadSession();
    return {
      prompt: session.prompt || '',
      isSpriteSheet: true,
      selectedStyle: '16-bit',
      perspective: 'side',
      category: 'character',
      selectedActions: ['idle'],
      genState: GenerationState.IDLE,
      history: [],
      activeArt: null,
      errorMessage: '',
      isExporting: false,
      inspiration: null,
      animationSettings: session.settings || DEFAULT_SETTINGS
    };
  };

  const [state, dispatch] = useReducer(pixelForgeReducer, getInitialState());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const projectInputRef = useRef<HTMLInputElement>(null);

  // Persistence Ritual: Small settings to LocalStorage
  useEffect(() => {
    orchestrator.persistSession({ animationSettings: state.animationSettings, prompt: state.prompt });
  }, [state.animationSettings, state.prompt]);

  // Initialization Ritual: Large history from IndexedDB
  useEffect(() => {
    const loadHistory = async () => {
      const history = await orchestrator.loadInitialHistory();
      dispatch({ type: 'SET_HISTORY', payload: history });
    };
    loadHistory();
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      dispatch({ type: 'SET_INSPIRATION', payload: { url: URL.createObjectURL(file), data: result.split(',')[1], mimeType: file.type } });
    };
    reader.readAsDataURL(file);
  };

  const handleProjectImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const result = await orchestrator.importProjectFile(reader.result as string);
        dispatch({ type: 'IMPORT_PROJECT', payload: result });
      } catch (err) {
        console.error("Project import failure", err);
      }
    };
    reader.readAsText(file);
  };

  const exportProject = async () => {
    try {
      const url = await orchestrator.exportProjectFile();
      const link = document.createElement('a');
      link.href = url;
      link.download = `project_${Date.now()}.forge`;
      link.click();
    } catch (err) {
      console.error("Project export failure", err);
    }
  };

  const generateArt = async (e?: React.FormEvent | Event) => {
    if (e) e.preventDefault();
    if (!state.prompt.trim() || state.genState === GenerationState.GENERATING) return;
    dispatch({ type: 'SUMMON_START' });
    try {
      const art = await orchestrator.summonEntity(
        state.prompt, state.isSpriteSheet, state.selectedStyle, state.perspective, 
        state.category, state.selectedActions, state.animationSettings,
        state.inspiration ? { data: state.inspiration.data, mimeType: state.inspiration.mimeType } : undefined
      );
      dispatch({ type: 'SUMMON_SUCCESS', payload: art });
    } catch (err: unknown) {
      dispatch({ type: 'SUMMON_FAILURE', payload: err instanceof Error ? err.message : 'Unknown Anomaly' });
    }
  };

  const generateNormalMap = useCallback(async () => {
    if (!state.activeArt || state.isExporting) return;
    dispatch({ type: 'SET_EXPORTING', payload: true });
    try {
      const updatedArt = await orchestrator.forgeNormalMap(state.activeArt);
      dispatch({ type: 'UPDATE_ART', payload: updatedArt });
    } catch (error) {
      console.error("Normal map generation failed", error);
    } finally {
      dispatch({ type: 'SET_EXPORTING', payload: false });
    }
  }, [state.activeArt, state.isExporting]);

  const generateSkeleton = useCallback(async () => {
    if (!state.activeArt || state.isExporting) return;
    dispatch({ type: 'SET_EXPORTING', payload: true });
    try {
      const updatedArt = await orchestrator.forgeSkeleton(state.activeArt);
      dispatch({ type: 'UPDATE_ART', payload: updatedArt });
    } catch (error) {
      console.error("Rigging failed", error);
    } finally {
      dispatch({ type: 'SET_EXPORTING', payload: false });
    }
  }, [state.activeArt, state.isExporting]);

  const generatePalette = useCallback(async (prompt: string) => {
    try {
      const palette = await orchestrator.forgePalette(prompt);
      dispatch({ type: 'UPDATE_SETTINGS', payload: { customPalette: palette, paletteLock: true } });
    } catch (error) {
      console.error("Palette generation failed", error);
    }
  }, []);

  const exportAsset = useCallback(async (mode: 'gif' | 'video' | 'png' | 'aseprite' | 'mobile') => {
    if (!state.activeArt || state.isExporting) return;
    dispatch({ type: 'SET_EXPORTING', payload: true });
    try {
      const url = await orchestrator.exportAsset(state.activeArt, state.animationSettings, mode);
      const link = document.createElement('a');
      link.href = url;
      if (mode === 'mobile') {
        link.download = `mobile_bundle_${state.activeArt.id}.zip`;
      } else {
        link.download = mode === 'aseprite' ? `pxl_flux_${state.activeArt.id}.json` : `pxl_export.${mode === 'video' ? 'webm' : mode}`;
      }
      link.click();
    } catch (error) {
      console.error("Export failed", error);
    } finally {
      dispatch({ type: 'SET_EXPORTING', payload: false });
    }
  }, [state.activeArt, state.animationSettings, state.isExporting]);

  const navigateHistory = useCallback((direction: 'newer' | 'older') => {
    if (!state.history.length) return;
    const currentIndex = state.activeArt ? state.history.findIndex(a => a.id === state.activeArt!.id) : -1;
    
    let newIndex = currentIndex;
    if (currentIndex === -1) {
        newIndex = 0; 
    } else {
        if (direction === 'newer') newIndex = Math.max(0, currentIndex - 1);
        if (direction === 'older') newIndex = Math.min(state.history.length - 1, currentIndex + 1);
    }
    
    if (newIndex !== currentIndex && state.history[newIndex]) {
        dispatch({ type: 'SET_ACTIVE_ART', payload: state.history[newIndex] });
    }
  }, [state.history, state.activeArt]);

  return { 
    state, 
    dispatch, 
    actions: { 
      generateArt, 
      handleImageUpload, 
      handleProjectImport, 
      exportProject, 
      exportAsset, 
      generateNormalMap, 
      generateSkeleton,
      generatePalette,
      navigateHistory
    }, 
    refs: { fileInputRef, projectInputRef } 
  };
};
