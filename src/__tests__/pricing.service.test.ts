import { describe, it, expect } from 'vitest'
import { calculatePlanPricing, generateVisitDates } from '../services/pricing.service'

describe('calculatePlanPricing', () => {
  it('calculates residential plan pricing correctly based on tiers and visits', () => {
    // 1 AC, Confort frequency (2 visits/yr, 8500/visit = 17,000 FCFA)
    const result1 = calculatePlanPricing('residentiel', 1, 'Confort')
    expect(result1.months).toBe(12)
    expect(result1.visits).toBe(2)
    expect(result1.price).toBe(17000)

    // 5 ACs, Tier 2 pricing (7500/visit, 2 visits = 75,000 FCFA)
    const result2 = calculatePlanPricing('residentiel', 5, 'Confort')
    expect(result2.visits).toBe(2)
    expect(result2.price).toBe(5 * 2 * 7500)

    // 10 ACs, Tier 3 pricing (6000/visit, Pro frequency = 3 visits = 180,000 FCFA)
    const result3 = calculatePlanPricing('residentiel', 10, 'Pro')
    expect(result3.visits).toBe(3)
    expect(result3.price).toBe(10 * 3 * 6000)
  })

  it('calculates professional plan pricing correctly', () => {
    // 3 ACs, Essentiel frequency (1 visit/yr, 8500/visit = 25,500 FCFA)
    const result = calculatePlanPricing('professionnel', 3, 'Essentiel')
    expect(result.months).toBe(12)
    expect(result.visits).toBe(1)
    expect(result.price).toBe(3 * 1 * 8500)
  })

  it('handles industrial and sur-mesure plans as quote-only (0 price)', () => {
    const industrial = calculatePlanPricing('industriel', 10, 'Confort')
    expect(industrial.price).toBe(0)
    expect(industrial.visits).toBe(2)

    const surMesure = calculatePlanPricing('sur_mesure', 4, 'Pro')
    expect(surMesure.price).toBe(0)
    expect(surMesure.visits).toBe(3)
  })

  it('handles legacy plan types correctly', () => {
    const trimestriel = calculatePlanPricing('trimestriel', 1, '')
    expect(trimestriel.months).toBe(12)
    expect(trimestriel.visits).toBe(3)
    expect(trimestriel.price).toBe(30000)

    const semestriel = calculatePlanPricing('semestriel', 1, '')
    expect(semestriel.visits).toBe(2)
    expect(semestriel.price).toBe(55000)

    const annuel = calculatePlanPricing('annuel', 1, '')
    expect(annuel.months).toBe(12)
    expect(annuel.visits).toBe(1)
    expect(annuel.price).toBe(100000)
  })

  it('generates distributed visit dates correctly', () => {
    const dates = generateVisitDates('2026-01-01', 2, 12)
    expect(dates.length).toBe(2)
    // 1st visit: +6 months, 2nd visit: +12 months
    expect(dates[0]).toBe('2026-07-01')
    expect(dates[1]).toBe('2027-01-01')
  })
})
