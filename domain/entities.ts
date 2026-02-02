
export type PixelStyle = '8-bit' | '16-bit' | 'gameboy' | 'hi-bit';
export type PixelPerspective = 'side' | 'isometric' | 'top-down';
export type AssetCategory = 'character' | 'enemy' | 'tileset' | 'tileset_bitmask' | 'prop' | 'background' | 'ui_panel' | 'icon_set' | 'projectile' | 'vfx' | 'playing_card';
export type AnimationAction = 'idle' | 'walk' | 'run' | 'jump' | 'fly' | 'attack' | 'talk' | 'hit' | 'death' | 'none';

export interface SliceData {
  top: number;    // In pixels from the top edge
  bottom: number; // In pixels from the bottom edge
  left: number;   // In pixels from the left edge
  right: number;  // In pixels from the right edge
}

export interface Joint {
  id: string;
  x: number; // 0 to 100 relative to sprite width
  y: number; // 0 to 100 relative to sprite height
  label: string;
}

export interface Bone {
  from: string; // Joint ID
  to: string;   // Joint ID
}

export interface Skeleton {
  joints: Joint[];
  bones: Bone[];
}

export interface GeneratedArt {
  id: string;
  imageUrl: string;
  normalMapUrl?: string;
  skeleton?: Skeleton; 
  sliceData?: SliceData;
  prompt: string;
  timestamp: number;
  type: 'single' | 'spritesheet' | 'batch' | 'multi-sheet';
  style: PixelStyle;
  perspective: PixelPerspective;
  category: AssetCategory;
  actions: AnimationAction[]; // Support for multiple actions per sheet
  gridSize?: { rows: number; cols: number };
}

export enum GenerationState {
  IDLE = 'IDLE',
  GENERATING = 'GENERATING',
  ERROR = 'ERROR',
  SUCCESS = 'SUCCESS'
}

export interface AnimationSettings {
  rows: number;
  cols: number;
  fps: number;
  isPlaying: boolean;
  showGuides: boolean;
  tiledPreview: boolean;
  targetResolution: number; // Treated as Height (Vertical Res)
  aspectRatio: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
  paletteLock: boolean;
  autoTransparency: boolean;
  chromaTolerance: number;
  batchMode: boolean;
  zoom: number;
  panOffset: { x: number; y: number };
  onionSkin: boolean;
  hue: number;
  saturation: number;
  contrast: number;
  brightness: number;
  temporalStability: boolean;
  vectorRite: boolean;
  gifRepeat: number; 
  gifDither: boolean; 
  gifDisposal: number;
  customPalette?: { r: number; g: number; b: number }[] | null;
}

export interface PixelForgeState {
  prompt: string;
  isSpriteSheet: boolean;
  selectedStyle: PixelStyle;
  perspective: PixelPerspective;
  category: AssetCategory;
  selectedActions: AnimationAction[]; // Array for multi-sheet generation
  genState: GenerationState;
  history: GeneratedArt[];
  activeArt: GeneratedArt | null;
  errorMessage: string;
  isExporting: boolean;
  inspiration: { url: string; data: string; mimeType: string; isRefining?: boolean } | null;
  animationSettings: AnimationSettings;
}

export type PixelForgeIntent =
  | { type: 'SET_PROMPT'; payload: string }
  | { type: 'SET_SPRITE_SHEET'; payload: boolean }
  | { type: 'SET_STYLE'; payload: PixelStyle }
  | { type: 'SET_PERSPECTIVE'; payload: PixelPerspective }
  | { type: 'SET_CATEGORY'; payload: AssetCategory }
  | { type: 'TOGGLE_ACTION'; payload: AnimationAction }
  | { type: 'SUMMON_START' }
  | { type: 'SUMMON_SUCCESS'; payload: GeneratedArt }
  | { type: 'SUMMON_FAILURE'; payload: string }
  | { type: 'SET_ACTIVE_ART'; payload: GeneratedArt }
  | { type: 'UPDATE_ART'; payload: GeneratedArt }
  | { type: 'DELETE_ART'; payload: string }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<AnimationSettings> }
  | { type: 'SET_INSPIRATION'; payload: { url: string; data: string; mimeType: string; isRefining?: boolean } | null }
  | { type: 'SET_EXPORTING'; payload: boolean }
  | { type: 'PIN_DESIGN'; payload: GeneratedArt }
  | { type: 'SET_HISTORY'; payload: GeneratedArt[] }
  | { type: 'IMPORT_PROJECT'; payload: { history: GeneratedArt[], settings: AnimationSettings | null, prompt: string } };
