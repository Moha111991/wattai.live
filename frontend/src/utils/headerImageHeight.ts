const MOBILE_COMPACT_HEADER_TABS = new Set(['main', 'ev', 'devices', 'house', 'ki']);

export const getHeaderImageHeight = (tab: string, isMobile: boolean): string =>
  isMobile && MOBILE_COMPACT_HEADER_TABS.has(tab)
    ? 'clamp(140px, 40vw, 200px)'
    : 'var(--tab-header-image-height, clamp(300px, 50vw, 560px))';
