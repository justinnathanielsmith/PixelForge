
import { useState, useCallback, useEffect } from 'react';
import { 
  GenerationState, 
  PixelStyle, 
  PixelPerspective, 
  AssetCategory, 
  AnimationAction,
  AnimationSettings,
  GeneratedArt
} from '../../domain/entities';
import { orchestrator } from '../../domain/pixelForgeOrchestrator';
import { useToast } from '../context/ToastContext';
import { getSystemDefaults } from './useForgeSettings';

interface UseForgeGeneratorProps {
  settings: AnimationSettings;
  addArt: (art: GeneratedArt) => void;
  updateArt: (art: GeneratedArt) => void;
  updateSettings: (settings: Partial<AnimationSettings>) => void;
}

export const useForgeGenerator = ({ settings, addArt, updateArt, updateSettings }: UseForgeGeneratorProps) => {
  const [prompt, setPrompt] = useState('');
  const [isSpriteSheet, setIsSpriteSheet] = useState(true);
  const [selectedStyle, setSelectedStyle] = useState<PixelStyle>('16-bit');
  const [perspective, setPerspective] = useState<PixelPerspective>('side');
  const [category, setCategory] = useState<AssetCategory>('character');
  const [selectedActions, setSelectedActions] = useState<AnimationAction[]>(['idle']);
  const [genState, setGenState] = useState<GenerationState>(GenerationState.IDLE);
  const [errorMessage, setErrorMessage] = useState('');
  const [inspiration, setInspiration] = useState<{ url: string; data: string; mimeType: string; isRefining?: boolean } | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  
  const { whisper } = useToast();

  // Persist prompt
  useEffect(() => {
     orchestrator.persistSession({ prompt });
  }, [prompt]);

  // Load prompt
  useEffect(() => {
    const load = async () => {
      const session = await orchestrator.loadSession();
      if (session.prompt) setPrompt(session.prompt);
    };
    load();
  }, []);

  const generateArt = useCallback(async (e?: React.FormEvent | Event) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || genState === GenerationState.GENERATING) return;

    setGenState(GenerationState.GENERATING);
    setErrorMessage('');
    whisper("Summoning Entity", "Channeling vision from the scrying pool...", "mana");

    try {
      const art = await orchestrator.summonEntity(
        prompt, isSpriteSheet, selectedStyle, perspective, 
        category, selectedActions, settings,
        inspiration ? { data: inspiration.data, mimeType: inspiration.mimeType } : undefined
      );

      const colorDefaults = getSystemDefaults(selectedStyle);
      
      addArt(art);
      
      // Update settings based on result
      updateSettings({
        rows: art.gridSize!.rows,
        cols: art.gridSize!.cols,
        isPlaying: !settings.batchMode && isSpriteSheet,
        tiledPreview: false,
        panOffset: { x: 0, y: 0 },
        ...colorDefaults
      });

      setGenState(GenerationState.SUCCESS);
      whisper("Transmutation Success", "The entity has materialized in our reality.", "success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown Anomaly';
      setGenState(GenerationState.ERROR);
      setErrorMessage(msg);
      whisper("Ritual Backfire", msg, "error");
    }
  }, [prompt, isSpriteSheet, selectedStyle, perspective, category, selectedActions, settings, inspiration, addArt, updateSettings, genState, whisper]);

  const generateNormalMap = useCallback(async (activeArt: GeneratedArt | null) => {
    if (!activeArt || isExporting) return;
    setIsExporting(true);
    whisper("Alchemist at Work", "Mapping surface geometry...", "mana");
    try {
      const updatedArt = await orchestrator.forgeNormalMap(activeArt);
      updateArt(updatedArt);
      whisper("Normal Map Materialized", "Surface data added to entity.", "success");
    } catch (error) {
      console.error("Normal map generation failed", error);
      whisper("Alchemy Failure", "Could not calculate depth normals.", "error");
    } finally {
      setIsExporting(false);
    }
  }, [isExporting, updateArt, whisper]);

  const generateSkeleton = useCallback(async (activeArt: GeneratedArt | null) => {
    if (!activeArt || isExporting) return;
    setIsExporting(true);
    whisper("Bone Scryer Active", "Analyzing anatomy...", "mana");
    try {
      const updatedArt = await orchestrator.forgeSkeleton(activeArt);
      updateArt(updatedArt);
      whisper("Anatomy Analyzed", "Skeletal joints identified and rigged.", "success");
    } catch (error) {
      console.error("Rigging failed", error);
      whisper("Rigging Anomaly", "Anatomical reasoning failed.", "error");
    } finally {
      setIsExporting(false);
    }
  }, [isExporting, updateArt, whisper]);

  const generatePalette = useCallback(async (palettePrompt: string) => {
    whisper("Neural Ramp Sync", "Generating palette from essence...", "mana");
    try {
      const palette = await orchestrator.forgePalette(palettePrompt);
      updateSettings({ customPalette: palette, paletteLock: true });
      whisper("Palette Synthesized", "New neural color ramps applied.", "success");
    } catch (error) {
      console.error("Palette generation failed", error);
      whisper("Synthesis Error", "Failed to extract color essence.", "error");
    }
  }, [updateSettings, whisper]);

  const exportAsset = useCallback(async (activeArt: GeneratedArt | null, mode: 'gif' | 'video' | 'png' | 'aseprite' | 'mobile' | 'atlas' | 'svg') => {
    if (!activeArt || isExporting) return;
    setIsExporting(true);
    whisper("Export Started", `Preparing ${mode.toUpperCase()} manifest...`, "info");
    try {
      const url = await orchestrator.exportAsset(activeArt, settings, mode);
      const link = document.createElement('a');
      link.href = url;
      if (mode === 'mobile') {
        link.download = `mobile_bundle_${activeArt.id}.zip`;
      } else if (mode === 'atlas') {
        link.download = `atlas_${activeArt.id}.zip`;
      } else if (mode === 'svg') {
        link.download = `pxl_vector_${activeArt.id}.svg`;
      } else {
        link.download = mode === 'aseprite' ? `pxl_flux_${activeArt.id}.json` : `pxl_export.${mode === 'video' ? 'webm' : mode}`;
      }
      link.click();
      whisper("Export Complete", "Asset manifest successfully manifested.", "success");
    } catch (error) {
      console.error("Export failed", error);
      whisper("Export Ritual Interrupted", "Failed to generate artifact.", "error");
    } finally {
      setIsExporting(false);
    }
  }, [settings, isExporting, whisper]);

  const toggleAction = useCallback((action: AnimationAction) => {
    setSelectedActions(prev => 
      prev.includes(action) ? prev.filter(a => a !== action) : [...prev, action]
    );
  }, []);

  return {
    prompt, setPrompt,
    isSpriteSheet, setIsSpriteSheet,
    selectedStyle, setSelectedStyle,
    perspective, setPerspective,
    category, setCategory,
    selectedActions, toggleAction, setSelectedActions,
    genState, errorMessage,
    inspiration, setInspiration,
    isExporting, setIsExporting,
    generateArt,
    generateNormalMap,
    generateSkeleton,
    generatePalette,
    exportAsset
  };
};
