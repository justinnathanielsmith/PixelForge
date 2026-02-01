
import { 
  GeneratedArt, 
  PixelForgeState, 
  AnimationSettings, 
  PixelStyle, 
  PixelPerspective, 
  AssetCategory, 
  AnimationAction 
} from './entities';
import { pixelGenService } from '../data/geminiService';
import { exportService } from '../data/exportService';
import { pixelRepository } from '../data/repository';

export class PixelForgeOrchestrator {
  async summonEntity(
    prompt: string,
    isSpriteSheet: boolean,
    style: PixelStyle,
    perspective: PixelPerspective,
    category: AssetCategory,
    actions: AnimationAction[],
    settings: AnimationSettings,
    inspiration?: { data: string; mimeType: string }
  ): Promise<GeneratedArt> {
    const imageUrl = await pixelGenService.generatePixelArt(
      prompt,
      isSpriteSheet,
      style,
      perspective,
      category,
      actions,
      settings.targetResolution,
      settings.batchMode,
      settings.temporalStability,
      settings.aspectRatio,
      inspiration
    );

    let gridSize = { rows: 1, cols: 1 };
    let type: GeneratedArt['type'] = 'single';

    if (settings.batchMode) {
      gridSize = { rows: 2, cols: 2 };
      type = 'batch';
    } else if (category === 'tileset_bitmask') {
      gridSize = { rows: 3, cols: 3 };
      type = 'spritesheet';
    } else if (category === 'icon_set') {
      gridSize = { rows: 4, cols: 4 };
      type = 'spritesheet';
    } else if (isSpriteSheet && actions.length > 0) {
      if (actions.length === 1) {
        gridSize = settings.temporalStability ? { rows: 4, cols: 8 } : { rows: 4, cols: 4 };
        type = 'spritesheet';
      } else {
        // Multi-Action Sheet: 4 frames per action row
        gridSize = { rows: actions.length, cols: 4 };
        type = 'multi-sheet';
      }
    }

    let sliceData;
    if (category === 'ui_panel') {
      try {
        sliceData = await pixelGenService.generateSliceData(imageUrl, settings.targetResolution);
      } catch (e) {
        console.error("Slice generation failure", e);
      }
    }

    const newArt: GeneratedArt = {
      id: Date.now().toString(),
      imageUrl,
      prompt,
      timestamp: Date.now(),
      type,
      style,
      perspective,
      category,
      actions: actions.length > 0 ? actions : ['none'],
      gridSize,
      sliceData
    };

    await pixelRepository.saveArt(newArt);
    return newArt;
  }

  async forgeNormalMap(art: GeneratedArt): Promise<GeneratedArt> {
    const normalMapUrl = await pixelGenService.generateNormalMap(art.imageUrl);
    const updatedArt = { ...art, normalMapUrl };
    await pixelRepository.updateArt(updatedArt);
    return updatedArt;
  }

  async forgeSkeleton(art: GeneratedArt): Promise<GeneratedArt> {
    const skeleton = await pixelGenService.generateSkeleton(art.imageUrl, art.category);
    const updatedArt = { ...art, skeleton };
    await pixelRepository.updateArt(updatedArt);
    return updatedArt;
  }

  async forgePalette(prompt: string): Promise<{r: number, g: number, b: number}[]> {
    return await pixelGenService.generatePalette(prompt);
  }

  async exportAsset(
    art: GeneratedArt,
    settings: AnimationSettings,
    mode: 'gif' | 'video' | 'png' | 'aseprite' | 'mobile' | 'atlas'
  ): Promise<string> {
    switch (mode) {
      case 'png':
        return await exportService.exportToPng(art.imageUrl, settings, art.style);
      case 'gif':
        return await exportService.exportToGif(art.imageUrl, settings, art.style);
      case 'video':
        return await exportService.exportToVideo(art.imageUrl, settings, art.style);
      case 'aseprite':
        return await exportService.exportAsepriteData(art, settings);
      case 'mobile':
        return await exportService.exportMobileBundle(art, settings);
      case 'atlas':
        return await exportService.exportLittleKTAtlas(art, settings);
      default:
        throw new Error("DOMAIN_ERROR: Unknown export medium.");
    }
  }

  async loadInitialHistory(): Promise<GeneratedArt[]> {
    return await pixelRepository.getHistory();
  }

  async loadSession(): Promise<{ settings: AnimationSettings | null, prompt: string }> {
    return await pixelRepository.loadSession();
  }

  async persistSession(state: Partial<PixelForgeState>): Promise<void> {
    await pixelRepository.saveSession(state);
  }

  async exportProjectFile(): Promise<string> {
    const data = await pixelRepository.exportProject();
    const blob = new Blob([data], { type: 'application/json' });
    return URL.createObjectURL(blob);
  }

  async importProjectFile(json: string): Promise<{ history: GeneratedArt[], settings: AnimationSettings | null, prompt: string }> {
    return await pixelRepository.importProject(json);
  }
}

export const orchestrator = new PixelForgeOrchestrator();
