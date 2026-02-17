
import React from 'react';
import { render, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import SpritePreview from './SpritePreview';
import { AnimationSettings, GeneratedArt } from '../../domain/entities';

// Mock dependencies
vi.mock('../../data/imageProcessingService', () => ({
  imageProcessingService: {
    processFrame: vi.fn(),
    getFrameDimensions: vi.fn().mockReturnValue({ width: 32, height: 32 }),
  },
}));

vi.mock('../hooks/useForgeCanvas', () => ({
  useForgeCanvas: () => ({
    canvasRef: { current: document.createElement('canvas') },
    containerRef: { current: document.createElement('div') },
    mousePos: { x: 10, y: 10 },
    isPanning: false,
    tool: 'none',
    setTool: vi.fn(),
    brushColor: '#000000',
    setBrushColor: vi.fn(),
    handleWheel: vi.fn(),
    handleMouseDown: vi.fn(),
    handleMouseMove: vi.fn(),
    handleMouseUp: vi.fn(),
  }),
}));

const mockActiveArt: GeneratedArt = {
  id: '1', imageUrl: 'test.png', type: 'single',
  timestamp: 0, category: 'character', style: '8-bit',
  perspective: 'side', actions: ['idle'],
  prompt: 'test prompt',
  normalMapUrl: 'normal.png'
};

const mockSettings: AnimationSettings = {
  rows: 1, cols: 2, fps: 10, isPlaying: true,
  zoom: 1, panOffset: { x: 0, y: 0 },
  targetResolution: 32, aspectRatio: '1:1',
  hue: 0, saturation: 100, contrast: 100, brightness: 100,
  autoTransparency: false, vectorRite: false, paletteLock: false,
  onionSkin: false, tiledPreview: false, showGuides: false,
  customPalette: undefined,
  chromaTolerance: 0,
  batchMode: false,
  temporalStability: false,
  gifRepeat: 0,
  gifDither: false,
  gifDisposal: 2
};

describe('SpritePreview Lighting Performance', () => {
  let originalRAF: any;
  let rafCallbacks: FrameRequestCallback[] = [];
  let getImageDataSpy: any;
  let putImageDataSpy: any;
  let mockContext: any;
  let OriginalImage: any;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    rafCallbacks = [];
    originalRAF = window.requestAnimationFrame;
    window.requestAnimationFrame = vi.fn((cb) => {
      rafCallbacks.push(cb);
      return 1;
    });

    // Mock Image to fire onload immediately
    OriginalImage = window.Image;
    window.Image = class {
      onload: any;
      crossOrigin: any;
      set src(value) {
        this._src = value;
        setTimeout(() => {
            if (this.onload) this.onload();
        }, 1);
      }
      get src() { return this._src; }
      _src: any;
    } as any;

    getImageDataSpy = vi.fn(() => ({
      data: new Uint8ClampedArray(4 * 32 * 32).fill(255),
      width: 32, height: 32
    }));
    putImageDataSpy = vi.fn();

    mockContext = {
      canvas: { width: 32, height: 32 },
      clearRect: vi.fn(),
      fillRect: vi.fn(),
      drawImage: vi.fn(),
      getImageData: getImageDataSpy,
      putImageData: putImageDataSpy,
      createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      setLineDash: vi.fn(),
    };

    HTMLCanvasElement.prototype.getContext = vi.fn(() => mockContext) as any;
  });

  afterEach(() => {
    window.requestAnimationFrame = originalRAF;
    window.Image = OriginalImage;
    vi.useRealTimers();
  });

  it('should cache lighting calculations when returning to previously rendered frames', async () => {
    const { getByText } = render(
      <SpritePreview
        activeArt={mockActiveArt}
        settings={mockSettings}
        style="8-bit"
        onUpdateArt={vi.fn()}
        onUpdateSettings={vi.fn()}
        normalMapUrl="normal.png"
      />
    );

    // Wait for Image onload (setTimeout 1)
    act(() => {
        vi.advanceTimersByTime(10);
    });

    // Enable Lighting Mode
    const igniteBtn = getByText(/Ignite/i);
    fireEvent.click(igniteBtn);

    // Run pending RAF (Initial Render - Frame 0)
    act(() => {
      rafCallbacks.forEach(cb => cb(performance.now()));
      rafCallbacks = [];
    });

    // Check initial calls (Frame 0 first time)
    const callsFrame0_First = getImageDataSpy.mock.calls.length;

    // Advance to Frame 1 (100ms)
    act(() => {
      vi.advanceTimersByTime(100);
    });
    // Run RAF for Frame 1
    act(() => {
      rafCallbacks.forEach(cb => cb(performance.now()));
      rafCallbacks = [];
    });

    const callsFrame1_First = getImageDataSpy.mock.calls.length;
    expect(callsFrame1_First).toBeGreaterThan(callsFrame0_First); // Should increase

    // Advance to Frame 0 (Back to start - 100ms)
    act(() => {
      vi.advanceTimersByTime(100);
    });
    // Run RAF for Frame 0 (Second time)
    act(() => {
      rafCallbacks.forEach(cb => cb(performance.now()));
      rafCallbacks = [];
    });

    const callsFrame0_Second = getImageDataSpy.mock.calls.length;

    // WITHOUT Optimization: Should increase again (same amount as first time)
    // WITH Optimization: Should NOT increase (or increase less if some overhead)

    const diffFirst = callsFrame1_First - callsFrame0_First;
    const diffSecond = callsFrame0_Second - callsFrame1_First;

    // Expectation for SUCCESS (Optimized): diffSecond should be 0 (cache hit)
    expect(diffSecond).toBe(0);
  });
});
