import { GeneratedArt, AnimationSettings, SliceData, Skeleton } from '../domain/entities';
import { ASSET_CATEGORIES, ANIMATION_ACTIONS, VIEW_PERSPECTIVES, MAX_PROMPT_LENGTH, MAX_HISTORY_ITEMS, MAX_SKELETON_JOINTS, MAX_SKELETON_BONES, MAX_PALETTE_SIZE, ALLOWED_IMPORT_MIME_TYPES } from '../domain/constants';

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

export function validateSliceData(data: any): SliceData | null {
  if (!data || typeof data !== 'object') return null;
  // Check strict type existence for all required fields
  if (typeof data.top === 'number' && !isNaN(data.top) &&
      typeof data.bottom === 'number' && !isNaN(data.bottom) &&
      typeof data.left === 'number' && !isNaN(data.left) &&
      typeof data.right === 'number' && !isNaN(data.right)) {
    return {
      top: data.top,
      bottom: data.bottom,
      left: data.left,
      right: data.right
    };
  }
  return null;
}

export function validateSkeleton(data: any): Skeleton | null {
  if (!data || typeof data !== 'object') return null;
  if (!Array.isArray(data.joints) || !Array.isArray(data.bones)) return null;

  if (data.joints.length > MAX_SKELETON_JOINTS || data.bones.length > MAX_SKELETON_BONES) return null;

  const validJoints = data.joints.every((j: any) =>
    j && typeof j === 'object' &&
    typeof j.id === 'string' &&
    typeof j.x === 'number' && !isNaN(j.x) &&
    typeof j.y === 'number' && !isNaN(j.y) &&
    typeof j.label === 'string'
  );

  const validBones = data.bones.every((b: any) =>
    b && typeof b === 'object' &&
    typeof b.from === 'string' &&
    typeof b.to === 'string'
  );

  if (validJoints && validBones) {
    // Return a clean copy to strip any extra malicious properties
    return {
      joints: data.joints.map((j: any) => ({ id: j.id, x: j.x, y: j.y, label: j.label })),
      bones: data.bones.map((b: any) => ({ from: b.from, to: b.to }))
    };
  }
  return null;
}

export function validatePalette(data: any): {r: number, g: number, b: number}[] | null {
  if (!Array.isArray(data)) return null;
  if (data.length > MAX_PALETTE_SIZE) return null;

  const valid = data.every((c: any) =>
    c && typeof c === 'object' &&
    typeof c.r === 'number' && !isNaN(c.r) &&
    typeof c.g === 'number' && !isNaN(c.g) &&
    typeof c.b === 'number' && !isNaN(c.b)
  );
  if (valid) {
    return data.map((c: any) => ({ r: c.r, g: c.g, b: c.b }));
  }
  return null;
}

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
    const cleanPalette = validatePalette(data.customPalette);
    if (cleanPalette && cleanPalette.length > 0) {
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
           ALLOWED_IMPORT_MIME_TYPES.some(type => item.imageUrl.startsWith(`data:${type}`)) &&
           (item.imageUrl.startsWith('data:image/png;') ||
            item.imageUrl.startsWith('data:image/jpeg;') ||
            item.imageUrl.startsWith('data:image/webp;') ||
            item.imageUrl.startsWith('data:image/gif;')) &&
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

    if (typeof normalMapUrl === 'string' && ALLOWED_IMPORT_MIME_TYPES.some(type => normalMapUrl.startsWith(`data:${type}`))) {
      art.normalMapUrl = normalMapUrl;
    }

    // Validate Complex Objects
    if (skeleton) {
      const validSkeleton = validateSkeleton(skeleton);
      if (validSkeleton) art.skeleton = validSkeleton;
    }

    if (sliceData) {
      const validSlice = validateSliceData(sliceData);
      if (validSlice) art.sliceData = validSlice;
    }

    if (gridSize && typeof gridSize.rows === 'number' && typeof gridSize.cols === 'number') {
        art.gridSize = { rows: gridSize.rows, cols: gridSize.cols };
    }

    // Enforce Prompt Length Limit on individual history items
    art.prompt = art.prompt.slice(0, MAX_PROMPT_LENGTH);

    return art;
  });

  // Enforce History Item Limit to prevent DoS
  const limitedHistory = cleanHistory.slice(0, MAX_HISTORY_ITEMS);

  let validatedPrompt = typeof data.lastPrompt === 'string' ? data.lastPrompt : (data.prompt || '');
  validatedPrompt = validatedPrompt.slice(0, MAX_PROMPT_LENGTH);

  return {
    history: limitedHistory,
    settings: validateAnimationSettings(data.settings),
    prompt: validatedPrompt
  };
}

export function sanitizePrompt(input: string): string {
  if (!input) return "";

  // 1. Enforce length limit
  let sanitized = input.slice(0, MAX_PROMPT_LENGTH);

  // 2. Remove control characters (except newline/tab/carriage return if needed, but here mostly just stripping invisibles)
  // \x00-\x1F matches ASCII control characters (0-31)
  // \x7F matches DEL
  // \x80-\x9F matches Latin-1 Supplement control characters
  sanitized = sanitized.replace(/[\x00-\x1F\x7F-\x9F]/g, " ");

  // 3. Escape backslashes to prevent escaping the closing quote of the template
  sanitized = sanitized.replace(/\\/g, '\\\\');

  // 4. Replace double quotes with single quotes to prevent template breakout
  sanitized = sanitized.replace(/"/g, "'");

  // 5. Trim whitespace
  return sanitized.trim();
}

/**
 * Validates that the file size is within the allowed limit.
 * @param file The file to check.
 * @param maxBytes The maximum allowed size in bytes.
 * @throws Error if the file is too large.
 */
export function validateFileSize(file: File, maxBytes: number): void {
  if (file.size > maxBytes) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    const maxMB = (maxBytes / (1024 * 1024)).toFixed(2);
    throw new Error(`File size (${sizeMB}MB) exceeds the maximum allowed limit of ${maxMB}MB.`);
  }
}

/**
 * Validates that the file MIME type is in the allowed list.
 * @param file The file to check.
 * @param allowedTypes The allowed MIME types (e.g. ['image/png', 'application/json']).
 * @throws Error if the file type is not allowed.
 */
export function validateFileMimeType(file: File, allowedTypes: string[]): void {
  if (!allowedTypes.includes(file.type)) {
    // Basic sanitization of the reported type for safety in error message
    const safeType = (file.type || 'unknown').replace(/[^a-zA-Z0-9\/\-\.]/g, '');
    throw new Error(`File type '${safeType}' is not allowed. Allowed types: ${allowedTypes.join(', ')}`);
  }
}
