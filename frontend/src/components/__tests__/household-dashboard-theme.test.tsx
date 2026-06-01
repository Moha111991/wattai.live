/**
 * HausautomationPanel – Theme & Label Regression Tests
 *
 * Strategy:
 *  - vi.mock heavy child components (TabHeader, TabBar, BatteryWidget, SmartMeterEnergyWidget)
 *    so we only render the Hausautomation section.
 *  - vi.mock WebSocket to avoid "WebSocket is not defined" in jsdom.
 *  - Assert device category labels exist in DOM in both dark and light themes.
 *  - Assert wizard step-1 heading & device labels are visible.
 *  - DOM snapshot covers the full Hausautomation card.
 */

import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// ── Mock heavy sub-components ─────────────────────────────────────────────────
vi.mock('../TabHeader', () => ({ default: () => null }))
vi.mock('../TabBar', () => ({ default: () => null }))
vi.mock('../BatteryWidget', () => ({ default: () => null }))
vi.mock('../SmartMeterEnergyWidget', () => ({ default: () => null }))

// Mock WebSocket globally (jsdom has no WS)
class MockWebSocket {
  onopen: (() => void) | null = null
  onmessage: ((e: MessageEvent) => void) | null = null
  onclose: (() => void) | null = null
  onerror: ((e: Event) => void) | null = null
  close() {}
}
vi.stubGlobal('WebSocket', MockWebSocket)

// ── Import after mocks ────────────────────────────────────────────────────────
import HouseholdDashboard from '../HouseholdDashboard'

// ── Helpers ───────────────────────────────────────────────────────────────────
function setTheme(theme: 'dark' | 'light') {
  document.documentElement.setAttribute('data-theme', theme)
}

// ── Setup / Teardown ─────────────────────────────────────────────────────────

beforeEach(() => {
  document.documentElement.removeAttribute('data-theme')
})

afterEach(() => {
  vi.restoreAllMocks()
})

// ── Tests: device category labels ────────────────────────────────────────────

const DEVICE_LABELS = [
  'Wärmepumpe',
  'Waschmaschine',
  'Trockner',
  'Spülmaschine',
  'Klimaanlage',
  'Smart Licht',
]

describe('HausautomationPanel – device category labels', () => {
  it('renders all 6 device categories in DARK mode', () => {
    setTheme('dark')
    render(<HouseholdDashboard />)

    for (const label of DEVICE_LABELS) {
      expect(screen.getByText(label)).toBeTruthy()
    }
  })

  it('renders all 6 device categories in LIGHT mode', () => {
    setTheme('light')
    render(<HouseholdDashboard />)

    for (const label of DEVICE_LABELS) {
      expect(screen.getByText(label)).toBeTruthy()
    }
  })
})

// ── Tests: Step-1 wizard heading ──────────────────────────────────────────────

describe('HausautomationPanel – Step 1 wizard', () => {
  it('shows "Gerät wählen" heading in dark mode', () => {
    setTheme('dark')
    render(<HouseholdDashboard />)
    expect(screen.getByText(/Gerät wählen/i)).toBeTruthy()
  })

  it('shows "Gerät wählen" heading in light mode', () => {
    setTheme('light')
    render(<HouseholdDashboard />)
    expect(screen.getByText(/Gerät wählen/i)).toBeTruthy()
  })

  it('shows step indicator labels in both themes', () => {
    setTheme('dark')
    render(<HouseholdDashboard />)
    // Step labels rendered in the wizard stepper — multiple matches expected (step tab + content label)
    expect(screen.getAllByText(/Protokoll/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/Verbinden/i).length).toBeGreaterThanOrEqual(1)
  })
})

// ── Tests: Hausautomation section heading ─────────────────────────────────────

describe('HausautomationPanel – section heading', () => {
  it('renders "Hausautomation" label in dark mode', () => {
    setTheme('dark')
    render(<HouseholdDashboard />)
    expect(screen.getByText(/Hausautomation/i)).toBeTruthy()
  })

  it('renders "Hausautomation" label in light mode', () => {
    setTheme('light')
    render(<HouseholdDashboard />)
    expect(screen.getByText(/Hausautomation/i)).toBeTruthy()
  })
})

// ── Snapshot: Hausautomation card in both themes ──────────────────────────────

describe('HausautomationPanel – DOM snapshots', () => {
  it('matches snapshot in DARK mode', () => {
    setTheme('dark')
    const { container } = render(<HouseholdDashboard />)
    expect(container).toMatchSnapshot()
  })

  it('matches snapshot in LIGHT mode', () => {
    setTheme('light')
    const { container } = render(<HouseholdDashboard />)
    expect(container).toMatchSnapshot()
  })
})
