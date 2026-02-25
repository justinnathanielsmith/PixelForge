
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

  describe('Vector Sharpening Logic', () => {
    it('removes isolated pixels and keeps connected ones', () => {
      const width = 5;
      const height = 5;
      const data = new Uint8ClampedArray(width * height * 4);

      // Helper to set pixel color (index based on x, y)
      const setPixel = (x: number, y: number, r: number, g: number, b: number, a: number) => {
        const i = (y * width + x) * 4;
        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
        data[i + 3] = a;
      };

      // Connected pair at (1, 1) and (1, 2)
      setPixel(1, 1, 0, 255, 0, 255); // Green
      setPixel(1, 2, 0, 255, 0, 255); // Green neighbor

      // Isolated pixel at (3, 1)
      setPixel(3, 1, 255, 0, 0, 255); // Red

      // Note: (0,0) etc. are transparent (0)

      // Mock getImageData to return our test data
      mockCtx.getImageData.mockReturnValue({
        data: data,
        width,
        height,
      });

      // Capture putImageData
      let resultData: Uint8ClampedArray | null = null;
      mockCtx.putImageData.mockImplementation((imageData: any) => {
        resultData = imageData.data;
      });

      const settings = { ...baseSettings, vectorRite: true };

      // We need to pass a source with correct dimensions so processFrame uses them
      const source = { width, height } as any;

      imageProcessingService.processFrame(source, 0, settings, '8-bit', mockCanvas, mockCtx);

      expect(mockCtx.putImageData).toHaveBeenCalled();

      // Verify
      if (resultData) {
        const res = resultData as Uint8ClampedArray;

        // Connected (1, 1) should be present
        const i_c1 = (1 * width + 1) * 4;
        expect(res[i_c1 + 3]).toBe(255);

        // Connected (1, 2) should be present
        const i_c2 = (2 * width + 1) * 4;
        expect(res[i_c2 + 3]).toBe(255);

        // Isolated (3, 1) should be removed
        const i_iso = (1 * width + 3) * 4;
        expect(res[i_iso + 3]).toBe(0);
      } else {
        throw new Error('putImageData was not called');
      }
    });
  });
});
