import { GeneratedArt, AnimationSettings } from '../domain/entities';
import { ASSET_CATEGORIES, ANIMATION_ACTIONS, VIEW_PERSPECTIVES } from '../domain/constants';

const VALID_IDS = {
  CAT: ASSET_CATEGORIES.map(c => c.id),
  ACT: ANIMATION_ACTIONS.map(a => a.id),
  PER: VIEW_PERSPECTIVES.map(p => p.id),
  STY: ['8-bit', '16-bit', 'gameboy', 'hi-bit'],
  TYPE: ['single', 'spritesheet', 'batch', 'multi-sheet']
};

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
    settings: data.settings || null, // Settings are complex, passing through but could be sanitized similarly
    prompt: typeof data.lastPrompt === 'string' ? data.lastPrompt : (data.prompt || '')
  };
}
