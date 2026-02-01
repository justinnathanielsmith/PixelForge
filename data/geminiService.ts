import { GoogleGenAI, Content, Part, Type } from "@google/genai";
import { PixelStyle, PixelPerspective, AssetCategory, AnimationAction, Skeleton } from "../domain/entities";

export class PixelGenService {
  async generatePixelArt(
    prompt: string, 
    isSpriteSheet: boolean, 
    style: PixelStyle, 
    perspective: PixelPerspective,
    category: AssetCategory,
    actions: AnimationAction[],
    targetRes: number, 
    isBatch: boolean,
    temporalStability: boolean,
    inspirationImage?: { data: string, mimeType: string }
  ): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = 'gemini-3-pro-image-preview';
    
    let stylePersona = "";
    switch (style) {
      case '8-bit':
        stylePersona = "STYLE: 8-bit, limited color palette, flat colors, strictly aliased. Master System / NES vibe.";
        break;
      case '16-bit':
        stylePersona = "STYLE: 16-bit retro game style, detailed shading, black outlines, vibrant. SNES / Mega Drive vibe.";
        break;
      case 'gameboy':
        stylePersona = "STYLE: 4-color olive green palette, high contrast, chunky retro pixels. DMG Gameboy vibe.";
        break;
      case 'hi-bit':
        stylePersona = "STYLE: Modern high-fidelity pixel art, 32-bit color depth, smooth but grid-aligned. Modern Indie vibe.";
        break;
    }

    const categoryDirective = `SUBJECT: ${category} sprite. ${perspective === 'isometric' ? 'Isometric 2.5D view.' : 'Orthographic side-view.'}`;

    let layoutInstruction = "";
    if (isBatch) {
      layoutInstruction = "LAYOUT: 2x2 grid containing 4 distinct design variations of the same prompt.";
    } else if (isSpriteSheet && actions.length > 0) {
        if (actions.length === 1) {
            const frameCount = temporalStability ? 32 : 16;
            const grid = temporalStability ? "8x4" : "4x4";
            layoutInstruction = `LAYOUT: ${grid} sprite sheet (${frameCount} frames). Depict a ${actions[0].toUpperCase()} loop. Continuous animation flow across cells.`;
        } else {
            // MULTI-SHEET LOGIC
            layoutInstruction = `LAYOUT: MULTI-ACTION SPRITE ATLAS.
            - Total of ${actions.length} animation rows.
            - Each row contains a 4-frame or 8-frame loop of a specific action.
            - Rows in order: ${actions.map(a => a.toUpperCase()).join(", ")}.
            - Maintain perfect character design and color consistency across all actions.
            - Grid-aligned character placement.`;
        }
    } else {
        layoutInstruction = "LAYOUT: A single isolated entity centered in the frame. Static showcase pose.";
    }

    const strategyDirectives = `
      CORE_DIRECTIVES:
      - Pixel art style, video game sprite.
      - Isolated and centered on a Solid Magenta (#FF00FF) background for easy masking.
      - Crisp, sharp edges. NO anti-aliasing. NO gradients. NO soft brushes.
      - High readability for 2D game engines.
      - RESOLUTION_TARGET: Each individual frame should have detail consistent with a ${targetRes}x${targetRes} grid.
    `;

    const basePrompt = `[PIXEL_FORGE_IMAGEN_3_PRO]
         PROMPT: "${prompt}", professional pixel art, game assets.
         ${stylePersona}
         ${categoryDirective}
         ${layoutInstruction}
         ${strategyDirectives}
    `;

    const parts: Part[] = [{ text: basePrompt }];
    
    if (inspirationImage) {
      parts.unshift({
        inlineData: { data: inspirationImage.data, mimeType: inspirationImage.mimeType }
      });
    }

    const contents: Content = { parts };

    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config: { 
          imageConfig: { 
            aspectRatio: "1:1",
            imageSize: "1K" 
          } 
        }
      });
      
      const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
      
      if (!part?.inlineData?.data) {
        throw new Error("The Scrying Pool returned no imagery.");
      }
      
      return `data:image/png;base64,${part.inlineData.data}`;
    } catch (error: any) {
      console.error("FORGE_EXCEPTION:", error);
      throw error;
    }
  }

  async generateNormalMap(imageBase64: string): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = 'gemini-3-pro-image-preview';

    const prompt = `
      TASK: Generate a TANGENT SPACE NORMAL MAP for the provided pixel art sprite.
      INPUT: A pixel art sprite sheet or single sprite.
      OUTPUT RULES:
      1. EXACT same layout, grid, and resolution as the input.
      2. COLOR CODING: Standard Tangent Space Normal Map (R=X, G=Y, B=Z). 
      3. BACKGROUND: Pure flat background where there is no geometry.
      4. STYLE: Retain pixelated grid alignment.
    `;

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const parts: Part[] = [
      { inlineData: { data: cleanBase64, mimeType: 'image/png' } },
      { text: prompt }
    ];

    try {
      const response = await ai.models.generateContent({
        model,
        contents: { parts },
        config: { imageConfig: { aspectRatio: "1:1", imageSize: "1K" } }
      });

      const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
      if (!part?.inlineData?.data) throw new Error("ALCHEMIST_FAIL: Normal map generation failed.");
      return `data:image/png;base64,${part.inlineData.data}`;
    } catch (error) {
      console.error("ALCHEMY_EXCEPTION:", error);
      throw error;
    }
  }

  async generateSkeleton(imageBase64: string, category: AssetCategory): Promise<Skeleton> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = 'gemini-3-pro-preview';

    const prompt = `
      TASK: Perform anatomical rigging analysis on this pixel art entity.
      CATEGORY: ${category}
      OBJECTIVE: Identify major skeletal joints and their hierarchy (bones).
      
      INSTRUCTIONS:
      1. Define joints with IDs, labels, and X/Y coordinates (0-100% relative to image bounds).
      2. Analyze the FIRST FRAME of the entity.
      3. Connect joints logically (e.g., hip to knee, shoulder to elbow).
      4. Return ONLY the JSON object.

      Labels to use for ${category}:
      - Character/Enemy: root, spine, neck, head, shoulder_l, shoulder_r, elbow_l, elbow_r, hand_l, hand_r, hip_l, hip_r, knee_l, knee_r, foot_l, foot_r.
      - Prop/Object: center, top, bottom, base.
    `;

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    try {
      const response = await ai.models.generateContent({
        model,
        contents: {
          parts: [
            { inlineData: { data: cleanBase64, mimeType: 'image/png' } },
            { text: prompt }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              joints: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    label: { type: Type.STRING },
                    x: { type: Type.NUMBER },
                    y: { type: Type.NUMBER }
                  },
                  required: ["id", "label", "x", "y"]
                }
              },
              bones: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    from: { type: Type.STRING },
                    to: { type: Type.STRING }
                  },
                  required: ["from", "to"]
                }
              }
            },
            required: ["joints", "bones"]
          }
        }
      });

      const json = JSON.parse(response.text || "{}");
      return json as Skeleton;
    } catch (error) {
      console.error("RIGGING_EXCEPTION:", error);
      throw error;
    }
  }
}

export const pixelGenService = new PixelGenService();
