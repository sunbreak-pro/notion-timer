import { isValidUrl } from './urlValidation';
import { describe, it, expect } from 'vitest';

describe('isValidUrl', () => {
  it('accepts http URLs', () => {
    expect(isValidUrl('http://example.com')).toBe('http://example.com/');
  });

  it('accepts https URLs', () => {
    expect(isValidUrl('https://example.com')).toBe('https://example.com/');
  });

  it('auto-prepends https:// when no protocol given', () => {
    expect(isValidUrl('example.com')).toBe('https://example.com/');
  });

  it('rejects javascript: URIs', () => {
    expect(isValidUrl('javascript:alert(1)')).toBeNull();
  });

  it('rejects data: URIs', () => {
    expect(isValidUrl('data:text/html,<h1>hi</h1>')).toBeNull();
  });

  it('rejects vbscript: URIs', () => {
    expect(isValidUrl('vbscript:MsgBox("hi")')).toBeNull();
  });

  it('rejects file: URIs', () => {
    expect(isValidUrl('file:///etc/passwd')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(isValidUrl('')).toBeNull();
  });

  it('returns null for whitespace-only', () => {
    expect(isValidUrl('   ')).toBeNull();
  });

  it('trims whitespace', () => {
    expect(isValidUrl('  https://example.com  ')).toBe('https://example.com/');
  });

  it('preserves path and query', () => {
    expect(isValidUrl('https://example.com/path?q=1')).toBe('https://example.com/path?q=1');
  });
});
