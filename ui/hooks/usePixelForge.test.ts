import { describe, it, expect } from 'vitest';
import { pixelForgeReducer, DEFAULT_SETTINGS } from './usePixelForge';
import { GenerationState, PixelForgeState, GeneratedArt } from '../../domain/entities';

describe('pixelForgeReducer', () => {
  const initialState: PixelForgeState = {
    prompt: '',
    isSpriteSheet: false,
    selectedStyle: '16-bit',
    perspective: 'side',
    category: 'character',
    selectedActions: ['idle'],
    genState: GenerationState.IDLE,
    history: [],
    activeArt: null,
    errorMessage: '',
    isExporting: false,
    inspiration: null,
    animationSettings: DEFAULT_SETTINGS
  };

  it('should handle SUMMON_SUCCESS correctly', () => {
    const mockArt: GeneratedArt = {
      id: '123',
      imageUrl: 'test.png',
      prompt: 'A hero',
      timestamp: 1000,
      type: 'spritesheet',
      style: '16-bit',
      perspective: 'side',
      category: 'character',
      actions: ['idle'],
      gridSize: { rows: 4, cols: 4 }
    };

    const newState = pixelForgeReducer(initialState, { type: 'SUMMON_SUCCESS', payload: mockArt });

    expect(newState.genState).toBe(GenerationState.SUCCESS);
    expect(newState.activeArt).toEqual(mockArt);
    expect(newState.history).toHaveLength(1);
    expect(newState.history[0]).toEqual(mockArt);
    expect(newState.animationSettings.rows).toBe(4);
    expect(newState.animationSettings.cols).toBe(4);
  });

  it('should handle SUMMON_FAILURE correctly', () => {
    const errorMsg = "API Error";
    const newState = pixelForgeReducer(initialState, { type: 'SUMMON_FAILURE', payload: errorMsg });

    expect(newState.genState).toBe(GenerationState.ERROR);
    expect(newState.errorMessage).toBe(errorMsg);
  });

  it('should update prompt correctly', () => {
    const newState = pixelForgeReducer(initialState, { type: 'SET_PROMPT', payload: 'New Prompt' });
    expect(newState.prompt).toBe('New Prompt');
  });

  it('should toggle actions correctly', () => {
    // Initial has ['idle']
    const s1 = pixelForgeReducer(initialState, { type: 'TOGGLE_ACTION', payload: 'walk' });
    expect(s1.selectedActions).toEqual(['idle', 'walk']);

    const s2 = pixelForgeReducer(s1, { type: 'TOGGLE_ACTION', payload: 'idle' });
    expect(s2.selectedActions).toEqual(['walk']);
  });
});