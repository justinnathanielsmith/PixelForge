
import { describe, it, expect } from 'vitest';
import { validateSliceData, validateSkeleton, validatePalette, validateImportedProject } from '../utils/validation';
import { MAX_SKELETON_JOINTS, MAX_SKELETON_BONES, MAX_PALETTE_SIZE } from '../domain/constants';

describe('Sentinel Security Validation', () => {

  describe('validateSliceData', () => {
    it('should accept valid slice data', () => {
      const input = { top: 10, bottom: 10, left: 5, right: 5 };
      expect(validateSliceData(input)).toEqual(input);
    });

    it('should reject non-numeric values', () => {
      const input = { top: "10", bottom: 10, left: 5, right: 5 };
      expect(validateSliceData(input)).toBeNull();
    });

    it('should reject missing properties', () => {
      const input = { top: 10, bottom: 10 };
      expect(validateSliceData(input)).toBeNull();
    });

    it('should reject extra malicious properties', () => {
      const input = { top: 10, bottom: 10, left: 5, right: 5, malicious: "script" };
      const result = validateSliceData(input);
      expect(result).toEqual({ top: 10, bottom: 10, left: 5, right: 5 });
      expect((result as any).malicious).toBeUndefined();
    });
  });

  describe('validateSkeleton', () => {
    const validSkeleton = {
      joints: [{ id: 'root', x: 50, y: 50, label: 'Root' }],
      bones: [{ from: 'root', to: 'head' }]
    };

    it('should accept valid skeleton', () => {
      expect(validateSkeleton(validSkeleton)).toEqual(validSkeleton);
    });

    it('should reject skeleton with invalid joints', () => {
      const input = {
        joints: [{ id: 'root', x: "50", y: 50, label: 'Root' }], // x is string
        bones: []
      };
      expect(validateSkeleton(input)).toBeNull();
    });

    it('should reject skeleton with invalid bones', () => {
      const input = {
        joints: [],
        bones: [{ from: 123, to: 'head' }] // from is number
      };
      expect(validateSkeleton(input)).toBeNull();
    });

    it('should strip extra properties from joints', () => {
      const input = {
        joints: [{ id: 'root', x: 50, y: 50, label: 'Root', onClick: 'alert(1)' }],
        bones: []
      };
      const result = validateSkeleton(input);
      expect(result?.joints[0]).toEqual({ id: 'root', x: 50, y: 50, label: 'Root' });
      expect((result?.joints[0] as any).onClick).toBeUndefined();
    });

    it('should reject skeleton exceeding MAX_SKELETON_JOINTS', () => {
      const joints = Array(MAX_SKELETON_JOINTS + 1).fill({ id: 'j', x: 0, y: 0, label: 'J' });
      const input = {
        joints,
        bones: []
      };
      expect(validateSkeleton(input)).toBeNull();
    });

    it('should reject skeleton exceeding MAX_SKELETON_BONES', () => {
      const bones = Array(MAX_SKELETON_BONES + 1).fill({ from: 'a', to: 'b' });
      const input = {
        joints: [],
        bones
      };
      expect(validateSkeleton(input)).toBeNull();
    });
  });

  describe('validatePalette', () => {
    it('should accept valid palette', () => {
      const input = [{ r: 255, g: 0, b: 0 }];
      expect(validatePalette(input)).toEqual(input);
    });

    it('should reject non-array input', () => {
      expect(validatePalette({})).toBeNull();
    });

    it('should reject invalid color objects', () => {
      const input = [{ r: 255, g: 0 }]; // missing b
      expect(validatePalette(input)).toBeNull();
    });

    it('should reject non-numeric color values', () => {
      const input = [{ r: 255, g: "0", b: 0 }];
      expect(validatePalette(input)).toBeNull();
    });

    it('should reject palette exceeding MAX_PALETTE_SIZE', () => {
      const input = Array(MAX_PALETTE_SIZE + 1).fill({ r: 0, g: 0, b: 0 });
      expect(validatePalette(input)).toBeNull();
    });
  });

  describe('validateImportedProject', () => {
    const validArt = {
      id: '123',
      imageUrl: 'data:image/png;base64,valid',
      prompt: 'test',
      timestamp: 1234567890,
      type: 'single',
      style: '8-bit',
      perspective: 'isometric',
      category: 'character',
      actions: ['idle']
    };

    it('should accept valid data URL', () => {
      const input = {
        history: [validArt],
        settings: {}
      };
      const result = validateImportedProject(input);
      expect(result.history.length).toBe(1);
    });

    it('should reject http URL in imageUrl', () => {
      const input = {
        history: [{ ...validArt, imageUrl: 'http://malicious.com/pixel.png' }],
        settings: {}
      };
      const result = validateImportedProject(input);
      expect(result.history.length).toBe(0);
    });

    it('should reject javascript URL in imageUrl', () => {
      const input = {
        history: [{ ...validArt, imageUrl: 'javascript:alert(1)' }],
        settings: {}
      };
      const result = validateImportedProject(input);
      expect(result.history.length).toBe(0);
    });

    it('should strip invalid normalMapUrl', () => {
      const input = {
        history: [{ ...validArt, normalMapUrl: 'http://malicious.com/normal.png' }],
        settings: {}
      };
      const result = validateImportedProject(input);
      expect(result.history[0].normalMapUrl).toBeUndefined();
    });

    it('should accept valid normalMapUrl', () => {
      const input = {
        history: [{ ...validArt, normalMapUrl: 'data:image/png;base64,normal' }],
        settings: {}
      };
      const result = validateImportedProject(input);
      expect(result.history[0].normalMapUrl).toBe('data:image/png;base64,normal');
    });
  });
});
