
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useForgeCanvas } from './useForgeCanvas';
import { AnimationSettings } from '../../domain/entities';

// Mock dependencies
vi.mock('../../data/imageProcessingService', () => ({
  imageProcessingService: {
    getFrameDimensions: vi.fn().mockReturnValue({ width: 512, height: 512 }),
  },
}));

const mockSettings: AnimationSettings = {
  rows: 1, cols: 1, fps: 10, isPlaying: false,
  zoom: 1, panOffset: { x: 0, y: 0 },
  targetResolution: 512, aspectRatio: '1:1',
  hue: 0, saturation: 100, contrast: 100, brightness: 100,
  autoTransparency: false, vectorRite: false, paletteLock: false,
  onionSkin: false, tiledPreview: false, showGuides: false,
  chromaTolerance: 0,
  batchMode: false,
  temporalStability: false,
  gifRepeat: 0,
  gifDither: false,
  gifDisposal: 2
};

describe('useForgeCanvas Hook', () => {
  let mockUpdateSettings: any;
  let mockOnUpdateImage: any;

  beforeEach(() => {
    mockUpdateSettings = vi.fn();
    mockOnUpdateImage = vi.fn();
  });

  const setupHook = (shouldTrackMouse = false) => {
     const { result } = renderHook(() => useForgeCanvas({
      settings: mockSettings,
      updateSettings: mockUpdateSettings,
      imageUrl: 'test.png',
      onUpdateImage: mockOnUpdateImage,
      shouldTrackMouse
    }));

    // Mock canvas
    const canvas = document.createElement('canvas');
    vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({
      left: 0, top: 0, width: 512, height: 512, right: 512, bottom: 512, x: 0, y: 0, toJSON: () => {}
    });
    (result.current.canvasRef as any).current = canvas;

    return result;
  };

  it('should NOT update mousePos by default (optimization)', () => {
    const result = setupHook(false); // Default

    const initialPos = result.current.mousePos;

    act(() => {
      const mockEvent = { clientX: 100, clientY: 100, preventDefault: vi.fn() } as unknown as React.MouseEvent;
      result.current.handleMouseMove(mockEvent, 0, null);
    });

    expect(result.current.mousePos).toEqual(initialPos); // Should NOT change
  });

  it('should update mousePos when shouldTrackMouse is true', () => {
    const result = setupHook(true);

    act(() => {
      const mockEvent = { clientX: 100, clientY: 100, preventDefault: vi.fn() } as unknown as React.MouseEvent;
      result.current.handleMouseMove(mockEvent, 0, null);
    });

    expect(result.current.mousePos).toEqual({ x: 100, y: 100 });
  });

  it('should update mousePos when tool is active', () => {
    const result = setupHook(false);

    // Activate tool
    act(() => {
      result.current.setTool('pencil');
    });

    act(() => {
      const mockEvent = { clientX: 50, clientY: 50, preventDefault: vi.fn() } as unknown as React.MouseEvent;
      result.current.handleMouseMove(mockEvent, 0, null);
    });

    expect(result.current.mousePos).toEqual({ x: 50, y: 50 });
  });

  it('should update mousePos when panning', () => {
    const result = setupHook(false);

    // Start panning
    act(() => {
        const mockDown = { clientX: 0, clientY: 0, button: 1, preventDefault: vi.fn() } as unknown as React.MouseEvent;
        result.current.handleMouseDown(mockDown, false, 0, null);
    });

    act(() => {
      const mockEvent = { clientX: 50, clientY: 50, preventDefault: vi.fn() } as unknown as React.MouseEvent;
      result.current.handleMouseMove(mockEvent, 0, null);
    });

    expect(result.current.mousePos).toEqual({ x: 50, y: 50 });
  });
});
