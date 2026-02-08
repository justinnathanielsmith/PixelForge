import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PixelGenService } from '../geminiService';
import { GoogleGenAI } from '@google/genai';

vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: vi.fn().mockImplementation(() => ({
      models: {
        generateContent: vi.fn().mockResolvedValue({
          candidates: [
            {
              finishReason: 'STOP',
              content: {
                parts: [{ inlineData: { data: 'fake-image-data' } }]
              }
            }
          ]
        })
      }
    })),
    Type: { OBJECT: 'OBJECT', ARRAY: 'ARRAY', STRING: 'STRING', NUMBER: 'NUMBER' }
  };
});

describe('PixelGenService', () => {
  let originalEnv: any;

  beforeEach(() => {
    vi.clearAllMocks();
    originalEnv = { ...import.meta.env };
  });

  afterEach(() => {
    // Cannot easily restore import.meta.env if it's read-only
  });

  it('should initialize GoogleGenAI when accessing the API', async () => {
    const service = new PixelGenService();

    // Trigger the lazy initialization
    try {
      await service.generatePixelArt(
        'test prompt',
        false,
        '8-bit',
        'side',
        'character',
        [],
        32,
        false,
        false
      );
    } catch (e) {
      // Ignore errors from the mock if any
    }

    expect(GoogleGenAI).toHaveBeenCalled();
  });

  it('should warn if VITE_GEMINI_API_KEY is missing in DEV mode', async () => {
    const consoleSpy = vi.spyOn(console, 'warn');

    // We can't easily mock import.meta.env.VITE_GEMINI_API_KEY here because it's baked in or read-only.
    // However, if it's undefined in the test environment (which it is by default), we should see the warning
    // IF import.meta.env.DEV is true (which it usually is in tests).

    const service = new PixelGenService();

    try {
      await service.generatePixelArt(
        'test prompt',
        false,
        '8-bit',
        'side',
        'character',
        [],
        32,
        false,
        false
      );
    } catch (e) {}

    // In test environment, DEV is usually true. And VITE_GEMINI_API_KEY is undefined.
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('VITE_GEMINI_API_KEY is not set'));
  });
});
