import { render, screen } from '@testing-library/react';
import React from 'react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import App from '../App';
import UpcomingFeatures from '../ui/components/UpcomingFeatures';
import * as usePixelForgeModule from '../ui/hooks/usePixelForge';

// Mock the hook
vi.mock('../ui/hooks/usePixelForge', () => ({
  usePixelForge: vi.fn()
}));

// Mock child components
vi.mock('../ui/components/SpritePreview', () => ({ default: () => <div data-testid="sprite-preview" /> }));
vi.mock('../ui/components/SettingsPanel', () => ({
  CodexDimensions: () => <div />,
  CodexGrid: () => <div />,
  CodexChronometry: () => <div />,
  CodexAlchemy: () => <div />
}));
vi.mock('../ui/components/Gatekeeper', () => ({ Gatekeeper: ({ children }: any) => <>{children}</> }));

describe('App Accessibility', () => {
  beforeEach(() => {
    (usePixelForgeModule.usePixelForge as any).mockReturnValue({
      state: {
        prompt: '',
        genState: 'IDLE',
        history: [], // Empty history
        activeArt: null,
        inspiration: null,
        animationSettings: { isPlaying: false },
        isSpriteSheet: false,
        category: 'character',
        selectedActions: [],
        perspective: 'isometric',
        isExporting: false,
        errorMessage: null
      },
      dispatch: vi.fn(),
      actions: {
        generateArt: vi.fn(),
        exportAsset: vi.fn(),
        navigateHistory: vi.fn(),
        handleProjectImport: vi.fn(),
        exportProject: vi.fn(),
        handleImageUpload: vi.fn(),
        generateNormalMap: vi.fn(),
        generateSkeleton: vi.fn(),
        generatePalette: vi.fn(),
        deleteArt: vi.fn()
      },
      refs: {
        projectInputRef: { current: null },
        fileInputRef: { current: null }
      }
    });
  });

  it('App should have accessible labels for icon-only buttons', () => {
    render(<App />);

    // These should throw if not found
    // 1. Mobile User Guide Button (currently only has emoji)
    expect(screen.getByRole('button', { name: /Open User Guide/i })).toBeTruthy();

    // 2. Expand Gallery Button (currently only has emoji)
    expect(screen.getByRole('button', { name: /Expand Gallery/i })).toBeTruthy();

    // 3. Key Button (text is "Key", but we want aria-label="Change API Key")
    expect(screen.getByRole('button', { name: /Change API Key/i })).toBeTruthy();
  });

  it('Selection buttons should indicate state via aria-pressed', () => {
    render(<App />);

    // Asset Mode: Single vs Sheet
    const singleBtn = screen.getByRole('button', { name: /SINGLE/i });
    const sheetBtn = screen.getByRole('button', { name: /SHEET/i });
    expect(singleBtn.getAttribute('aria-pressed')).toBe('true');
    expect(sheetBtn.getAttribute('aria-pressed')).toBe('false');

    // View Angle: ISO should be selected
    const isoBtn = screen.getByRole('button', { name: /ISO/i });
    expect(isoBtn.getAttribute('aria-pressed')).toBe('true');

    // Entity Essence: HERO should be selected
    // Note: The button contains icon and text, name will be "👤 HERO" or similar depending on how accessible name is computed.
    // The implementation is:
    // <button ...><span ...>{cat.icon}</span><span ...>{cat.label}</span></button>
    // accessible name includes both spans.
    const heroBtn = screen.getByRole('button', { name: /HERO/i });
    expect(heroBtn.getAttribute('aria-pressed')).toBe('true');
  });

  it('UpcomingFeatures should have accessible label for close button', () => {
    render(<UpcomingFeatures onClose={() => {}} />);
    // There are two buttons to close: top (icon) and bottom (text). Both should be accessible.
    const closeButtons = screen.getAllByRole('button', { name: /Close Manifesto/i });
    expect(closeButtons.length).toBeGreaterThanOrEqual(1);
  });
});
