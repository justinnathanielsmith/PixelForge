
import React, { useState } from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CodexDimensions, CodexChronometry } from './SettingsPanel';
import { AnimationSettings } from '../../domain/entities';

const mockSettings: AnimationSettings = {
  rows: 4,
  cols: 4,
  fps: 12,
  isPlaying: false,
  showGuides: false,
  tiledPreview: false,
  targetResolution: 64,
  aspectRatio: '1:1',
  paletteLock: false,
  autoTransparency: false,
  chromaTolerance: 10,
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
  gifDisposal: 2,
  customPalette: null
};

// Wrapper component
const TestWrapper = ({ onRenderDimensionsSpy, onRenderChronometrySpy }: { onRenderDimensionsSpy: any, onRenderChronometrySpy?: any }) => {
  const [settings, setSettings] = useState(mockSettings);

  // Memoize updateSettings to simulate App.tsx behavior where it's stable
  const updateSettings = React.useCallback((newSettings: Partial<AnimationSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  return (
    <div>
        <React.Profiler id="CodexDimensions" onRender={onRenderDimensionsSpy}>
            <CodexDimensions settings={settings} setSettings={updateSettings} />
        </React.Profiler>
        <React.Profiler id="CodexChronometry" onRender={onRenderChronometrySpy || (() => {})}>
            <CodexChronometry settings={settings} setSettings={updateSettings} />
        </React.Profiler>
    </div>
  );
};

describe('SettingsPanel Performance', () => {
  it('CodexDimensions should skip re-render (very low render duration) when unrelated settings (FPS) change', () => {
    const onRenderSpy = vi.fn();
    const onChronometrySpy = vi.fn();

    render(<TestWrapper onRenderDimensionsSpy={onRenderSpy} onRenderChronometrySpy={onChronometrySpy} />);

    // Reset spy count from initial render
    onRenderSpy.mockClear();
    onChronometrySpy.mockClear();

    // Change FPS (should only affect CodexChronometry)
    const fpsInput = screen.getByLabelText('Frame Rate');

    act(() => {
        fireEvent.change(fpsInput, { target: { value: '24' } });
    });

    // CodexChronometry should re-render and take some time (e.g. > 0.1ms)
    // CodexDimensions should be skipped (duration ~0ms or very small)

    // Check call arguments: [id, phase, actualDuration, baseDuration, startTime, commitTime]
    const dimensionsCall = onRenderSpy.mock.calls[0];
    const chronometryCall = onChronometrySpy.mock.calls[0];

    // If memoized correctly, actualDuration for Dimensions should be negligible compared to Chronometry
    // or just very small in absolute terms.

    const dimensionsDuration = dimensionsCall[2];
    const chronometryDuration = chronometryCall[2];

    console.log('Dimensions Duration:', dimensionsDuration);
    console.log('Chronometry Duration:', chronometryDuration);

    // Expect skipped render to be significantly faster than full render
    // If dimensionsDuration is 0, it skipped. If it's very small, it likely skipped.
    // We expect it to be at least 10x faster than the component that actually rendered.
    expect(dimensionsDuration).toBeLessThan(chronometryDuration / 10);
  });
});
