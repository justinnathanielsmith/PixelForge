
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PixelRepository } from '../repository';
import { pixelDB } from '../db';

// Mock the pixelDB singleton
vi.mock('../db', () => ({
  pixelDB: {
    putArt: vi.fn(),
    bulkPutArt: vi.fn(),
    putSessionValue: vi.fn(),
    getAllHistory: vi.fn().mockResolvedValue([]),
    getSessionValue: vi.fn().mockResolvedValue(null),
  }
}));

describe('PixelRepository Security Validation', () => {
  let repository: PixelRepository;

  beforeEach(() => {
    repository = new PixelRepository();
    vi.clearAllMocks();
  });

  it('should import valid project data', async () => {
    const validData = {
      history: [
        {
          id: '123',
          imageUrl: 'data:image/png;base64,valid',
          prompt: 'test',
          timestamp: 1234567890,
          type: 'single',
          style: '8-bit',
          perspective: 'isometric',
          category: 'character',
          actions: ['idle']
        }
      ],
      settings: {},
      lastPrompt: 'test prompt'
    };
    const json = JSON.stringify(validData);

    await repository.importProject(json);
    expect(pixelDB.bulkPutArt).toHaveBeenCalledTimes(1);
    expect(pixelDB.bulkPutArt).toHaveBeenCalledWith(validData.history);
  });

  it('should reject invalid art objects in history (Vulnerability Fix Check)', async () => {
      const maliciousData = {
          history: [
              {
                  id: '123',
                  // Missing required fields like imageUrl, type, etc.
                  maliciousField: 'exploit'
              }
          ]
      };
      const json = JSON.stringify(maliciousData);

      try {
        await repository.importProject(json);
      } catch (e) {
        // Validation might throw, which is acceptable
      }

      // The crucial check: bad data should NOT reach the database
      expect(pixelDB.bulkPutArt).not.toHaveBeenCalled();
  });

  it('should strip unknown fields from history items', async () => {
    const dataWithExtra = {
      history: [
        {
          id: '123',
          imageUrl: 'data:image/png;base64,valid',
          prompt: 'test',
          timestamp: 1234567890,
          type: 'single',
          style: '8-bit',
          perspective: 'isometric',
          category: 'character',
          actions: ['idle'],
          dangerousScript: '<script>alert(1)</script>' // Extra field
        }
      ]
    };
    const json = JSON.stringify(dataWithExtra);

    await repository.importProject(json);

    // Should have called bulkPutArt, but with sanitized object
    expect(pixelDB.bulkPutArt).toHaveBeenCalled();
    const calledArg = (pixelDB.bulkPutArt as any).mock.calls[0][0][0];
    expect(calledArg).not.toHaveProperty('dangerousScript');
    expect(calledArg).toHaveProperty('id', '123');
  });
});
