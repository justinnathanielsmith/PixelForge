
import React, { useState, useCallback } from 'react';
import { render, act } from '@testing-library/react';
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

const mockActiveArt: GeneratedArt = {
  id: '1', imageUrl: 'test.png', type: 'single',
  timestamp: 0, category: 'character', style: '8-bit',
  perspective: 'side', actions: ['idle'],
  prompt: 'test prompt'
};

const mockSettings: AnimationSettings = {
  rows: 1, cols: 1, fps: 10, isPlaying: false,
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

// Wrapper component to simulate App's behavior
const TestWrapper = ({ onRenderSpy, useStableCallback }: { onRenderSpy: any, useStableCallback: boolean }) => {
  const [prompt, setPrompt] = useState('initial'); // Unrelated state causing parent re-render

  // Stable callback simulating optimized App.tsx
  const handleUpdateArtStable = useCallback((updatedArt: GeneratedArt) => {}, []);

  // Unstable callback simulating current App.tsx (recreated on every render)
  const handleUpdateArtUnstable = (updatedArt: GeneratedArt) => {};

  // Stable onUpdateSettings (mocking App.tsx's useCallback)
  const handleUpdateSettings = useCallback(() => {}, []);

  return (
    <div>
      <button onClick={() => setPrompt('updated')} aria-label="Update Prompt">Update Prompt</button>
      <React.Profiler id="SpritePreview" onRender={onRenderSpy}>
        <SpritePreview
          activeArt={mockActiveArt}
          settings={mockSettings}
          style="8-bit"
          onUpdateArt={useStableCallback ? handleUpdateArtStable : handleUpdateArtUnstable}
          onUpdateSettings={handleUpdateSettings}
        />
      </React.Profiler>
    </div>
  );
};

/**
 * ⚡ Bolt Performance Test:
 * Verifies that SpritePreview uses React.memo effectively.
 *
 * Impact: Prevents expensive re-renders when parent state (like prompt input) changes
 * but SpritePreview props remain stable.
 *
 * Baseline (Unoptimized): 3 renders (Mount + Effect + Parent Update)
 * Optimized: 2 renders (Mount + Effect + Parent Update Skipped)
 */
describe('SpritePreview Re-render Performance', () => {
  let originalRAF: any;

  beforeEach(() => {
    vi.clearAllMocks();
    originalRAF = window.requestAnimationFrame;
    window.requestAnimationFrame = (cb) => { cb(performance.now()); return 1; };

    // Mock Canvas context
    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
      clearRect: vi.fn(),
      fillRect: vi.fn(),
      drawImage: vi.fn(),
      getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4) })),
      putImageData: vi.fn(),
    })) as any;
  });

  afterEach(() => {
    window.requestAnimationFrame = originalRAF;
  });

  it('should re-render when parent passes unstable callback (current behavior)', () => {
    const onRenderSpy = vi.fn();
    const { getByText } = render(<TestWrapper onRenderSpy={onRenderSpy} useStableCallback={false} />);

    // Initial render
    expect(onRenderSpy).toHaveBeenCalledTimes(1);

    // Trigger parent re-render
    act(() => {
      getByText('Update Prompt').click();
    });

    // Should re-render because callback prop changed
    // 1 (mount) + 1 (internal effect) + 1 (parent update) = 3
    expect(onRenderSpy).toHaveBeenCalledTimes(3);
  });

  it('should skip re-render when parent passes stable callback AND component is memoized', () => {
    const onRenderSpy = vi.fn();
    const { getByText } = render(<TestWrapper onRenderSpy={onRenderSpy} useStableCallback={true} />);

    // Initial render
    expect(onRenderSpy).toHaveBeenCalledTimes(1);

    // Trigger parent re-render
    act(() => {
      getByText('Update Prompt').click();
    });

    // If optimized (memo + stable callback), this should stay 1.
    // Before optimization, it will be 2 even with stable callback because SpritePreview isn't memoized.
    // We expect this test to FAIL initially (count 2) and PASS after optimization (count 1).
    // For now, let's just log the count to confirm baseline.
    console.log('Render count with stable callback:', onRenderSpy.mock.calls.length);

    // Assertion for optimization (will fail initially)
    // 1 (mount) + 1 (internal effect) + 0 (parent update skipped) = 2
    expect(onRenderSpy).toHaveBeenCalledTimes(2);
  });
});
