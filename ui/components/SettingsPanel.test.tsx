
import React from 'react';
import { render, screen } from '@testing-library/react';
import { CodexDimensions } from './SettingsPanel';
import { AnimationSettings } from '../../domain/entities';
import { describe, it, expect, vi } from 'vitest';

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
};

describe('CodexDimensions Accessibility', () => {
  it('renders resolution buttons as a labeled group with pressed states', () => {
    const setSettings = vi.fn();
    render(<CodexDimensions settings={mockSettings} setSettings={setSettings} />);

    // 1. Verify group role and label
    const group = screen.getByRole('group', { name: /Target Resolution/i });
    expect(group).not.toBeNull();

    // 2. Verify aria-pressed state
    const button64 = screen.getByRole('button', { name: /64px/i });
    expect(button64.getAttribute('aria-pressed')).toBe('true');

    const button128 = screen.getByRole('button', { name: /128px/i });
    expect(button128.getAttribute('aria-pressed')).toBe('false');
  });

  it('renders aspect ratio buttons as a labeled group with pressed states', () => {
    const setSettings = vi.fn();
    render(<CodexDimensions settings={mockSettings} setSettings={setSettings} />);

    const group = screen.getByRole('group', { name: /Canvas Ratio/i });
    expect(group).not.toBeNull();

    const button11 = screen.getByRole('button', { name: /1:1/i });
    expect(button11.getAttribute('aria-pressed')).toBe('true');

    const button169 = screen.getByRole('button', { name: /16:9/i });
    expect(button169.getAttribute('aria-pressed')).toBe('false');
  });
});
