/**
 * Theme Regression Tests – ErrorAlarmMonitor
 *
 * Strategy: Vitest + @testing-library/react (already in project, zero new deps).
 *   • DOM snapshots  → catch unintended structural / style changes
 *   • Inline-style assertions → verify key color values per dark/light theme
 *   • Text presence  → ensure all labels render in both themes
 *
 * NOTE: jsdom does not run CSS cascade from stylesheets, so we test what
 *       the component itself sets (inline styles, data-theme attribute).
 *       CSS-only overrides are validated in theme-css.test.ts.
 */

import { render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ErrorAlarmMonitor from '../ErrorAlarmMonitor'

// ── Helpers ──────────────────────────────────────────────────────────────────

function setTheme(theme: 'dark' | 'light') {
  document.documentElement.setAttribute('data-theme', theme)
}

function resetTheme() {
  document.documentElement.removeAttribute('data-theme')
}

/** Wraps fetch to return a given payload */
function mockFetch(payload: object) {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => payload,
  } as Response)
}

// ── Setup / Teardown ─────────────────────────────────────────────────────────

beforeEach(() => {
  // Freeze toLocaleTimeString so DOM snapshots don't vary between runs
  vi.spyOn(Date.prototype, 'toLocaleTimeString').mockReturnValue('10:00:00')
})

afterEach(() => {
  vi.restoreAllMocks()
  resetTheme()
})

// ── Tests: No-alarm (clean) state ────────────────────────────────────────────

describe('ErrorAlarmMonitor – clean state (no alarms)', () => {
  it('renders the main heading in DARK mode', async () => {
    mockFetch({ alarms: [] })
    setTheme('dark')
    render(<ErrorAlarmMonitor />)

    expect(await screen.findByText(/Fehler- & Alarmmonitor/i)).toBeTruthy()
  })

  it('renders the main heading in LIGHT mode', async () => {
    mockFetch({ alarms: [] })
    setTheme('light')
    render(<ErrorAlarmMonitor />)

    expect(await screen.findByText(/Fehler- & Alarmmonitor/i)).toBeTruthy()
  })

  it('shows "Alles in Ordnung" status when there are no alarms', async () => {
    mockFetch({ alarms: [] })
    setTheme('dark')
    render(<ErrorAlarmMonitor />)

    expect(await screen.findByText(/Alles in Ordnung/i)).toBeTruthy()
  })

  it('heading has a light inline color in dark mode (readable on dark bg)', async () => {
    mockFetch({ alarms: [] })
    setTheme('dark')
    const { findByRole } = render(<ErrorAlarmMonitor />)

    // The <h2> sets color: "#f1f5f9" — jsdom normalizes hex → rgb
    const heading = await findByRole('heading', { level: 2 })
    expect(heading.style.color).toBe('rgb(241, 245, 249)')
  })

  it('DOM snapshot – dark mode (no alarms) — catches structural regressions', async () => {
    mockFetch({ alarms: [] })
    setTheme('dark')
    const { container } = render(<ErrorAlarmMonitor />)
    // Wait for async state (fetch → setAlarms)
    await screen.findByText(/Alles in Ordnung/i)
    expect(container.firstChild).toMatchSnapshot()
  })

  it('DOM snapshot – light mode (no alarms)', async () => {
    mockFetch({ alarms: [] })
    setTheme('light')
    const { container } = render(<ErrorAlarmMonitor />)
    await screen.findByText(/Alles in Ordnung/i)
    expect(container.firstChild).toMatchSnapshot()
  })
})

// ── Tests: Alarm list state ───────────────────────────────────────────────────

const MOCK_ALARMS = [
  {
    id: 'a1',
    type: 'error' as const,
    message: 'Batterie-Überspannung erkannt',
    timestamp: '2026-06-01T10:00:00Z',
    recommendation: 'Batterie vom Netz trennen',
  },
  {
    id: 'a2',
    type: 'warning' as const,
    message: 'Solarertrag unter Erwartung',
    timestamp: '2026-06-01T10:05:00Z',
  },
  {
    id: 'a3',
    type: 'info' as const,
    message: 'Software-Update verfügbar',
    timestamp: '2026-06-01T10:10:00Z',
  },
]

describe('ErrorAlarmMonitor – alarm list state', () => {
  it('renders all alarm messages in dark mode', async () => {
    mockFetch({ alarms: MOCK_ALARMS })
    setTheme('dark')
    render(<ErrorAlarmMonitor />)

    // Messages appear in both the alarm list and toast overlay — use getAllByText
    expect((await screen.findAllByText('Batterie-Überspannung erkannt')).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Solarertrag unter Erwartung').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Software-Update verfügbar').length).toBeGreaterThanOrEqual(1)
  })

  it('renders all alarm messages in light mode', async () => {
    mockFetch({ alarms: MOCK_ALARMS })
    setTheme('light')
    render(<ErrorAlarmMonitor />)

    expect((await screen.findAllByText('Batterie-Überspannung erkannt')).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Solarertrag unter Erwartung').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Software-Update verfügbar').length).toBeGreaterThanOrEqual(1)
  })

  it('shows alarm type labels (Fehler / Warnung / Info)', async () => {
    mockFetch({ alarms: MOCK_ALARMS })
    setTheme('dark')
    render(<ErrorAlarmMonitor />)

    await screen.findAllByText('Batterie-Überspannung erkannt')
    // Badge labels appear in list + toast overlay — getAllByText is correct here
    expect(screen.getAllByText('Fehler').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Warnung').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Info').length).toBeGreaterThanOrEqual(1)
  })

  it('renders recommendation text when present', async () => {
    mockFetch({ alarms: MOCK_ALARMS })
    setTheme('dark')
    render(<ErrorAlarmMonitor />)

    expect(await screen.findByText('Batterie vom Netz trennen')).toBeTruthy()
  })

  it('alarm list items have a light text color (readable on dark bg)', async () => {
    mockFetch({ alarms: MOCK_ALARMS })
    setTheme('dark')
    render(<ErrorAlarmMonitor />)

    await screen.findAllByText('Batterie-Überspannung erkannt')
    // The alarm message <div> sets color: "#f1f5f9" — jsdom normalizes to rgb
    const msgEls = screen.getAllByText('Batterie-Überspannung erkannt')
    // Find the one with the inline color set (alarm list item, not plain toast text)
    const coloredEl = msgEls.find(el => el.style.color !== '')
    expect(coloredEl?.style.color).toBe('rgb(241, 245, 249)')
  })

  it('DOM snapshot – dark mode (with alarms)', async () => {
    mockFetch({ alarms: MOCK_ALARMS })
    setTheme('dark')
    const { container } = render(<ErrorAlarmMonitor />)
    await screen.findAllByText('Batterie-Überspannung erkannt')
    expect(container.firstChild).toMatchSnapshot()
  })

  it('DOM snapshot – light mode (with alarms)', async () => {
    mockFetch({ alarms: MOCK_ALARMS })
    setTheme('light')
    const { container } = render(<ErrorAlarmMonitor />)
    await screen.findAllByText('Batterie-Überspannung erkannt')
    expect(container.firstChild).toMatchSnapshot()
  })
})

// ── Tests: fetch failure (graceful degradation) ───────────────────────────────

describe('ErrorAlarmMonitor – network error', () => {
  it('falls back to no-alarm state when fetch fails', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))
    setTheme('dark')
    render(<ErrorAlarmMonitor />)

    expect(await screen.findByText(/Alles in Ordnung/i)).toBeTruthy()
  })
})
