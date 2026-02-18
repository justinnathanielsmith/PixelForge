import { validateImportedProject } from '../utils/validation';
import { describe, it, expect } from 'vitest';
import { MAX_PROMPT_LENGTH, MAX_HISTORY_ITEMS } from '../domain/constants';

describe('validateImportedProject', () => {
  it('should sanitize invalid settings', () => {
    const maliciousSettings = {
      rows: "NOT A NUMBER",
      evilProperty: "I should not be here",
      fps: -100,
      aspectRatio: "INVALID_RATIO"
    };

    const input = {
      history: [],
      settings: maliciousSettings
    };

    const result = validateImportedProject(input);

    expect(result.settings).not.toBeNull();
    // rows should be default (4) because input was not a number
    expect(result.settings?.rows).toBe(4);

    // evilProperty should be stripped
    expect((result.settings as any).evilProperty).toBeUndefined();

    // aspectRatio should be default ('1:1') because input was not in whitelist
    expect(result.settings?.aspectRatio).toBe('1:1');

    // fps passed as number, so it is preserved (type check only)
    expect(result.settings?.fps).toBe(-100);
  });

  it('should truncate prompts that exceed MAX_PROMPT_LENGTH', () => {
    const longPrompt = 'a'.repeat(MAX_PROMPT_LENGTH + 100);
    const input = {
      history: [],
      settings: {},
      lastPrompt: longPrompt
    };

    const result = validateImportedProject(input);
    expect(result.prompt.length).toBe(MAX_PROMPT_LENGTH);
    expect(result.prompt).toBe('a'.repeat(MAX_PROMPT_LENGTH));
  });

  it('should limit the number of history items to MAX_HISTORY_ITEMS', () => {
    const validItem = {
      id: '123',
      imageUrl: 'data:image/png;base64,valid',
      prompt: 'test',
      timestamp: 1234567890,
      type: 'single',
      style: '8-bit',
      perspective: 'isometric',
      category: 'character',
      actions: ['idle']
    };

    // Create an array slightly larger than the limit
    const manyItems = Array(MAX_HISTORY_ITEMS + 10).fill(validItem).map((item, i) => ({ ...item, id: `item-${i}` }));

    const input = {
      history: manyItems,
      settings: {},
      lastPrompt: 'test'
    };

    const result = validateImportedProject(input);
    expect(result.history.length).toBe(MAX_HISTORY_ITEMS);
    expect(result.history[0].id).toBe('item-0');
    // Ensure the last item is the one at the limit index - 1
    expect(result.history[MAX_HISTORY_ITEMS - 1].id).toBe(`item-${MAX_HISTORY_ITEMS - 1}`);
  });

  it('should truncate prompts within history items', () => {
    const longPrompt = 'b'.repeat(MAX_PROMPT_LENGTH + 50);
    const itemWithLongPrompt = {
      id: '123',
      imageUrl: 'data:image/png;base64,valid',
      prompt: longPrompt,
      timestamp: 1234567890,
      type: 'single',
      style: '8-bit',
      perspective: 'isometric',
      category: 'character',
      actions: ['idle']
    };

    const input = {
      history: [itemWithLongPrompt],
      settings: {},
      lastPrompt: 'test'
    };

    const result = validateImportedProject(input);
    expect(result.history[0].prompt.length).toBe(MAX_PROMPT_LENGTH);
    expect(result.history[0].prompt).toBe('b'.repeat(MAX_PROMPT_LENGTH));
  });

  it('should reject SVG images in project imports to prevent XSS', () => {
    const maliciousProject = {
      history: [
        {
          id: '123',
          imageUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxzY3JpcHQ+YWxlcnQoJ1hTUycpPC9zY3JpcHQ+PC9zdmc+',
          prompt: 'test',
          timestamp: 1234567890,
          type: 'single',
          style: '8-bit',
          perspective: 'side',
          category: 'character',
          actions: ['idle']
        }
      ],
      settings: {},
      prompt: 'test'
    };

    const result = validateImportedProject(maliciousProject);
    // Expect the malicious item to be filtered out
    expect(result.history).toHaveLength(0);
  });

  it('should accept valid raster images', () => {
    const validProject = {
      history: [
        {
          id: '123',
          imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
          prompt: 'test',
          timestamp: 1234567890,
          type: 'single',
          style: '8-bit',
          perspective: 'side',
          category: 'character',
          actions: ['idle']
        }
      ],
      settings: {},
      prompt: 'test'
    };

    const result = validateImportedProject(validProject);
    expect(result.history).toHaveLength(1);
    expect(result.history[0].imageUrl).toBe(validProject.history[0].imageUrl);
  });
});
