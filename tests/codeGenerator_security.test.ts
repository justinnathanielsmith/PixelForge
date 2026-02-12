
import { describe, it, expect } from 'vitest';
import { generateComposeCode } from '../utils/codeGenerator';
import { GeneratedArt, AnimationSettings } from '../domain/entities';

describe('Sentinel Security: Code Generation', () => {
  const mockArt = {
    id: 'test-id',
    imageUrl: 'data:image/png;base64,',
    prompt: 'Normal prompt',
    timestamp: 1234567890,
    type: 'single',
    style: '8-bit',
    perspective: 'side',
    category: 'character',
    actions: ['idle']
  } as GeneratedArt;

  const mockSettings = {
    rows: 1, cols: 1, fps: 8, isPlaying: true, showGuides: false, tiledPreview: false,
    targetResolution: 32, aspectRatio: '1:1', paletteLock: false, autoTransparency: true,
    chromaTolerance: 5, batchMode: false, zoom: 1, panOffset: { x: 0, y: 0 },
    onionSkin: false, hue: 0, saturation: 100, contrast: 100, brightness: 100,
    temporalStability: false, vectorRite: false, gifRepeat: 0, gifDither: false, gifDisposal: 2
  } as AnimationSettings;

  it('should escape double quotes in prompt', () => {
    const maliciousArt = { ...mockArt, prompt: 'A "malicious" prompt' };
    const code = generateComposeCode(maliciousArt, mockSettings);
    // This expectation should fail before the fix
    expect(code).toContain('contentDescription = "A \\"malicious\\" prompt"');
    expect(code).not.toContain('contentDescription = "A "malicious" prompt"');
  });

  it('should escape dollar signs in prompt', () => {
    const maliciousArt = { ...mockArt, prompt: '${System.exit(0)}' };
    const code = generateComposeCode(maliciousArt, mockSettings);
    // This expectation should fail before the fix
    expect(code).toContain('contentDescription = "\\${System.exit(0)}"');
  });

  it('should escape backslashes in prompt', () => {
    const maliciousArt = { ...mockArt, prompt: 'Backslash \\ test' };
    const code = generateComposeCode(maliciousArt, mockSettings);
    // This expectation should fail before the fix
    expect(code).toContain('contentDescription = "Backslash \\\\ test"');
  });
});
