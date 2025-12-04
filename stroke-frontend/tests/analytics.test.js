import { describe, it, expect } from 'vitest'
import { analyzeFuturePredictions, calculateRiskIncrease } from '../src/utils/analytics'

describe('analytics utils', () => {
  it('returns default structure for empty input', () => {
    const res = analyzeFuturePredictions([])
    expect(res).toHaveProperty('riskProgression')
    expect(res.summaryMetrics.totalPatients).toBe(0)
    expect(res.projections.recommendedActionItems.length).toBeGreaterThan(0)
  })

  it('calculates risk increase for hypertension', () => {
    const patients = [
      { age: 60, hypertension: 1, risk_level: 'high' },
      { age: 55, hypertension: 1, risk_level: 'high' },
      { age: 45, hypertension: 0, risk_level: 'low' },
      { age: 50, hypertension: 0, risk_level: 'low' }
    ]
    const inc = calculateRiskIncrease(patients, 'hypertension')
    // With the dataset above, withCondition high rate = 1.0, withoutCondition high rate = 0.0 -> difference 100
    expect(inc).toBeGreaterThanOrEqual(100)
  })

  it('computes projections for a mixed dataset', () => {
    const patients = [
      { age: 30, risk_level: 'low', hypertension: 0, heart_disease: 0, smoking_status: 'Never smoked', stroke: 0 },
      { age: 65, risk_level: 'high', hypertension: 1, heart_disease: 0, smoking_status: 'Formerly smoked', stroke: 0 },
      { age: 55, risk_level: 'medium', hypertension: 0, heart_disease: 1, smoking_status: 'Smokes', stroke: 0 }
    ]
    const res = analyzeFuturePredictions(patients)
    expect(res.summaryMetrics.totalPatients).toBe(3)
    expect(res.projections.currentHighRiskPercentage).toBeGreaterThanOrEqual(0)
    expect(Array.isArray(res.riskProgression)).toBe(true)
  })
})
