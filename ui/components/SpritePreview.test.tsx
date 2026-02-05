
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SpritePreview from './SpritePreview';
import { AnimationSettings, GeneratedArt } from '../../domain/entities';

// Mock dependencies
vi.mock('../hooks/useForgeCanvas', () => ({
  useForgeCanvas: () => ({
    canvasRef: { current: document.createElement('canvas') },
    containerRef: { current: document.createElement('div') },
    mousePos: { x: 0, y: 0 },
    isPanning: false,
    tool: 'none',
    setTool: vi.fn(),
    brushColor: '#ffffff',
    setBrushColor: vi.fn(),
    handleWheel: vi.fn(),
    handleMouseDown: vi.fn(),
    handleMouseMove: vi.fn(),
    handleMouseUp: vi.fn(),
  }),
}));

vi.mock('../../data/imageProcessingService', () => ({
  imageProcessingService: {
    getFrameDimensions: () => ({ width: 512, height: 512 }),
    processFrame: () => document.createElement('canvas'),
  },
}));

const mockSettings: AnimationSettings = {
  rows: 1,
  cols: 1,
  fps: 12,
  isPlaying: false,
  showGuides: false,
  tiledPreview: false,
  targetResolution: 64,
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
  gifDisposal: 2,
};

const mockArt: GeneratedArt = {
  id: '1',
  imageUrl: 'test.png',
  prompt: 'test',
  timestamp: 1234567890,
  type: 'single',
  style: '8-bit',
  perspective: 'side',
  category: 'character',
  actions: ['idle'],
};

describe('SpritePreview Accessibility', () => {
  it('should have accessible toolbar buttons', () => {
    render(
      <SpritePreview
        activeArt={mockArt}
        settings={mockSettings}
        style="8-bit"
        onUpdateArt={vi.fn()}
        onUpdateSettings={vi.fn()}
      />
    );

    // These queries will fail if aria-labels are missing
    // getByRole throws an error if not found, so validation is implicit
    screen.getByRole('button', { name: /Scribe Tool/i });
    screen.getByRole('button', { name: /Nullify Tool/i });
    screen.getByRole('button', { name: /Reset View/i });
  });
});
