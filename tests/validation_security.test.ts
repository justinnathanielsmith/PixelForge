
import { describe, it, expect } from 'vitest';
import { validateSliceData, validateSkeleton, validatePalette } from '../utils/validation';

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
  });
});
