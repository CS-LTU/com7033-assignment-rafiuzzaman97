import { describe, it, expect, beforeEach } from 'vitest'
import { analyzeFuturePredictions, calculateRiskIncrease } from '../src/utils/analytics'

describe('Analytics Integration Tests', () => {
  let patientDataset = []

  beforeEach(() => {
    // Create a realistic patient dataset for integration tests
    patientDataset = [
      // Low-risk younger patients
      { id: 1, age: 35, gender: 'Male', hypertension: 0, heart_disease: 0, smoking_status: 'Never smoked', stroke: 0, risk_level: 'low' },
      { id: 2, age: 38, gender: 'Female', hypertension: 0, heart_disease: 0, smoking_status: 'Never smoked', stroke: 0, risk_level: 'low' },
      
      // Medium-risk middle-aged patients
      { id: 3, age: 50, gender: 'Male', hypertension: 1, heart_disease: 0, smoking_status: 'Formerly smoked', stroke: 0, risk_level: 'medium' },
      { id: 4, age: 52, gender: 'Female', hypertension: 0, heart_disease: 1, smoking_status: 'Never smoked', stroke: 0, risk_level: 'medium' },
      
      // High-risk older patients
      { id: 5, age: 68, gender: 'Male', hypertension: 1, heart_disease: 1, smoking_status: 'Smokes', stroke: 0, risk_level: 'high' },
      { id: 6, age: 72, gender: 'Female', hypertension: 1, heart_disease: 0, smoking_status: 'Formerly smoked', stroke: 1, risk_level: 'high' },
      
      // Edge case: very old patient with multiple conditions
      { id: 7, age: 85, gender: 'Male', hypertension: 1, heart_disease: 1, smoking_status: 'Smokes', stroke: 1, risk_level: 'high' }
    ]
  })

  it('should analyze complete patient dataset and generate meaningful predictions', () => {
    const result = analyzeFuturePredictions(patientDataset)
    
    // Verify structure
    expect(result).toHaveProperty('riskProgression')
    expect(result).toHaveProperty('riskFactorAnalysis')
    expect(result).toHaveProperty('projections')
    expect(result).toHaveProperty('summaryMetrics')
    
    // Verify summary metrics
    expect(result.summaryMetrics.totalPatients).toBe(7)
    expect(result.summaryMetrics.currentHighRiskCount).toBeGreaterThanOrEqual(2)
    expect(result.summaryMetrics.hypertensionCases).toBeGreaterThan(0)
    expect(result.summaryMetrics.heartDiseaseCases).toBeGreaterThan(0)
  })

  it('should track risk progression across age groups', () => {
    const result = analyzeFuturePredictions(patientDataset)
    
    // Should have multiple age groups with patients
    expect(result.riskProgression.length).toBeGreaterThan(0)
    
    // Each age group should have metrics
    result.riskProgression.forEach(group => {
      expect(group).toHaveProperty('ageGroup')
      expect(group).toHaveProperty('patientCount')
      expect(group).toHaveProperty('highRiskPercentage')
      expect(group).toHaveProperty('averageRiskScore')
      expect(group.patientCount).toBeGreaterThan(0)
    })
  })

  it('should identify risk factor impacts (hypertension, heart disease, smoking)', () => {
    const result = analyzeFuturePredictions(patientDataset)
    
    const rfa = result.riskFactorAnalysis
    
    // Verify all risk factors are analyzed
    expect(rfa).toHaveProperty('hypertensionImpact')
    expect(rfa).toHaveProperty('heartDiseaseImpact')
    expect(rfa).toHaveProperty('smokingImpact')
    
    // Hypertension analysis
    expect(rfa.hypertensionImpact.withCondition.length).toBeGreaterThan(0)
    expect(rfa.hypertensionImpact.riskIncrease).toBeDefined()
    
    // Heart disease analysis
    expect(rfa.heartDiseaseImpact.withCondition.length).toBeGreaterThan(0)
    expect(rfa.heartDiseaseImpact.riskIncrease).toBeDefined()
    
    // Smoking analysis
    expect(rfa.smokingImpact.smokers.length).toBeGreaterThanOrEqual(0)
    expect(rfa.smokingImpact.formerSmokers.length).toBeGreaterThanOrEqual(0)
  })

  it('should generate projections and action items based on analysis', () => {
    const result = analyzeFuturePredictions(patientDataset)
    
    const projections = result.projections
    
    // Verify projection fields exist
    expect(projections).toHaveProperty('currentHighRiskPercentage')
    expect(projections).toHaveProperty('projectedHighRiskIn6Months')
    expect(projections).toHaveProperty('projectedHighRiskIn1Year')
    expect(projections).toHaveProperty('estimatedNextCriticalAge')
    expect(projections).toHaveProperty('recommendedActionItems')
    
    // Verify projections are reasonable
    expect(projections.projectedHighRiskIn6Months).toBeGreaterThanOrEqual(projections.currentHighRiskPercentage)
    expect(projections.projectedHighRiskIn1Year).toBeGreaterThanOrEqual(projections.projectedHighRiskIn6Months)
    
    // Should have actionable recommendations
    expect(Array.isArray(projections.recommendedActionItems)).toBe(true)
    expect(projections.recommendedActionItems.length).toBeGreaterThan(0)
    projections.recommendedActionItems.forEach(item => {
      expect(typeof item).toBe('string')
      expect(item.length).toBeGreaterThan(0)
    })
  })

  it('should correctly calculate risk increase for a specific condition across cohorts', () => {
    const result = analyzeFuturePredictions(patientDataset)
    
    // Hypertension risk increase should reflect that hypertensive patients have higher risk
    const hypertensionRiskIncrease = result.riskFactorAnalysis.hypertensionImpact.riskIncrease
    expect(typeof hypertensionRiskIncrease).toBe('number')
    // With our dataset, hypertensive patients should have higher risk, so increase should be >= 0
    expect(hypertensionRiskIncrease).toBeGreaterThanOrEqual(0)
  })

  it('should handle edge cases gracefully', () => {
    // Test with subset of patients
    const smallDataset = patientDataset.slice(0, 2)
    const result = analyzeFuturePredictions(smallDataset)
    
    expect(result.summaryMetrics.totalPatients).toBe(2)
    expect(Array.isArray(result.riskProgression)).toBe(true)
    expect(Array.isArray(result.projections.recommendedActionItems)).toBe(true)
  })

  it('should detect high-risk patient cohorts and recommend interventions', () => {
    const result = analyzeFuturePredictions(patientDataset)
    
    // Should identify high-risk patients
    const highRiskCount = result.summaryMetrics.currentHighRiskCount
    expect(highRiskCount).toBeGreaterThan(0)
    
    // Should recommend interventions for high-risk patients
    const recommendedActionItems = result.projections.recommendedActionItems
    const hasHighRiskWarning = recommendedActionItems.some(item => 
      item.toLowerCase().includes('high') || item.toLowerCase().includes('risk') || item.toLowerCase().includes('monitoring')
    )
    expect(hasHighRiskWarning).toBe(true)
  })

  it('should provide actionable smoking cessation recommendations when smokers are present', () => {
    const result = analyzeFuturePredictions(patientDataset)
    
    const smokerCount = result.riskFactorAnalysis.smokingImpact.smokers.length
    const actions = result.projections.recommendedActionItems
    
    if (smokerCount > 0) {
      const hasSmokingAction = actions.some(item => 
        item.toLowerCase().includes('smoking') || item.toLowerCase().includes('cessation')
      )
      expect(hasSmokingAction).toBe(true)
    }
  })
})
