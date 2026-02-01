
import { GoogleGenAI, Content, Part } from "@google/genai";
import { PixelStyle, PixelPerspective, AssetCategory, AnimationAction } from "../types";

export class PixelGenService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async generatePixelArt(
    prompt: string, 
    isSpriteSheet: boolean, 
    style: PixelStyle, 
    perspective: PixelPerspective,
    category: AssetCategory,
    action: AnimationAction,
    targetRes: number, 
    isBatch: boolean,
    inspirationImage?: { data: string, mimeType: string }
  ): Promise<string> {
    const model = 'gemini-2.5-flash-image';
    
    let stylePersona = "";
    // Fix: Using updated PixelStyle values to match the exported type definition
    switch (style) {
      case '8-bit':
        stylePersona = "ROLE: NES Graphics Chip (2C02). LIMITS: 54-color palette, 3 colors per sprite. STYLE: Flat shading, strictly 8-bit chunky pixels.";
        break;
      case '16-bit':
        stylePersona = "ROLE: SNES PPU. LIMITS: 15-bit color. STYLE: 16-bit pixel art, manual dithering, black outlines, vibrant classic RPG feel.";
        break;
      case 'hi-bit':
        stylePersona = "ROLE: Modern Indie Game Artist. STYLE: Hi-bit pixel art (32-bit), smooth silhouettes, rich non-restrictive colors.";
        break;
      case 'gameboy':
        stylePersona = "ROLE: Sandbox RPG Artist. STYLE: 1-pixel constant black outline, saturated blocks, high contrast separation.";
        break;
    }

    let categoryDirective = "";
    switch (category) {
      case 'character':
      case 'enemy':
        categoryDirective = "SUBJECT: Game Sprite. FOCUS: Iconic silhouette, readable pose, clear facial/directional features.";
        break;
      case 'tileset':
        categoryDirective = "SUBJECT: Seamless Tile. FOCUS: Perfect 4-way loop. Uniform lighting. Tileable environment texture.";
        break;
      case 'background':
        categoryDirective = "SUBJECT: Parallax Layer. FOCUS: Atmospheric, muted tones, lower detail to prevent foreground clashing.";
        break;
      case 'prop':
        categoryDirective = "SUBJECT: Item Prop. FOCUS: High icon readability, centered, distinct material texture (wood, metal, stone).";
        break;
    }

    const resInstruction = `PIXEL_DENSITY: Target is exactly ${targetRes}x${targetRes} pixels per frame. DO NOT use sub-pixels. Use a crisp grid.`;

    let contentInstruction = "";
    if (isBatch) {
      contentInstruction = `BREEDING_RITE: Generate a 2x2 grid containing 4 unique variations of the entity. 
      - Each of the 4 quadrants must be a distinct design variation (different gear, colors, or slight pose changes).
      - Maintain the same thematic essence across all 4.
      - Each variation is a single static portrait perfectly centered in its quadrant.`;
    } else if (isSpriteSheet && action !== 'none') {
        const frames = 16;
        contentInstruction = `ANIMATION_PROTOCOL: Create a ${frames}-frame sequence in a 4x4 grid. 
        ACTION: ${action.toUpperCase()} loop.
        - Frame 1 is the starting pose.
        - Frames progress left-to-right then top-to-bottom.
        - Maintain pixel-perfect consistency of colors and shapes across frames.
        - Grounded alignment: The entity should stay centered in each grid cell.`;
    } else {
        contentInstruction = `SINGLE_ENTITY: Static pose, perfectly centered in the frame.`;
    }

    const technicalConstraints = `
      RENDER_CONSTRAINTS:
      1. NO ANTI-ALIASING. Pixels must be sharp squares.
      2. NO BLUR. NO BLOOM. NO HALOS.
      3. BACKGROUND: Pure Solid Magenta (#FF00FF).
      4. PERSPECTIVE: ${perspective === 'isometric' ? '2.5D Isometric' : 'Orthographic Side-View'}.
    `;

    const basePrompt = `[ASSET_FORGE_V3]
         ${stylePersona}
         ${categoryDirective}
         ${resInstruction}
         ${contentInstruction}
         ${technicalConstraints}
         INPUT_MANTRA: "${prompt}"`;

    const parts: Part[] = [{ text: basePrompt }];
    
    if (inspirationImage) {
      parts.unshift({
        inlineData: { data: inspirationImage.data, mimeType: inspirationImage.mimeType }
      });
    }

    const contents: Content = { parts };

    try {
      const response = await this.ai.models.generateContent({
        model,
        contents,
        config: { imageConfig: { aspectRatio: "1:1" } }
      });
      
      const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
      
      if (!part?.inlineData?.data) {
        throw new Error("VOID_ERROR: Scrying pool failed to materialize image.");
      }
      
      return `data:image/png;base64,${part.inlineData.data}`;
    } catch (error) {
      console.error("FORGE_EXCEPTION:", error);
      throw error;
    }
  }
}

export const pixelGenService = new PixelGenService();
