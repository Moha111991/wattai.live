import { describe, expect, it } from 'vitest';
import { getHeaderImageHeight } from './utils/headerImageHeight';

describe('getHeaderImageHeight', () => {
  it('uses compact mobile header height for requested tabs', () => {
    const compactHeight = 'clamp(140px, 40vw, 200px)';
    expect(getHeaderImageHeight('main', true)).toBe(compactHeight);
    expect(getHeaderImageHeight('ev', true)).toBe(compactHeight);
    expect(getHeaderImageHeight('house', true)).toBe(compactHeight);
    expect(getHeaderImageHeight('ki', true)).toBe(compactHeight);
    expect(getHeaderImageHeight('devices', true)).toBe(compactHeight);
  });

  it('uses default header height for non-target tabs or desktop', () => {
    const defaultHeight = 'var(--tab-header-image-height, clamp(300px, 50vw, 560px))';
    expect(getHeaderImageHeight('fleet', true)).toBe(defaultHeight);
    expect(getHeaderImageHeight('main', false)).toBe(defaultHeight);
  });
});
