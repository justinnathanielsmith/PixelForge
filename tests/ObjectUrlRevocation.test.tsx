
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useForgeGenerator } from '../ui/hooks/useForgeGenerator';
import { usePixelForge } from '../ui/hooks/usePixelForge';
import { orchestrator } from '../domain/pixelForgeOrchestrator';
import { AnimationSettings, GeneratedArt } from '../domain/entities';
import React from 'react';

// Mock the orchestrator
vi.mock('../domain/pixelForgeOrchestrator', () => ({
  orchestrator: {
    exportAsset: vi.fn(),
    exportProjectFile: vi.fn(),
    persistSession: vi.fn(),
    loadSession: vi.fn().mockResolvedValue({}),
    summonEntity: vi.fn(),
    forgeNormalMap: vi.fn(),
    forgeSkeleton: vi.fn(),
    forgePalette: vi.fn(),
    importProjectFile: vi.fn()
  }
}));

// Mock useToast
vi.mock('../ui/context/ToastContext', () => ({
  useToast: () => ({
    whisper: vi.fn()
  })
}));

// Mock inner hooks for usePixelForge to simplify testing
vi.mock('../ui/hooks/useForgeSettings', () => ({
  useForgeSettings: () => ({
    settings: {},
    updateSettings: vi.fn()
  })
}));

vi.mock('../ui/hooks/useForgeHistory', () => ({
  useForgeHistory: () => ({
    history: [],
    activeArt: null,
    setActiveArt: vi.fn(),
    addArt: vi.fn(),
    updateArt: vi.fn(),
    deleteArt: vi.fn(),
    navigateHistory: vi.fn(),
    setFullHistory: vi.fn()
  })
}));

// We don't mock useForgeGenerator entirely because we want to test its export logic if possible,
// but usePixelForge re-implements/wraps exportProject separately.
// usePixelForge actually IMPORTS useForgeGenerator, so we should probably not mock it if we want to test usePixelForge fully,
// OR we just test useForgeGenerator directly for exportAsset, and assume usePixelForge delegates or we test exportProject separately.

describe('Object URL Revocation', () => {
  const mockRevokeObjectURL = vi.fn();
  const mockCreateObjectURL = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    global.URL.createObjectURL = mockCreateObjectURL;
    global.URL.revokeObjectURL = mockRevokeObjectURL;

    // Mock document.createElement('a') to avoid actual DOM operations but still spy on click?
    // JSDOM handles createElement, but we might want to ensure 'click' doesn't do navigation.
    // However, since we mock the URL, the link.click() won't really do much in JSDOM unless we preventDefault.
    // We mainly care that the logic proceeds to revoke.
  });

  it('should revoke Object URL after exporting asset in useForgeGenerator', async () => {
    const mockSettings = {} as AnimationSettings;
    const mockAddArt = vi.fn();
    const mockUpdateArt = vi.fn();
    const mockUpdateSettings = vi.fn();

    const { result } = renderHook(() => useForgeGenerator({
      settings: mockSettings,
      addArt: mockAddArt,
      updateArt: mockUpdateArt,
      updateSettings: mockUpdateSettings
    }));

    const dummyUrl = 'blob:http://localhost/dummy-asset';
    mockCreateObjectURL.mockReturnValue(dummyUrl); // Not strictly needed as orchestrator returns the URL
    (orchestrator.exportAsset as any).mockResolvedValue(dummyUrl);

    const activeArt = { id: '1', prompt: 'test' } as GeneratedArt;

    await act(async () => {
      await result.current.exportAsset(activeArt, 'png');
    });

    // Advance timers to handle setTimeout
    await new Promise(resolve => setTimeout(resolve, 150));

    expect(orchestrator.exportAsset).toHaveBeenCalled();
    expect(mockRevokeObjectURL).toHaveBeenCalledWith(dummyUrl);
  });

  it('should revoke Object URL after exporting project in usePixelForge', async () => {
    // We need to render usePixelForge.
    // Note: usePixelForge uses useForgeGenerator internally.

    const { result } = renderHook(() => usePixelForge());

    const dummyUrl = 'blob:http://localhost/dummy-project';
    (orchestrator.exportProjectFile as any).mockResolvedValue(dummyUrl);

    await act(async () => {
      await result.current.actions.exportProject();
    });

    // Advance timers to handle setTimeout
    await new Promise(resolve => setTimeout(resolve, 150));

    expect(orchestrator.exportProjectFile).toHaveBeenCalled();
    expect(mockRevokeObjectURL).toHaveBeenCalledWith(dummyUrl);
  });
});
