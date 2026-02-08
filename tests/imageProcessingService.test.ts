
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { imageProcessingService } from '../data/imageProcessingService';
import { AnimationSettings } from '../domain/entities';

// Mock gifenc to avoid issues with imported dependencies
vi.mock('gifenc', () => ({
  default: {
    quantize: vi.fn(),
    applyPalette: vi.fn(),
  }
}));

describe('ImageProcessingService Optimization', () => {
  let mockCtx: any;
  let mockCanvas: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockCtx = {
      canvas: {},
      clearRect: vi.fn(),
      drawImage: vi.fn(),
      getImageData: vi.fn().mockReturnValue({
        data: new Uint8ClampedArray(400), // 10x10 image
        width: 10,
        height: 10,
      }),
      putImageData: vi.fn(),
    };

    mockCanvas = {
      width: 100,
      height: 100,
      getContext: vi.fn().mockReturnValue(mockCtx),
    };

    // Mock document.createElement
    vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      if (tagName === 'canvas') {
        return mockCanvas;
      }
      return document.createElement(tagName);
    });

    // Mock OffscreenCanvas if it exists or use mockCanvas
    vi.stubGlobal('OffscreenCanvas', class {
      constructor() { return mockCanvas; }
    });
  });

  const baseSettings: AnimationSettings = {
    rows: 1, cols: 1, fps: 10, isPlaying: false,
    zoom: 1, panOffset: { x: 0, y: 0 },
    targetResolution: 32, aspectRatio: '1:1',
    hue: 0, saturation: 100, contrast: 100, brightness: 100,
    autoTransparency: false, vectorRite: false, paletteLock: false,
    onionSkin: false, tiledPreview: false, showGuides: false,
    chromaTolerance: 0, batchMode: false, temporalStability: false,
    gifRepeat: 0, gifDither: false, gifDisposal: 2, customPalette: undefined
  };

  it('skips expensive getImageData/putImageData when no pixel manipulation is needed', () => {
    const source = { width: 32, height: 32 } as any; // Mock source image

    // Ensure all flags are false
    const settings = { ...baseSettings, vectorRite: false, autoTransparency: false, paletteLock: false };

    imageProcessingService.processFrame(source, 0, settings, '8-bit');

    expect(mockCtx.drawImage).toHaveBeenCalled();
    // This assertion expects the OPTIMIZATION to be in place.
    // Initially, this should FAIL because the code currently calls getImageData unconditionally.
    expect(mockCtx.getImageData).not.toHaveBeenCalled();
    expect(mockCtx.putImageData).not.toHaveBeenCalled();
  });

  it('calls getImageData/putImageData when vectorRite is enabled', () => {
    const source = { width: 32, height: 32 } as any;
    const settings = { ...baseSettings, vectorRite: true };

    imageProcessingService.processFrame(source, 0, settings, '8-bit');

    expect(mockCtx.getImageData).toHaveBeenCalled();
    expect(mockCtx.putImageData).toHaveBeenCalled();
  });

  it('calls getImageData/putImageData when autoTransparency is enabled', () => {
    const source = { width: 32, height: 32 } as any;
    const settings = { ...baseSettings, autoTransparency: true };

    imageProcessingService.processFrame(source, 0, settings, '8-bit');

    expect(mockCtx.getImageData).toHaveBeenCalled();
    expect(mockCtx.putImageData).toHaveBeenCalled();
  });

  it('calls getImageData/putImageData when paletteLock is enabled', () => {
    const source = { width: 32, height: 32 } as any;
    const settings = { ...baseSettings, paletteLock: true };

    imageProcessingService.processFrame(source, 0, settings, '8-bit');

    expect(mockCtx.getImageData).toHaveBeenCalled();
    expect(mockCtx.putImageData).toHaveBeenCalled();
  });
});
