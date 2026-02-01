
import React, { useReducer, useRef, useCallback, useEffect } from 'react';
import { orchestrator } from '../../domain/pixelForgeOrchestrator';
import { useToast } from '../context/ToastContext';
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
          panOffset: { x: 0, y: 0 },
          ...colorDefaults
        }
      };
    case 'SUMMON_FAILURE': return { ...state, genState: GenerationState.ERROR, errorMessage: intent.payload };
    case 'SET_ACTIVE_ART': return { ...state, activeArt: intent.payload };
    case 'UPDATE_ART': 
      const updatedArt = intent.payload;
      const updatedHistory = state.history.map(a => 
        a.id === updatedArt.id ? { ...updatedArt } : a
      );
      return { 
        ...state, 
        activeArt: state.activeArt?.id === updatedArt.id ? { ...updatedArt } : state.activeArt,
        history: updatedHistory
      };
    case 'DELETE_ART':
      const remainingHistory = state.history.filter(a => a.id !== intent.payload);
      return {
        ...state,
        history: remainingHistory,
        activeArt: state.activeArt?.id === intent.payload ? (remainingHistory.length > 0 ? remainingHistory[0] : null) : state.activeArt
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
    return {
      prompt: '',
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
      animationSettings: DEFAULT_SETTINGS
    };
  };

  const [state, dispatch] = useReducer(pixelForgeReducer, getInitialState());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const projectInputRef = useRef<HTMLInputElement>(null);
  const { whisper } = useToast();

  // Persistence Ritual: Small settings to IndexedDB
  useEffect(() => {
    orchestrator.persistSession({ animationSettings: state.animationSettings, prompt: state.prompt });
  }, [state.animationSettings, state.prompt]);

  // Initialization Ritual: Hydrate from IndexedDB
  useEffect(() => {
    const hydrate = async () => {
      // 1. Load History
      const history = await orchestrator.loadInitialHistory();
      dispatch({ type: 'SET_HISTORY', payload: history });

      // 2. Load Session (Settings & Prompt)
      const session = await orchestrator.loadSession();
      if (session.prompt) {
        dispatch({ type: 'SET_PROMPT', payload: session.prompt });
      }
      if (session.settings) {
        dispatch({ type: 'UPDATE_SETTINGS', payload: session.settings });
      }
    };
    hydrate();
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      dispatch({ type: 'SET_INSPIRATION', payload: { url: URL.createObjectURL(file), data: result.split(',')[1], mimeType: file.type } });
      whisper("Oracle Link Established", "Inspiration image channeled successfully.", "mana");
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
        whisper("Grimoire Restored", "Project history and settings re-materialized.", "success");
      } catch (err) {
        console.error("Project import failure", err);
        whisper("Nether-Void Error", "Failed to decode project file.", "error");
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
      whisper("Project Saved", "The Grimoire has been archived as a .forge file.", "success");
    } catch (err) {
      console.error("Project export failure", err);
      whisper("Save Ritual Interrupted", "Mana depletion or storage failure.", "error");
    }
  };

  const generateArt = async (e?: React.FormEvent | Event) => {
    if (e) e.preventDefault();
    if (!state.prompt.trim() || state.genState === GenerationState.GENERATING) return;
    dispatch({ type: 'SUMMON_START' });
    whisper("Summoning Entity", "Channeling vision from the scrying pool...", "mana");
    try {
      const art = await orchestrator.summonEntity(
        state.prompt, state.isSpriteSheet, state.selectedStyle, state.perspective, 
        state.category, state.selectedActions, state.animationSettings,
        state.inspiration ? { data: state.inspiration.data, mimeType: state.inspiration.mimeType } : undefined
      );
      dispatch({ type: 'SUMMON_SUCCESS', payload: art });
      whisper("Transmutation Success", "The entity has materialized in our reality.", "success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown Anomaly';
      dispatch({ type: 'SUMMON_FAILURE', payload: msg });
      whisper("Ritual Backfire", msg, "error");
    }
  };

  const generateNormalMap = useCallback(async () => {
    if (!state.activeArt || state.isExporting) return;
    dispatch({ type: 'SET_EXPORTING', payload: true });
    whisper("Alchemist at Work", "Mapping surface geometry...", "mana");
    try {
      const updatedArt = await orchestrator.forgeNormalMap(state.activeArt);
      dispatch({ type: 'UPDATE_ART', payload: updatedArt });
      whisper("Normal Map Materialized", "Surface data added to entity.", "success");
    } catch (error) {
      console.error("Normal map generation failed", error);
      whisper("Alchemy Failure", "Could not calculate depth normals.", "error");
    } finally {
      dispatch({ type: 'SET_EXPORTING', payload: false });
    }
  }, [state.activeArt, state.isExporting, whisper]);

  const generateSkeleton = useCallback(async () => {
    if (!state.activeArt || state.isExporting) return;
    dispatch({ type: 'SET_EXPORTING', payload: true });
    whisper("Bone Scryer Active", "Analyzing anatomy...", "mana");
    try {
      const updatedArt = await orchestrator.forgeSkeleton(state.activeArt);
      dispatch({ type: 'UPDATE_ART', payload: updatedArt });
      whisper("Anatomy Analyzed", "Skeletal joints identified and rigged.", "success");
    } catch (error) {
      console.error("Rigging failed", error);
      whisper("Rigging Anomaly", "Anatomical reasoning failed.", "error");
    } finally {
      dispatch({ type: 'SET_EXPORTING', payload: false });
    }
  }, [state.activeArt, state.isExporting, whisper]);

  const generatePalette = useCallback(async (prompt: string) => {
    whisper("Neural Ramp Sync", "Generating palette from essence...", "mana");
    try {
      const palette = await orchestrator.forgePalette(prompt);
      dispatch({ type: 'UPDATE_SETTINGS', payload: { customPalette: palette, paletteLock: true } });
      whisper("Palette Synthesized", "New neural color ramps applied.", "success");
    } catch (error) {
      console.error("Palette generation failed", error);
      whisper("Synthesis Error", "Failed to extract color essence.", "error");
    }
  }, [whisper]);

  const deleteArt = useCallback(async (id: string) => {
    try {
      const { pixelRepository } = await import('../../data/repository');
      await pixelRepository.deleteArt(id);
      dispatch({ type: 'DELETE_ART', payload: id });
      whisper("Entity Dissolved", "The vision has been returned to the void.", "info");
    } catch (err) {
      whisper("Dissolution Failed", "The entity clings to reality.", "error");
    }
  }, [whisper]);

  const exportAsset = useCallback(async (mode: 'gif' | 'video' | 'png' | 'aseprite' | 'mobile' | 'atlas') => {
    if (!state.activeArt || state.isExporting) return;
    dispatch({ type: 'SET_EXPORTING', payload: true });
    whisper("Export Started", `Preparing ${mode.toUpperCase()} manifest...`, "info");
    try {
      const url = await orchestrator.exportAsset(state.activeArt, state.animationSettings, mode);
      const link = document.createElement('a');
      link.href = url;
      if (mode === 'mobile') {
        link.download = `mobile_bundle_${state.activeArt.id}.zip`;
      } else if (mode === 'atlas') {
        link.download = `atlas_${state.activeArt.id}.zip`;
      } else {
        link.download = mode === 'aseprite' ? `pxl_flux_${state.activeArt.id}.json` : `pxl_export.${mode === 'video' ? 'webm' : mode}`;
      }
      link.click();
      whisper("Export Complete", "Asset manifest successfully manifested.", "success");
    } catch (error) {
      console.error("Export failed", error);
      whisper("Export Ritual Interrupted", "Failed to generate artifact.", "error");
    } finally {
      dispatch({ type: 'SET_EXPORTING', payload: false });
    }
  }, [state.activeArt, state.animationSettings, state.isExporting, whisper]);

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
      deleteArt,
      navigateHistory
    }, 
    refs: { fileInputRef, projectInputRef } 
  };
};
