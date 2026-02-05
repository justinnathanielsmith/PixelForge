import { validateImportedProject } from '../utils/validation';
import { describe, it, expect } from 'vitest';

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
});
