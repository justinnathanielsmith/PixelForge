import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PixelGenService } from '../data/geminiService';
import { PixelStyle, PixelPerspective, AssetCategory, AnimationAction } from '../domain/entities';

// Mock the Google GenAI module
const generateContentMock = vi.fn().mockResolvedValue({
  text: JSON.stringify([{r: 0, g: 0, b: 0}]),
  candidates: [{
    finishReason: 'STOP',
    content: {
      parts: [
        { inlineData: { data: 'FAKE_BASE64_IMAGE', mimeType: 'image/png' } }
      ]
    }
  }]
});

vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: vi.fn().mockImplementation(() => ({
      models: {
        generateContent: generateContentMock
      }
    })),
    Type: {
      OBJECT: 'OBJECT',
      ARRAY: 'ARRAY',
      NUMBER: 'NUMBER',
      STRING: 'STRING'
    }
  };
});

describe('PixelGenService Performance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should use cache for duplicate requests (1 API call)', async () => {
    const service = new PixelGenService();
    const args = [
      'test prompt',
      false, // isSpriteSheet
      '8-bit' as PixelStyle,
      'side' as PixelPerspective,
      'character' as AssetCategory,
      ['idle'] as AnimationAction[],
      64, // targetRes
      false, // isBatch
      false, // temporalStability
      '1:1', // aspectRatio
      undefined // inspirationImage
    ] as const;

    // First call: Should hit API
    const result1 = await service.generatePixelArt(...args);

    // Second call: Should hit cache
    const result2 = await service.generatePixelArt(...args);

    expect(generateContentMock).toHaveBeenCalledTimes(1);
    expect(result1).toBe(result2);
  });

  it('should call API again for different requests', async () => {
    const service = new PixelGenService();
    const args1 = [
      'test prompt 1',
      false,
      '8-bit' as PixelStyle,
      'side' as PixelPerspective,
      'character' as AssetCategory,
      ['idle'] as AnimationAction[],
      64,
      false,
      false,
      '1:1',
      undefined
    ] as const;

    const args2 = [
      'test prompt 2', // Different prompt
      false,
      '8-bit' as PixelStyle,
      'side' as PixelPerspective,
      'character' as AssetCategory,
      ['idle'] as AnimationAction[],
      64,
      false,
      false,
      '1:1',
      undefined
    ] as const;

    await service.generatePixelArt(...args1);
    await service.generatePixelArt(...args2);

    expect(generateContentMock).toHaveBeenCalledTimes(2);
  });
});
