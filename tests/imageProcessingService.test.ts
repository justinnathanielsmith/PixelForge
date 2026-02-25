
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

  it('correctly isolates pixels at boundaries without wrapping', () => {
    const width = 4;
    const height = 4;
    const data = new Uint8ClampedArray(width * height * 4);

    // Set (1,1) to Red Opaque (Index 5 in 1D pixel count)
    const i = (1 * width + 1) * 4;
    data[i] = 255;
    data[i+3] = 255;

    // Neighbors are transparent by default (0)

    mockCtx.getImageData.mockReturnValue({
        data,
        width,
        height
    });

    const settings = { ...baseSettings, vectorRite: true, targetResolution: 4, aspectRatio: '1:1' };
    const source = { width: 4, height: 4 } as any;

    imageProcessingService.processFrame(source, 0, settings, '8-bit', undefined, mockCtx);

    expect(mockCtx.putImageData).toHaveBeenCalled();
    const callArg = mockCtx.putImageData.mock.calls[0][0];
    const resultData = callArg.data;

    // (1,1) is isolated, so alpha should be 0
    expect(resultData[i+3]).toBe(0);
  });

  it('does not wrap checks across rows', () => {
     const width = 3;
     const height = 3;
     const data = new Uint8ClampedArray(width * height * 4);

     // Center (1,1) opaque
     const center = (1 * width + 1) * 4;
     data[center+3] = 255;

     // Left neighbor (0,1) opaque
     const left = (1 * width + 0) * 4;
     data[left+3] = 255;

     // Right neighbor (2,1) opaque
     const right = (1 * width + 2) * 4;
     data[right+3] = 255;

     mockCtx.getImageData.mockReturnValue({
        data,
        width,
        height
    });

    const settings = { ...baseSettings, vectorRite: true, targetResolution: 3, aspectRatio: '1:1' };
    const source = { width: 3, height: 3 } as any;

    // Passing mockCtx to ensure we use our mocked context and canvas setup
    imageProcessingService.processFrame(source, 0, settings, '8-bit', undefined, mockCtx);

    const callArg = mockCtx.putImageData.mock.calls[0][0];
    const resultData = callArg.data;

    // Center should NOT be isolated because it has left and right neighbors
    expect(resultData[center+3]).toBe(255);
  });

  it('skips edge pixels (loop padding) preventing wrapping', () => {
    const width = 4;
    const height = 4;
    const data = new Uint8ClampedArray(width * height * 4);

    // Pixel at (0,1) - Left edge. ISOLATED.
    // If loop processed it, it would check neighbors.
    // If wrapping occurred, it might see neighbor at (3,0).
    const i = (1 * width + 0) * 4;
    data[i+3] = 255;

    mockCtx.getImageData.mockReturnValue({
        data,
        width,
        height
    });

    const settings = { ...baseSettings, vectorRite: true, targetResolution: 4, aspectRatio: '1:1' };
    const source = { width: 4, height: 4 } as any;

    imageProcessingService.processFrame(source, 0, settings, '8-bit', undefined, mockCtx);

    const callArg = mockCtx.putImageData.mock.calls[0][0];
    const resultData = callArg.data;

    // (0,1) should be UNTOUCHED because loop starts at x=1.
    expect(resultData[i+3]).toBe(255);
  });
});
