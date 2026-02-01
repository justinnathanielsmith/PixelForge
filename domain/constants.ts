
import { AssetCategory, AnimationAction, PixelPerspective } from './entities';

export const ASSET_CATEGORIES: { id: AssetCategory; label: string; icon: string }[] = [
  { id: 'character', label: 'HERO', icon: '👤' },
  { id: 'enemy', label: 'FOE', icon: '👹' },
  { id: 'icon_set', label: 'ARMORY', icon: '⚔️' },
  { id: 'tileset', label: 'TILE', icon: '🧱' },
  { id: 'tileset_bitmask', label: 'AUTOTILE', icon: '🗺️' },
  { id: 'prop', label: 'PROP', icon: '📦' },
  { id: 'ui_panel', label: 'PANEL', icon: '🖼️' },
  { id: 'background', label: 'SCENE', icon: '🌅' },
];

export const ANIMATION_ACTIONS: { id: AnimationAction; label: string }[] = [
  { id: 'idle', label: 'IDLE' },
  { id: 'walk', label: 'WALK' },
  { id: 'jump', label: 'JUMP' },
  { id: 'attack', label: 'ATK' },
  { id: 'death', label: 'DIE' },
];

export const VIEW_PERSPECTIVES: { id: PixelPerspective; label: string; icon: string }[] = [
  { id: 'side', label: 'SIDE', icon: '↔️' },
  { id: 'isometric', label: 'ISO', icon: '💎' },
  { id: 'top-down', label: 'TOP', icon: '📐' },
];

export const CHROMA_KEY = {
  HEX: '#FF00FF',
  RGB: { r: 255, g: 0, b: 255 },
  LABEL: 'Solid Magenta (#FF00FF)'
};

export const RESOLUTION_PRESETS = [64, 128, 256, 512];

export const EXPORT_CONFIG = {
  DEFAULT_EXTENSION: 'png',
  VIDEO_EXTENSION: 'webm',
  JSON_EXTENSION: 'json',
  MIME_TYPES: {
    png: 'image/png',
    gif: 'image/gif',
    video: 'video/webm',
    aseprite: 'application/json'
  }
};
