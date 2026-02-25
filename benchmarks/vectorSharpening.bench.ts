import { bench, describe, vi } from 'vitest';
import { imageProcessingService } from '../data/imageProcessingService';
import { AnimationSettings } from '../domain/entities';

// Setup Mock Canvas environment
const width = 100;
const height = 100;
const dataSize = width * height * 4;
const mockData = new Uint8ClampedArray(dataSize);

// Fill with random data
// Use a fixed seed-like approach for consistency if possible, but Math.random is fine for bench
for (let i = 0; i < dataSize; i += 4) {
    // Random color
    mockData[i] = Math.floor(Math.random() * 256);
    mockData[i+1] = Math.floor(Math.random() * 256);
    mockData[i+2] = Math.floor(Math.random() * 256);

    // Random alpha with distribution:
    // 40% transparent (0)
    // 40% opaque (255)
    // 20% semi-transparent (1-254)
    const r = Math.random();
    if (r < 0.4) mockData[i+3] = 0;
    else if (r < 0.8) mockData[i+3] = 255;
    else mockData[i+3] = Math.floor(Math.random() * 254) + 1;
}

const mockContext = {
  drawImage: vi.fn(),
  clearRect: vi.fn(),
  getImageData: vi.fn(() => ({
      data: new Uint8ClampedArray(mockData), // Return copy to avoid mutation affecting next runs
      width,
      height
  })),
  putImageData: vi.fn(),
  canvas: { width, height },
} as unknown as CanvasRenderingContext2D;

const mockCanvas = {
  width,
  height,
  getContext: vi.fn(() => mockContext),
} as unknown as HTMLCanvasElement;

(mockContext as any).canvas = mockCanvas;

vi.stubGlobal('document', {
  createElement: vi.fn(() => mockCanvas),
});

vi.stubGlobal('Image', class {
  width = width;
  height = height;
});

const settings: AnimationSettings = {
  rows: 1, cols: 1, fps: 10, isPlaying: false, showGuides: false,
  tiledPreview: false, targetResolution: width, aspectRatio: '1:1',
  paletteLock: false, autoTransparency: false, chromaTolerance: 0,
  batchMode: false, zoom: 1, panOffset: { x: 0, y: 0 },
  onionSkin: false, hue: 0, saturation: 100, contrast: 100, brightness: 100,
  temporalStability: false,
  vectorRite: true, // ENABLED
  gifRepeat: 0, gifDither: false, gifDisposal: 2, customPalette: undefined
};

const source = { width, height } as HTMLImageElement;

describe('Vector Sharpening Performance', () => {
  bench('applyVectorSharpening', () => {
    imageProcessingService.processFrame(source, 0, settings, '8-bit');
  });
});
