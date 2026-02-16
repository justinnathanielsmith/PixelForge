
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PixelGenService } from '../geminiService';
import { GoogleGenAI } from '@google/genai';

// Mock the dependencies
vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: vi.fn(),
    Type: { OBJECT: 'OBJECT', ARRAY: 'ARRAY', STRING: 'STRING', NUMBER: 'NUMBER' }
  };
});

describe('PixelGenService Security', () => {
  const SENSITIVE_KEY = 'AIzaSyD-SENSITIVE-API-KEY-12345';

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup the mock to throw an error with sensitive info
    (GoogleGenAI as any).mockImplementation(() => ({
      models: {
        generateContent: vi.fn().mockRejectedValue(new Error(`API Error: Invalid key ${SENSITIVE_KEY}`))
      }
    }));
  });

  it('should sanitize sensitive information from error messages', async () => {
    const service = new PixelGenService();

    try {
      await service.generatePixelArt(
        'test prompt', false, '8-bit', 'side', 'character', [], 32, false, false
      );
      // Should not reach here
      expect(true).toBe(false);
    } catch (e: any) {
      // The sensitive key should NOT be in the message anymore
      expect(e.message).not.toContain(SENSITIVE_KEY);
      expect(e.message).toBe("The Oracle could not complete the ritual.");
    }
  });
});
