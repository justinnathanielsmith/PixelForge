export type PixelStyle = '8-bit' | '16-bit' | 'gameboy' | 'hi-bit';
export type PixelPerspective = 'side' | 'isometric' | 'top-down';
export type AssetCategory = 'character' | 'enemy' | 'tileset' | 'prop' | 'background';
export type AnimationAction = 'idle' | 'walk' | 'jump' | 'attack' | 'death' | 'none';

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
  targetResolution: number;
  paletteLock: boolean;
  autoTransparency: boolean;
  chromaTolerance: number;
  batchMode: boolean;
  zoom: number;
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
  | { type: 'UPDATE_SETTINGS'; payload: Partial<AnimationSettings> }
  | { type: 'SET_INSPIRATION'; payload: { url: string; data: string; mimeType: string; isRefining?: boolean } | null }
  | { type: 'SET_EXPORTING'; payload: boolean }
  | { type: 'PIN_DESIGN'; payload: GeneratedArt };
