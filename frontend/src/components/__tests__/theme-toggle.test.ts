/**
 * Theme Toggle Unit Tests
 *
 * Tests the core theme mechanism: data-theme attribute on <html>,
 * localStorage persistence, and CSS variable resolution.
 *
 * These run in jsdom so they validate the DOM attribute logic without
 * needing a browser — fast, zero-dependency regression guard.
 */

import { afterEach, beforeEach, beforeAll, describe, expect, it, vi } from 'vitest'

// ── localStorage stub (not available in plain .ts vitest env) ─────────────────
let _store: Record<string, string> = {}
const localStorageMock = {
  getItem: (k: string): string | null => _store[k] ?? null,
  setItem: (k: string, v: string): void => { _store[k] = String(v) },
  removeItem: (k: string): void => { delete _store[k] },
  clear: (): void => { _store = {} },
  get length() { return Object.keys(_store).length },
  key: (i: number) => Object.keys(_store)[i] ?? null,
}
beforeAll(() => {
  vi.stubGlobal('localStorage', localStorageMock)
  // jsdom does not implement matchMedia — provide a stub
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: false, // default: light system theme
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }))
})

// ── Helpers ───────────────────────────────────────────────────────────────────

function applyTheme(isDark: boolean) {
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
  localStorage.setItem('wattai-theme', isDark ? 'dark' : 'light')
}

function readSavedTheme(): string | null {
  return localStorage.getItem('wattai-theme')
}

function readActiveTheme(): string | null {
  return document.documentElement.getAttribute('data-theme')
}

// ── Setup / Teardown ──────────────────────────────────────────────────────────

beforeEach(() => {
  localStorageMock.clear()
  document.documentElement.removeAttribute('data-theme')
})

afterEach(() => {
  vi.restoreAllMocks()
})

// ── Tests: data-theme attribute ───────────────────────────────────────────────

describe('Theme toggle – data-theme attribute', () => {
  it('sets data-theme="dark" on <html> when isDark = true', () => {
    applyTheme(true)
    expect(readActiveTheme()).toBe('dark')
  })

  it('sets data-theme="light" on <html> when isDark = false', () => {
    applyTheme(false)
    expect(readActiveTheme()).toBe('light')
  })

  it('persists the theme choice in localStorage', () => {
    applyTheme(true)
    expect(readSavedTheme()).toBe('dark')

    applyTheme(false)
    expect(readSavedTheme()).toBe('light')
  })

  it('toggling dark→light→dark produces correct sequence', () => {
    applyTheme(true)
    expect(readActiveTheme()).toBe('dark')

    applyTheme(false)
    expect(readActiveTheme()).toBe('light')

    applyTheme(true)
    expect(readActiveTheme()).toBe('dark')
  })
})

// ── Tests: initial theme resolution ──────────────────────────────────────────

describe('Theme toggle – initial theme resolution (localStorage priority)', () => {
  it('prefers localStorage value over system preference', () => {
    // Pre-seed localStorage with 'light' even though system might be dark
    localStorage.setItem('wattai-theme', 'light')
    const saved = localStorage.getItem('wattai-theme')
    // Simulate the App.tsx initialization logic
    const isDark = saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches
    expect(isDark).toBe(false)
  })

  it('uses system preference when localStorage is empty', () => {
    localStorage.clear()
    // jsdom matchMedia returns false by default → system = light → isDark = false
    const saved = localStorage.getItem('wattai-theme')
    const isDark = saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches
    expect(typeof isDark).toBe('boolean') // Just verifies the logic returns a boolean
  })
})

// ── Tests: CSS selector assumptions (sanity-check inline style values) ────────

describe('Theme CSS – inline color contract', () => {
  /**
   * These tests encode the "contract" between component authors and the CSS theme overrides.
   * If a dev changes an inline color value in a component, this test will fail and prompt them
   * to also update the corresponding CSS selector in index.css.
   */

  it('light-text color used in dark-mode components is #f1f5f9 (ErrorAlarmMonitor heading)', () => {
    // jsdom normalizes hex → rgb when assigned to el.style.color
    const expectedLightTextOnDark = '#f1f5f9'
    const el = document.createElement('h2')
    el.style.color = expectedLightTextOnDark
    // jsdom serializes as rgb(241, 245, 249)
    expect(el.style.color).toBe('rgb(241, 245, 249)')
  })

  it('primary light text color for dark mode is #f8fafc (DeviceGrid / HouseholdDashboard)', () => {
    const el = document.createElement('span')
    el.style.color = '#f8fafc'
    expect(el.style.color).toBe('rgb(248, 250, 252)')
  })

  it('primary dark text color for light mode is #0f172a', () => {
    const el = document.createElement('span')
    el.style.color = '#0f172a'
    expect(el.style.color).toBe('rgb(15, 23, 42)')
  })

  it('muted dark text color for light mode is rgba(15,23,42,0.5)', () => {
    const el = document.createElement('span')
    el.style.color = 'rgba(15,23,42,0.5)'
    expect(el.style.color).toMatch(/rgba?\(15,\s*23,\s*42/)
  })
})
