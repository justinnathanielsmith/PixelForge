
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CodexDimensions, CodexAlchemy } from './SettingsPanel';
import { AnimationSettings } from '../../domain/entities';
import { describe, it, expect, vi } from 'vitest';

vi.mock('../context/ToastContext', () => ({
  useToast: () => ({
    whisper: vi.fn(),
  }),
}));

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
  customPalette: [
    { r: 255, g: 0, b: 0 },
    { r: 0, g: 255, b: 0 },
    { r: 0, g: 0, b: 255 }
  ],
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

  it('connects toggle button to content with aria-controls', () => {
    const setSettings = vi.fn();
    render(<CodexDimensions settings={mockSettings} setSettings={setSettings} />);

    // Find the toggle button
    const toggleButton = screen.getByRole('button', { expanded: true });
    const controlsId = toggleButton.getAttribute('aria-controls');

    expect(controlsId).toBeTruthy();

    // Ensure the content div exists with that ID
    // Note: We can't easily query by ID with screen, so we use document.getElementById
    // or we can just check if an element with that ID exists in the container.
    // However, since we are using React Testing Library, we can try to find an element inside the content
    // and check its parent's ID, or just trust aria-controls points to *something*.
    // Better: Query by ID manually.
    const content = document.getElementById(controlsId!);
    expect(content).toBeTruthy();
  });
});

describe('CodexAlchemy Accessibility', () => {
  it('renders color swatches with accessible labels', () => {
    const setSettings = vi.fn();
    const onGeneratePalette = vi.fn();

    render(<CodexAlchemy settings={mockSettings} setSettings={setSettings} onGeneratePalette={onGeneratePalette} />);

    // Check for color swatches
    const redSwatch = screen.getByRole('img', { name: /Color swatch: rgb\(255, 0, 0\)/i });
    expect(redSwatch).toBeTruthy();

    const greenSwatch = screen.getByRole('img', { name: /Color swatch: rgb\(0, 255, 0\)/i });
    expect(greenSwatch).toBeTruthy();

    const blueSwatch = screen.getByRole('img', { name: /Color swatch: rgb\(0, 0, 255\)/i });
    expect(blueSwatch).toBeTruthy();
  });
});
