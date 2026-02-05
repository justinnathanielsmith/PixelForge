import { GeneratedArt, AnimationSettings } from '../domain/entities';
import { ASSET_CATEGORIES, ANIMATION_ACTIONS, VIEW_PERSPECTIVES } from '../domain/constants';

const VALID_IDS = {
  CAT: ASSET_CATEGORIES.map(c => c.id),
  ACT: ANIMATION_ACTIONS.map(a => a.id),
  PER: VIEW_PERSPECTIVES.map(p => p.id),
  STY: ['8-bit', '16-bit', 'gameboy', 'hi-bit'],
  TYPE: ['single', 'spritesheet', 'batch', 'multi-sheet']
};

const DEFAULT_SETTINGS: AnimationSettings = {
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

function validateAnimationSettings(data: any): AnimationSettings | null {
  if (!data || typeof data !== 'object') return null;

  // Start with defaults to ensure all fields are present and typed correctly
  const settings: AnimationSettings = { ...DEFAULT_SETTINGS };

  // Helper to safely assign number
  const assignNum = (key: keyof AnimationSettings) => {
    if (typeof data[key] === 'number' && !isNaN(data[key])) {
      (settings as any)[key] = data[key];
    }
  };

  // Helper to safely assign boolean
  const assignBool = (key: keyof AnimationSettings) => {
    if (typeof data[key] === 'boolean') {
      (settings as any)[key] = data[key];
    }
  };

  assignNum('rows');
  assignNum('cols');
  assignNum('fps');
  assignBool('isPlaying');
  assignBool('showGuides');
  assignBool('tiledPreview');
  assignNum('targetResolution');

  if (typeof data.aspectRatio === 'string' && ['1:1', '16:9', '9:16', '4:3', '3:4'].includes(data.aspectRatio)) {
    settings.aspectRatio = data.aspectRatio;
  }

  assignBool('paletteLock');
  assignBool('autoTransparency');
  assignNum('chromaTolerance');
  assignBool('batchMode');
  assignNum('zoom');

  if (data.panOffset && typeof data.panOffset === 'object' &&
      typeof data.panOffset.x === 'number' && typeof data.panOffset.y === 'number') {
    settings.panOffset = { x: data.panOffset.x, y: data.panOffset.y };
  }

  assignBool('onionSkin');
  assignNum('hue');
  assignNum('saturation');
  assignNum('contrast');
  assignNum('brightness');
  assignBool('temporalStability');
  assignBool('vectorRite');
  assignNum('gifRepeat');
  assignBool('gifDither');
  assignNum('gifDisposal');

  if (Array.isArray(data.customPalette)) {
    const cleanPalette = data.customPalette.filter((c: any) =>
      c && typeof c === 'object' &&
      typeof c.r === 'number' && typeof c.g === 'number' && typeof c.b === 'number'
    ).map((c: any) => ({ r: c.r, g: c.g, b: c.b }));

    if (cleanPalette.length > 0) {
      settings.customPalette = cleanPalette;
    }
  }

  return settings;
}

export function validateImportedProject(data: any): { history: GeneratedArt[], settings: AnimationSettings | null, prompt: string } {
  if (!data || typeof data !== 'object') throw new Error("Invalid project file.");
  if (!data.history || !Array.isArray(data.history)) throw new Error("Invalid project: Missing history array.");

  const cleanHistory = data.history.filter((item: any) => {
    return typeof item.id === 'string' &&
           typeof item.imageUrl === 'string' &&
           typeof item.prompt === 'string' &&
           VALID_IDS.STY.includes(item.style) &&
           VALID_IDS.PER.includes(item.perspective) &&
           VALID_IDS.CAT.includes(item.category) &&
           VALID_IDS.TYPE.includes(item.type) &&
           Array.isArray(item.actions);
  }).map((item: any) => {
    const { id, imageUrl, prompt, timestamp, type, style, perspective, category, actions, normalMapUrl, skeleton, sliceData, gridSize } = item;

    // Explicit whitelist reconstruction to strip unknown/dangerous fields
    const art: GeneratedArt = {
      id,
      imageUrl,
      prompt,
      timestamp: Number(timestamp) || Date.now(),
      type,
      style,
      perspective,
      category,
      actions: actions.filter((a:any) => VALID_IDS.ACT.includes(a))
    };

    if (typeof normalMapUrl === 'string') art.normalMapUrl = normalMapUrl;
    // Basic structure checks for complex objects
    if (skeleton && Array.isArray(skeleton.joints) && Array.isArray(skeleton.bones)) art.skeleton = skeleton;
    if (sliceData && typeof sliceData.top === 'number') art.sliceData = sliceData;
    if (gridSize && typeof gridSize.rows === 'number') art.gridSize = gridSize;

    return art;
  });

  return {
    history: cleanHistory,
    settings: validateAnimationSettings(data.settings),
    prompt: typeof data.lastPrompt === 'string' ? data.lastPrompt : (data.prompt || '')
  };
}
