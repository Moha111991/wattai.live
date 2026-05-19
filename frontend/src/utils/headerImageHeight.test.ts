import { describe, expect, it } from 'vitest';
import { getHeaderImageHeight } from './headerImageHeight';

const COMPACT_TABS = ['main', 'ev', 'devices', 'house', 'ki'];
const MOBILE_COMPACT_HEIGHT = 'clamp(140px, 40vw, 200px)';
const DESKTOP_HEIGHT = 'var(--tab-header-image-height, clamp(300px, 50vw, 560px))';

describe('getHeaderImageHeight', () => {
  it('returns compact height on mobile for all five compact tabs', () => {
    for (const tab of COMPACT_TABS) {
      expect(getHeaderImageHeight(tab, true)).toBe(MOBILE_COMPACT_HEIGHT);
    }
  });

  it('returns desktop height on mobile for unknown tabs', () => {
    expect(getHeaderImageHeight('fleet', true)).toBe(DESKTOP_HEIGHT);
    expect(getHeaderImageHeight('unknown', true)).toBe(DESKTOP_HEIGHT);
  });

  it('returns desktop height on desktop for all tabs', () => {
    for (const tab of [...COMPACT_TABS, 'fleet', 'unknown']) {
      expect(getHeaderImageHeight(tab, false)).toBe(DESKTOP_HEIGHT);
    }
  });

  it('mobile compact height is shorter than the desktop fallback minimum', () => {
    // 140px (compact min) < 300px (desktop min) — more visibility on small screens
    const mobileMin = parseInt(MOBILE_COMPACT_HEIGHT.match(/clamp\((\d+)px/)?.[1] ?? '0', 10);
    const desktopMin = parseInt(DESKTOP_HEIGHT.match(/clamp\((\d+)px/)?.[1] ?? '9999', 10);
    expect(mobileMin).toBeLessThan(desktopMin);
  });
});
