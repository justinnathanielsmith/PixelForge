
import React, { useRef, useMemo, useCallback } from 'react';
import { orchestrator } from '../../domain/pixelForgeOrchestrator';
import { useToast } from '../context/ToastContext';
import { PixelForgeState, PixelForgeIntent } from '../../domain/entities';
import { MAX_PROMPT_LENGTH, MAX_UPLOAD_SIZE_BYTES, MAX_PROJECT_UPLOAD_SIZE_BYTES } from '../../domain/constants';
import { validateFileSize, validateFileMimeType } from '../../utils/validation';
import { useForgeSettings } from './useForgeSettings';
import { useForgeHistory } from './useForgeHistory';
import { useForgeGenerator } from './useForgeGenerator';

export const usePixelForge = () => {
  // 1. Settings Hook
  const { settings, updateSettings } = useForgeSettings();
  
  // 2. History Hook
  const { 
    history, activeArt, setActiveArt, addArt, updateArt, deleteArt, navigateHistory, setFullHistory 
  } = useForgeHistory();

  // 3. Generator Hook
  const {
    prompt, setPrompt,
    isSpriteSheet, setIsSpriteSheet,
    selectedStyle, setSelectedStyle,
    perspective, setPerspective,
    category, setCategory,
    selectedActions, toggleAction, setSelectedActions,
    genState, errorMessage,
    inspiration, setInspiration,
    isExporting, setIsExporting,
    generateArt, generateNormalMap, generateSkeleton, generatePalette, exportAsset
  } = useForgeGenerator({
    settings,
    addArt,
    updateArt,
    updateSettings
  });

  const { whisper } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const projectInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      validateFileSize(file, MAX_UPLOAD_SIZE_BYTES);
      validateFileMimeType(file, ['image/png', 'image/jpeg', 'image/webp', 'image/gif']);
    } catch (err: any) {
      whisper("Oracle Link Error", err.message, "error");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setInspiration({ url: URL.createObjectURL(file), data: result.split(',')[1], mimeType: file.type });
      whisper("Oracle Link Established", "Inspiration image channeled successfully.", "mana");
    };
    reader.onerror = () => {
      whisper("Oracle Link Error", "Failed to read the inspiration image.", "error");
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsDataURL(file);
  };

  const handleProjectImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      validateFileSize(file, MAX_PROJECT_UPLOAD_SIZE_BYTES);
      // Not validating mime type for project files as extensions/MIME types can vary widely
    } catch (err: any) {
      whisper("Grimoire Import Error", err.message, "error");
      if (projectInputRef.current) projectInputRef.current.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const result = await orchestrator.importProjectFile(reader.result as string);
        setFullHistory(result.history);
        if (result.prompt) setPrompt(result.prompt);
        if (result.settings) updateSettings(result.settings);
        whisper("Grimoire Restored", "Project history and settings re-materialized.", "success");
      } catch (err) {
        console.error("Project import failure", err);
        whisper("Nether-Void Error", "Failed to decode project file.", "error");
      }
    };
    reader.onerror = () => {
       whisper("Grimoire Import Error", "Failed to read the project file.", "error");
       if (projectInputRef.current) projectInputRef.current.value = "";
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
      setTimeout(() => URL.revokeObjectURL(url), 100);
      whisper("Project Saved", "The Grimoire has been archived as a .forge file.", "success");
    } catch (err) {
      console.error("Project export failure", err);
      whisper("Save Ritual Interrupted", "Mana depletion or storage failure.", "error");
    }
  };

  // Synthesize legacy State object for App compatibility
  const state: PixelForgeState = {
    prompt,
    isSpriteSheet,
    selectedStyle,
    perspective,
    category,
    selectedActions,
    genState,
    history,
    activeArt,
    errorMessage,
    isExporting,
    inspiration,
    animationSettings: settings
  };

  // Dispatch Facade for App compatibility
  const dispatch = useCallback((intent: PixelForgeIntent) => {
    switch (intent.type) {
      case 'SET_PROMPT':
        setPrompt(intent.payload.slice(0, MAX_PROMPT_LENGTH));
        break;
      case 'SET_SPRITE_SHEET': setIsSpriteSheet(intent.payload); break;
      case 'SET_STYLE': setSelectedStyle(intent.payload); break;
      case 'SET_PERSPECTIVE': setPerspective(intent.payload); break;
      case 'SET_CATEGORY': setCategory(intent.payload); break;
      case 'TOGGLE_ACTION': toggleAction(intent.payload); break;
      // 'SUMMON_START', 'SUMMON_SUCCESS', 'SUMMON_FAILURE' are handled internally by generateArt
      case 'SET_ACTIVE_ART': setActiveArt(intent.payload); break;
      case 'UPDATE_ART': updateArt(intent.payload); break;
      case 'DELETE_ART': deleteArt(intent.payload); break;
      case 'UPDATE_SETTINGS': updateSettings(intent.payload); break;
      case 'SET_INSPIRATION': setInspiration(intent.payload); break;
      case 'SET_EXPORTING': setIsExporting(intent.payload); break;
      case 'PIN_DESIGN': {
        const design = intent.payload;
        setPrompt(design.prompt.slice(0, MAX_PROMPT_LENGTH));
        setSelectedStyle(design.style);
        setPerspective(design.perspective);
        setCategory(design.category);
        setInspiration({ url: design.imageUrl, data: design.imageUrl.split(',')[1], mimeType: 'image/png', isRefining: true });
        break;
      }
      case 'SET_HISTORY': setFullHistory(intent.payload); break;
      case 'IMPORT_PROJECT': {
        const payload = intent.payload;
        setFullHistory(payload.history);
        setPrompt(payload.prompt.slice(0, MAX_PROMPT_LENGTH));
        if (payload.settings) updateSettings(payload.settings);
        break;
      }
    }
  }, [
    setPrompt,
    setIsSpriteSheet,
    setSelectedStyle,
    setPerspective,
    setCategory,
    toggleAction,
    setActiveArt,
    updateArt,
    deleteArt,
    updateSettings,
    setInspiration,
    setIsExporting,
    setFullHistory
  ]);

  // Actions object for cleaner usage in App
  const actions = useMemo(() => ({
    generateArt,
    handleImageUpload,
    handleProjectImport,
    exportProject,
    exportAsset: (mode: any) => exportAsset(activeArt, mode),
    generateNormalMap: () => generateNormalMap(activeArt),
    generateSkeleton: () => generateSkeleton(activeArt),
    generatePalette,
    deleteArt,
    navigateHistory
  }), [
    generateArt, handleImageUpload, handleProjectImport, exportProject, exportAsset, activeArt,
    generateNormalMap, generateSkeleton, generatePalette, deleteArt, navigateHistory
  ]);

  return {
    state,
    dispatch,
    actions,
    refs: { fileInputRef, projectInputRef }
  };
};
