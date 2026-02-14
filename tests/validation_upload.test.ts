import { describe, it, expect } from 'vitest';
import { validateFileSize, validateFileMimeType } from '../utils/validation';

describe('Validation Upload Security', () => {
  it('should allow files within size limit', () => {
    // Create a 1024-byte file
    const file = new File(['a'.repeat(1024)], 'test.txt', { type: 'text/plain' });
    expect(() => validateFileSize(file, 2048)).not.toThrow();
  });

  it('should throw error for files exceeding size limit', () => {
    // Create a 3000-byte file
    const file = new File(['a'.repeat(3000)], 'test.txt', { type: 'text/plain' });
    // Expect limit 2048
    expect(() => validateFileSize(file, 2048)).toThrow();
  });

  it('should check exact size boundary', () => {
     const file = new File(['a'.repeat(1024)], 'test.txt', { type: 'text/plain' });
     expect(() => validateFileSize(file, 1024)).not.toThrow();
  });

  it('should allow files with allowed mime types', () => {
    const file = new File(['content'], 'test.png', { type: 'image/png' });
    expect(() => validateFileMimeType(file, ['image/png', 'image/jpeg'])).not.toThrow();
  });

  it('should throw error for files with disallowed mime types', () => {
    const file = new File(['content'], 'test.exe', { type: 'application/x-msdownload' });
    expect(() => validateFileMimeType(file, ['image/png', 'image/jpeg'])).toThrow(/is not allowed/);
  });

  it('should sanitize mime type in error message', () => {
     // Malicious type trying to inject HTML/Script into error message
     const file = new File(['content'], 'test.bad', { type: 'text/html<script>alert(1)</script>' });
     // The error message should contain the sanitized version 'text/htmlscriptalert1/script'
     // or whatever the regex /[^a-zA-Z0-9\/\-\.]/g produces.
     // 'text/html<script>alert(1)</script>' -> 'text/htmlscriptalert1/script'
     expect(() => validateFileMimeType(file, ['image/png'])).toThrow(/File type 'text\/htmlscriptalert1\/script' is not allowed/);
  });
});
