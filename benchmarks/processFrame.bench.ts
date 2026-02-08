
import { bench, describe, vi } from 'vitest';
import { imageProcessingService } from '../data/imageProcessingService';
import { AnimationSettings } from '../domain/entities';

// Mock Canvas environment for node/jsdom
const mockContext = {
  drawImage: vi.fn(),
  clearRect: vi.fn(),
  getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4096), width: 32, height: 32 })),
  putImageData: vi.fn(),
  canvas: {},
} as unknown as CanvasRenderingContext2D;

const mockCanvas = {
  width: 32,
  height: 32,
  getContext: vi.fn(() => {
     // Simulate context creation/lookup cost
     // In real browsers, this is not free
     for(let i=0; i<10000; i++) {};
     return mockContext;
  }),
} as unknown as HTMLCanvasElement;

// Circular reference for context.canvas
(mockContext as any).canvas = mockCanvas;

// Mock document.createElement
vi.stubGlobal('document', {
  createElement: vi.fn(() => {
     // Simulate allocation cost
     // Creating a DOM element is expensive
     for(let i=0; i<10000; i++) {};
     return mockCanvas;
  }),
});

// Mock Image
vi.stubGlobal('Image', class {
  width = 32;
  height = 32;
});

const settings: AnimationSettings = {
  rows: 1,
  cols: 1,
  fps: 10,
  isPlaying: false,
  showGuides: false,
  tiledPreview: false,
  targetResolution: 32,
  aspectRatio: '1:1',
  paletteLock: false,
  autoTransparency: false,
  chromaTolerance: 0,
  batchMode: false,
  zoom: 1,
  panOffset: { x: 0, y: 0 },
  onionSkin: false,
  hue: 0,
  saturation: 100,
  contrast: 100,
  brightness: 100,
  temporalStability: false,
  vectorRite: false,
  gifRepeat: 0,
  gifDither: false,
  gifDisposal: 2
};

const source = { width: 32, height: 32 } as HTMLImageElement;

// Create reusable context
const reusableCanvas = imageProcessingService.createCanvas(32, 32);
const reusableCtx = reusableCanvas.getContext('2d') as CanvasRenderingContext2D;

describe('processFrame Performance', () => {
  bench('without reusable context', () => {
    imageProcessingService.processFrame(source, 0, settings, '8-bit');
  });

  bench('with reusable context', () => {
    // Pass undefined for targetCanvas, and reusableCtx for targetCtx
    imageProcessingService.processFrame(source, 0, settings, '8-bit', undefined, reusableCtx);
  });
});
