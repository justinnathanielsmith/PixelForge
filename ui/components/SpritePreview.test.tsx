
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import React from 'react';
import SpritePreview from './SpritePreview';
import { imageProcessingService } from '../../data/imageProcessingService';

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
    mousePos: { x: 0, y: 0 },
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

describe('SpritePreview Optimization', () => {
  const defaultProps = {
    activeArt: {
        id: '1', imageUrl: 'test.png', type: 'single',
        createdAt: 0, category: 'character', style: '8-bit',
        prompt: '', settings: {} as any
    },
    settings: {
      rows: 1, cols: 1, fps: 10, isPlaying: true,
      zoom: 1, panOffset: { x: 0, y: 0 },
      targetResolution: 32, aspectRatio: '1:1',
      hue: 0, saturation: 100, contrast: 100, brightness: 100,
      autoTransparency: false, vectorRite: false, paletteLock: false,
      onionSkin: false, tiledPreview: false, showGuides: false,
      customPalette: undefined
    },
    style: '8-bit',
    onUpdateArt: vi.fn(),
    onUpdateSettings: vi.fn(),
  };

  let originalRAF: any;
  let originalImage: any;

  beforeEach(() => {
    vi.clearAllMocks();
    originalRAF = window.requestAnimationFrame;
    // Mock rAF to execute immediately
    window.requestAnimationFrame = (cb) => {
      cb(performance.now());
      return 1;
    };

    originalImage = window.Image;
    window.Image = class {
      onload: any;
      crossOrigin: any;
      src: any;
      width: number = 100;
      height: 100;
      set src(value) {
          setTimeout(() => {
              if (this.onload) this.onload();
          }, 0);
      }
    } as any;

    // Mock Canvas getContext
    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
      clearRect: vi.fn(),
      fillRect: vi.fn(),
      drawImage: vi.fn(),
      createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      fill: vi.fn(),
      arc: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      setLineDash: vi.fn(),
    })) as any;

    (imageProcessingService.processFrame as any).mockImplementation((_img: any, _frame: number, _settings: any, _style: string, targetCanvas: any) => {
        return targetCanvas || document.createElement('canvas');
    });
  });

  afterEach(() => {
    window.requestAnimationFrame = originalRAF;
    window.Image = originalImage;
  });

  it('caches processed frames when non-processing settings change', async () => {
    const { rerender } = render(<SpritePreview {...defaultProps as any} />);

    // Initial render - wait for image load
    await waitFor(() => expect(imageProcessingService.processFrame).toHaveBeenCalledTimes(1));

    // Update panOffset - this triggers renderFrame but should NOT trigger processFrame if cached
    // Changing panOffset changes the 'settings' object reference, so we pass a new object
    const newSettings = {
      ...defaultProps.settings,
      panOffset: { x: 10, y: 10 }
    };

    rerender(<SpritePreview {...defaultProps as any} settings={newSettings} />);

    // We expect it to fail first (2 calls) then pass (1 call).
    // The rerender should synchronously call requestAnimationFrame due to our mock,
    // which calls renderFrame.
    await waitFor(() => expect(imageProcessingService.processFrame).toHaveBeenCalledTimes(1));
  });
});
