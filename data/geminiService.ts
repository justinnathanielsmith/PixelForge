
import { GoogleGenAI, Content, Part, Type } from "@google/genai";
import { PixelStyle, PixelPerspective, AssetCategory, AnimationAction, Skeleton, SliceData } from "../domain/entities";
import { assembleForgePrompt } from "../domain/promptTemplates";

export class PixelGenService {
  private _ai: GoogleGenAI | null = null;

  private get ai(): GoogleGenAI {
    if (!this._ai) {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey && import.meta.env.DEV) {
        console.warn("VITE_GEMINI_API_KEY is not set. Pixel generation features will fail.");
      }
      this._ai = new GoogleGenAI({ apiKey: apiKey || "" });
    }
    return this._ai;
  }

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
    aspectRatio: string = "1:1",
    inspirationImage?: { data: string, mimeType: string }
  ): Promise<string> {
    const model = 'gemini-3-pro-image-preview';
    
    const basePrompt = assembleForgePrompt({
      prompt,
      style,
      perspective,
      category,
      actions,
      isSpriteSheet,
      isBatch,
      targetRes,
      temporalStability
    });

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
        config: { 
          imageConfig: { 
            aspectRatio: aspectRatio,
            imageSize: "1K" 
          } 
        }
      });
      
      if (response.candidates?.[0]?.finishReason === 'SAFETY') {
        throw new Error("The Oracle refused this vision due to safety constraints.");
      }

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

  async generateSliceData(imageBase64: string, targetResolution: number): Promise<SliceData> {
    const model = 'gemini-3-pro-preview';

    const prompt = `
      TASK: Analyze this UI panel and define 9-slice coordinates.
      INPUT: A pixel art UI component.
      GRID_RESOLUTION: ${targetResolution}
      
      OBJECTIVE: Identify the top, bottom, left, and right margins where the corners end and the repeating/scaling edges begin.
      Margins should be in pixels relative to the base resolution of ${targetResolution}.
      
      INSTRUCTIONS:
      1. Return ONLY the JSON object.
      2. Ensure margins are balanced if the panel is symmetrical.
      3. Margins usually range from 2 to ${Math.floor(targetResolution / 4)} pixels.
    `;

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    try {
      const response = await this.ai.models.generateContent({
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
              top: { type: Type.NUMBER },
              bottom: { type: Type.NUMBER },
              left: { type: Type.NUMBER },
              right: { type: Type.NUMBER }
            },
            required: ["top", "bottom", "left", "right"]
          }
        }
      });

      if (response.candidates?.[0]?.finishReason === 'SAFETY') {
        throw new Error("The Oracle refused to slice this pattern due to safety constraints.");
      }

      const json = JSON.parse(response.text || "{}");
      return json as SliceData;
    } catch (error) {
      console.error("SLICE_EXCEPTION:", error);
      // Fallback: 25% margins
      const fallback = Math.floor(targetResolution / 4);
      return { top: fallback, bottom: fallback, left: fallback, right: fallback };
    }
  }

  async generateNormalMap(imageBase64: string): Promise<string> {
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
      const response = await this.ai.models.generateContent({
        model,
        contents: { parts },
        config: { imageConfig: { aspectRatio: "1:1", imageSize: "1K" } }
      });

      if (response.candidates?.[0]?.finishReason === 'SAFETY') {
        throw new Error("The Oracle refused to map this surface due to safety constraints.");
      }

      const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
      if (!part?.inlineData?.data) throw new Error("ALCHEMIST_FAIL: Normal map generation failed.");
      return `data:image/png;base64,${part.inlineData.data}`;
    } catch (error) {
      console.error("ALCHEMY_EXCEPTION:", error);
      throw error;
    }
  }

  async generateSkeleton(imageBase64: string, category: AssetCategory): Promise<Skeleton> {
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
      const response = await this.ai.models.generateContent({
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

      if (response.candidates?.[0]?.finishReason === 'SAFETY') {
        throw new Error("The Oracle refused to rig this entity due to safety constraints.");
      }

      const json = JSON.parse(response.text || "{}");
      return json as Skeleton;
    } catch (error) {
      console.error("RIGGING_EXCEPTION:", error);
      throw error;
    }
  }

  async generatePalette(prompt: string): Promise<{r: number, g: number, b: number}[]> {
    const model = 'gemini-3-flash-preview';

    const systemPrompt = `
      TASK: Generate a color palette based on a material description.
      OUTPUT: JSON Array of RGB objects.
      CONSTRAINT: Create a coherent gradient/ramp useful for pixel art shading (dark to light).
      COUNT: 4 to 8 colors.
    `;

    try {
      const response = await this.ai.models.generateContent({
        model,
        contents: {
          parts: [{ text: `${systemPrompt}\nDESCRIPTION: ${prompt}` }]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                r: { type: Type.NUMBER },
                g: { type: Type.NUMBER },
                b: { type: Type.NUMBER }
              },
              required: ["r", "g", "b"]
            }
          }
        }
      });

      if (response.candidates?.[0]?.finishReason === 'SAFETY') {
        throw new Error("Palette generation refused due to safety.");
      }

      const json = JSON.parse(response.text || "[]");
      return json;
    } catch (error) {
      console.error("PALETTE_EXCEPTION:", error);
      throw error;
    }
  }
}

export const pixelGenService = new PixelGenService();
