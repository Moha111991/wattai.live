import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import CO2CostWidget from './CO2CostWidget'

describe('CO2CostWidget', () => {
  it('renders values and labels', () => {
    render(
      <CO2CostWidget
        co2SavedKg={123.4}
        costEur={56.78}
        autarky={87.6}
        period="Monat"
      />,
    )

    expect(screen.getByText(/CO₂ & Kosten Übersicht \(Monat\)/i)).toBeTruthy()
    expect(screen.getByText('123.4')).toBeTruthy()
    expect(screen.getByText('56.78')).toBeTruthy()
    expect(screen.getByText('87.6%')).toBeTruthy()
  })
})
