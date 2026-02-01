import { describe, it, expect } from 'vitest';
import { DEFAULT_SETTINGS } from './useForgeSettings';

describe('PixelForge Configuration', () => {
  it('should have valid default settings', () => {
    expect(DEFAULT_SETTINGS).toBeDefined();
    expect(DEFAULT_SETTINGS.rows).toBe(4);
    expect(DEFAULT_SETTINGS.cols).toBe(4);
    expect(DEFAULT_SETTINGS.fps).toBe(8);
    expect(DEFAULT_SETTINGS.targetResolution).toBe(32);
  });
});