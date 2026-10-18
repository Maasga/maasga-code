export const PRICING_THRESHOLDS = {
  TIER_1: 4,
  TIER_2: 8,
  TIER_3: 15,
} as const

export const PRICING_RATES = {
  TIER_1: 8500,
  TIER_2: 7500,
  TIER_3: 6000,
  TIER_4: 5000,
} as const

export const VISIT_FREQUENCY: Record<string, number> = {
  Essentiel: 1,
  Confort: 2,
  Pro: 3,
} as const

export const LEGACY_VISITS: Record<string, number> = {
  trimestriel: 3,
  semestriel: 2,
  annuel: 1,
} as const

export interface PlanPricingResult {
  months: number
  visits: number
  price: number
}

export function calculatePlanPricing(
  planType: string,
  nbClimatiseurs: number,
  frequenceVisites: string
): PlanPricingResult {
  const isV2 = ['residentiel', 'professionnel', 'professionnel_pme', 'industriel', 'sur_mesure'].includes(planType)
  const isLegacy = ['trimestriel', 'semestriel', 'annuel'].includes(planType)

  let months = 12
  let visits = 2
  let price = 0

  if (isV2) {
    const getUnitRate = (cnt: number) => {
      if (cnt <= PRICING_THRESHOLDS.TIER_1) return PRICING_RATES.TIER_1
      if (cnt <= PRICING_THRESHOLDS.TIER_2) return PRICING_RATES.TIER_2
      if (cnt <= PRICING_THRESHOLDS.TIER_3) return PRICING_RATES.TIER_3
      return PRICING_RATES.TIER_4
    }
    visits = VISIT_FREQUENCY[frequenceVisites] || 2
    if (planType === 'industriel' || planType === 'sur_mesure') {
      price = 0
    } else {
      price = getUnitRate(nbClimatiseurs) * nbClimatiseurs * visits
    }
  } else if (isLegacy) {
    const planConfig: Record<string, { months: number; visits: number; price: number }> = {
      trimestriel: { months: 12, visits: LEGACY_VISITS.trimestriel, price: 30000 },
      semestriel: { months: 12, visits: LEGACY_VISITS.semestriel, price: 55000 },
      annuel: { months: 12, visits: LEGACY_VISITS.annuel, price: 100000 },
    }
    const cfg = planConfig[planType]
    if (cfg) {
      months = cfg.months
      visits = cfg.visits
      price = cfg.price
    }
  }

  return { months, visits, price }
}

export function generateVisitDates(
  startDateStr: string,
  visitsCount: number,
  months: number = 12
): string[] {
  const count = Math.max(1, visitsCount || 2)
  const intervalMonths = Math.max(1, Math.floor(months / count))
  const dates: string[] = []

  for (let i = 1; i <= count; i++) {
    const vd = new Date(startDateStr || new Date().toISOString().split('T')[0])
    vd.setMonth(vd.getMonth() + intervalMonths * i)
    dates.push(vd.toISOString().split('T')[0])
  }

  return dates
}
