import { PixelStyle, PixelPerspective, AssetCategory, AnimationAction } from "./entities";
import { CHROMA_KEY } from "./constants";

export const getStylePersona = (style: PixelStyle): string => {
  switch (style) {
    case '8-bit':
      return "STYLE: 8-bit, limited color palette, flat colors, strictly aliased. Master System / NES vibe.";
    case '16-bit':
      return "STYLE: 16-bit retro game style, detailed shading, black outlines, vibrant. SNES / Mega Drive vibe.";
    case 'gameboy':
      return "STYLE: 4-color olive green palette, high contrast, chunky retro pixels. DMG Gameboy vibe.";
    case 'hi-bit':
      return "STYLE: Modern high-fidelity pixel art, 32-bit color depth, smooth but grid-aligned. Modern Indie vibe.";
    default:
      return "";
  }
};

export const getPerspectiveText = (perspective: PixelPerspective): string => {
  switch (perspective) {
    case 'isometric':
      return "Isometric 2.5D view.";
    case 'top-down':
      return "Top-down orthographic view (Zelda/RPG/Tactics style). Camera looking down at approx 45-60 degrees.";
    default:
      return "Orthographic side-view.";
  }
};

export const getCategoryDirective = (category: AssetCategory, perspectiveText: string): string => {
  if (category === 'ui_panel') {
    return `
      SUBJECT: UI Panel/Frame component for mobile/desktop.
      FOCUS: Symmetrical borders, distinct corners, and a tileable center area.
      REQUIREMENT: The inner content area must be solid or a simple repeating pattern suitable for 9-slicing. 
      STYLE: Clear 9-slice structure. Ensure corners do not exceed 25% of the total width/height.
    `;
  }
  return `SUBJECT: ${category} sprite. ${perspectiveText}`;
};

export const getLayoutInstruction = (
  isBatch: boolean, 
  isSpriteSheet: boolean, 
  actions: AnimationAction[], 
  temporalStability: boolean
): string => {
  if (isBatch) {
    return "LAYOUT: 2x2 grid containing 4 distinct design variations of the same prompt.";
  } 
  
  if (isSpriteSheet && actions.length > 0) {
    if (actions.length === 1) {
      const frameCount = temporalStability ? 32 : 16;
      const grid = temporalStability ? "8x4" : "4x4";
      return `LAYOUT: ${grid} sprite sheet (${frameCount} frames). Depict a ${actions[0].toUpperCase()} loop. Continuous animation flow across cells.`;
    } else {
      return `LAYOUT: MULTI-ACTION SPRITE ATLAS.
      - Total of ${actions.length} animation rows.
      - Each row contains a 4-frame or 8-frame loop of a specific action.
      - Rows in order: ${actions.map(a => a.toUpperCase()).join(", ")}.
      - Maintain perfect character design and color consistency across all actions.
      - Grid-aligned character placement.`;
    }
  }
  
  return "LAYOUT: A single isolated entity centered in the frame. Static showcase pose.";
};

export const getCoreDirectives = (targetRes: number): string => `
  CORE_DIRECTIVES:
  - Pixel art style, video game sprite.
  - Isolated and centered on a ${CHROMA_KEY.LABEL} background for easy masking.
  - Crisp, sharp edges. NO anti-aliasing. NO gradients. NO soft brushes.
  - High readability for 2D game engines.
  - RESOLUTION_TARGET: Each individual frame should have detail consistent with a ${targetRes}x${targetRes} grid.
`;

export const assembleForgePrompt = (params: {
  prompt: string;
  style: PixelStyle;
  perspective: PixelPerspective;
  category: AssetCategory;
  actions: AnimationAction[];
  isSpriteSheet: boolean;
  isBatch: boolean;
  targetRes: number;
  temporalStability: boolean;
}): string => {
  const stylePersona = getStylePersona(params.style);
  const perspectiveText = getPerspectiveText(params.perspective);
  const categoryDirective = getCategoryDirective(params.category, perspectiveText);
  const layoutInstruction = getLayoutInstruction(params.isBatch, params.isSpriteSheet, params.actions, params.temporalStability);
  const strategyDirectives = getCoreDirectives(params.targetRes);

  return `[PIXEL_FORGE_IMAGEN_3_PRO]
     PROMPT: "${params.prompt}", professional pixel art, game assets.
     ${stylePersona}
     ${categoryDirective}
     ${layoutInstruction}
     ${strategyDirectives}
  `;
};
