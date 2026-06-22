import { render, screen } from '@testing-library/react'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import CO2CostWidget from './CO2CostWidget'
import { LanguageProvider } from '../context/LanguageContext'

let store: Record<string, string> = {}
const localStorageMock = {
  getItem: (key: string): string | null => store[key] ?? null,
  setItem: (key: string, value: string) => { store[key] = String(value) },
  removeItem: (key: string) => { delete store[key] },
  clear: () => { store = {} },
  key: (index: number): string | null => Object.keys(store)[index] ?? null,
  get length() { return Object.keys(store).length },
}

beforeAll(() => {
  vi.stubGlobal('localStorage', localStorageMock)
})

beforeEach(() => {
  localStorageMock.clear()
  localStorage.setItem('wattai-language', 'de')
})

describe('CO2CostWidget', () => {
  it('renders values and labels', () => {
    render(
      <LanguageProvider>
        <CO2CostWidget
          co2SavedKg={123.4}
          costEur={56.78}
          autarky={87.6}
          period="Monat"
        />
      </LanguageProvider>,
    )

    expect(screen.getByText(/CO₂ & Kosten Übersicht \(Monat\)/i)).toBeTruthy()
    expect(screen.getByText('123.4')).toBeTruthy()
    expect(screen.getByText('56.78')).toBeTruthy()
    expect(screen.getByText('87.6%')).toBeTruthy()
  })
})
