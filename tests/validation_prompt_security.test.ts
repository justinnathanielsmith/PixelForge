
import { describe, it, expect } from 'vitest';
import { validateImportedProject } from '../utils/validation';

describe('Sentinel Prompt Security Validation', () => {

  const validArt = {
    id: '123',
    imageUrl: 'data:image/png;base64,valid',
    prompt: 'valid prompt',
    timestamp: 1234567890,
    type: 'single',
    style: '8-bit',
    perspective: 'isometric',
    category: 'character',
    actions: ['idle']
  };

  it('should sanitize control characters in history prompts', () => {
    const maliciousPrompt = 'valid prompt\x00\x1F';
    const input = {
      history: [{ ...validArt, prompt: maliciousPrompt }],
      settings: {},
      prompt: 'valid'
    };
    const result = validateImportedProject(input);
    expect(result.history[0].prompt).toBe('valid prompt');
  });

  it('should escape backslashes in history prompts', () => {
    const maliciousPrompt = 'valid \\ prompt';
    const input = {
      history: [{ ...validArt, prompt: maliciousPrompt }],
      settings: {},
      prompt: 'valid'
    };
    const result = validateImportedProject(input);
    // sanitizePrompt doubles backslashes: \ -> \\
    expect(result.history[0].prompt).toBe('valid \\\\ prompt');
  });

  it('should replace double quotes with single quotes in history prompts', () => {
    const maliciousPrompt = 'valid " prompt';
    const input = {
      history: [{ ...validArt, prompt: maliciousPrompt }],
      settings: {},
      prompt: 'valid'
    };
    const result = validateImportedProject(input);
    expect(result.history[0].prompt).toBe("valid ' prompt");
  });

  it('should sanitize the top-level project prompt', () => {
    const maliciousPrompt = 'malicious " prompt \x00';
    const input = {
      history: [validArt],
      settings: {},
      prompt: maliciousPrompt
    };
    const result = validateImportedProject(input);
    expect(result.prompt).toBe("malicious ' prompt");
  });

  it('should handle lastPrompt alias for project prompt', () => {
    const maliciousPrompt = 'malicious " prompt \x00';
    const input = {
      history: [validArt],
      settings: {},
      lastPrompt: maliciousPrompt
    };
    const result = validateImportedProject(input);
    expect(result.prompt).toBe("malicious ' prompt");
  });

  it('should enforce max length (implied by sanitizePrompt)', () => {
    const longPrompt = 'a'.repeat(2000);
    const input = {
      history: [{ ...validArt, prompt: longPrompt }],
      settings: {},
      prompt: 'valid'
    };
    const result = validateImportedProject(input);
    expect(result.history[0].prompt.length).toBeLessThanOrEqual(1000);
  });
});
