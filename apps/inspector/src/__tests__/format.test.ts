import { describe, expect, it } from 'vitest';

import { decodeBody, formatBytes, isJsonContentType, tryFormatJson } from '../lib/format';

// ---- decodeBody -- base64 to readable string ----

describe('decodeBody', () => {
  it('decodes valid base64 to original string', () => {
    expect(decodeBody(btoa('hello world'))).toBe('hello world');
  });

  it('returns empty string for empty input', () => {
    expect(decodeBody('')).toBe('');
  });

  it('returns fallback for invalid base64', () => {
    expect(decodeBody('%%%not-valid%%%')).toBe('[Binary data]');
  });

  it('decodes JSON body correctly', () => {
    const json = '{"key":"value"}';
    expect(decodeBody(btoa(json))).toBe(json);
  });
});

// ---- tryFormatJson -- pretty-print JSON strings ----

describe('tryFormatJson', () => {
  it('formats valid JSON with indentation', () => {
    const input = '{"a":1,"b":2}';
    expect(tryFormatJson(input)).toBe(JSON.stringify({ a: 1, b: 2 }, null, 2));
  });

  it('returns null for invalid JSON', () => {
    expect(tryFormatJson('not json')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(tryFormatJson('')).toBeNull();
  });

  it('handles nested objects and arrays', () => {
    const input = '{"items":[1,2],"nested":{"key":"value"}}';
    expect(tryFormatJson(input)).toBe(
      JSON.stringify({ items: [1, 2], nested: { key: 'value' } }, null, 2),
    );
  });
});

// ---- isJsonContentType -- detect JSON content type header ----

describe('isJsonContentType', () => {
  it('returns true for application/json', () => {
    expect(isJsonContentType({ 'content-type': 'application/json' })).toBe(true);
  });

  it('returns true for application/json with charset parameter', () => {
    expect(isJsonContentType({ 'content-type': 'application/json; charset=utf-8' })).toBe(true);
  });

  it('returns false for text/html', () => {
    expect(isJsonContentType({ 'content-type': 'text/html' })).toBe(false);
  });

  it('returns false for empty headers object', () => {
    expect(isJsonContentType({})).toBe(false);
  });

  it('detects Content-Type with capital C', () => {
    expect(isJsonContentType({ 'Content-Type': 'application/json' })).toBe(true);
  });
});

// ---- formatBytes -- human-readable file sizes ----

describe('formatBytes', () => {
  it("returns '0 B' for zero bytes", () => {
    expect(formatBytes(0)).toBe('0 B');
  });

  it('returns bytes unit for values under 1024', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(1)).toBe('1 B');
  });

  it('returns KB for kilobyte range', () => {
    expect(formatBytes(1024)).toBe('1.0 KB');
    expect(formatBytes(1536)).toBe('1.5 KB');
  });

  it('returns MB for megabyte range', () => {
    expect(formatBytes(1024 * 1024)).toBe('1.0 MB');
  });
});
