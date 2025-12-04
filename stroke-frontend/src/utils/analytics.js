// src/utils/analytics.js

export const getRiskLevel = (patient) => patient?.risk_level || 'low'

export const calculateRiskIncrease = (patientList, condition) => {
  if (!patientList || patientList.length === 0) return 0

  const withCondition = patientList.filter(p => Number(p[condition]) === 1)
  const withoutCondition = patientList.filter(p => Number(p[condition]) === 0)

  if (withoutCondition.length === 0) return 0

  const avgRiskWith = withCondition.length > 0 ? 
    withCondition.filter(p => p.risk_level === 'high').length / withCondition.length : 0
  const avgRiskWithout = 
    withoutCondition.filter(p => p.risk_level === 'high').length / withoutCondition.length

  return Math.round((avgRiskWith - avgRiskWithout) * 100)
}

export const analyzeFuturePredictions = (patientList) => {
  if (!patientList || patientList.length === 0) {
    return {
      riskProgression: [],
      riskFactorAnalysis: {
        hypertensionImpact: { withCondition: [], riskIncrease: 0 },
        heartDiseaseImpact: { withCondition: [], riskIncrease: 0 },
        smokingImpact: { smokers: [], formerSmokers: [] }
      },
      projections: {
        currentHighRiskPercentage: 0,
        projectedHighRiskIn6Months: 0,
        projectedHighRiskIn1Year: 0,
        estimatedNextCriticalAge: 0,
        recommendedActionItems: ['No patient data available to generate projections yet.']
      },
      summaryMetrics: {
        totalPatients: 0,
        currentHighRiskCount: 0,
        hypertensionCases: 0,
        heartDiseaseCases: 0,
        smokingCases: 0,
        strokeHistoryCases: 0
      }
    }
  }

  const normalized = patientList.map(p => ({
    ...p,
    age: Number(p.age) || 0,
    hypertension: Number(p.hypertension) || 0,
    heart_disease: Number(p.heart_disease) || 0,
    stroke: Number(p.stroke) || 0,
    avg_glucose_level: Number(p.avg_glucose_level) || 0,
    bmi: Number(p.bmi) || 0,
    risk_level: getRiskLevel(p)
  }))

  const ageGroups = {
    under40: normalized.filter(p => p.age < 40),
    age40to50: normalized.filter(p => p.age >= 40 && p.age < 50),
    age50to60: normalized.filter(p => p.age >= 50 && p.age < 60),
    age60plus: normalized.filter(p => p.age >= 60)
  }

  const riskProgression = Object.entries(ageGroups).map(([group, patients]) => {
    if (patients.length === 0) return null
    const highRiskCount = patients.filter(p => p.risk_level === 'high').length
    const mediumRiskCount = patients.filter(p => p.risk_level === 'medium').length
    const avgRisk = patients.reduce((sum, p) => {
      const riskVal = p.risk_level === 'high' ? 75 : p.risk_level === 'medium' ? 40 : 15
      return sum + riskVal
    }, 0) / patients.length

    return {
      ageGroup: group === 'under40' ? 'Under 40' : group === 'age40to50' ? '40-50' : group === 'age50to60' ? '50-60' : '60+',
      patientCount: patients.length,
      highRiskPercentage: (highRiskCount / patients.length) * 100,
      mediumRiskPercentage: (mediumRiskCount / patients.length) * 100,
      averageRiskScore: Math.round(avgRisk)
    }
  }).filter(Boolean)

  const riskFactorAnalysis = {
    hypertensionImpact: {
      withCondition: normalized.filter(p => p.hypertension === 1),
      riskIncrease: calculateRiskIncrease(normalized, 'hypertension')
    },
    heartDiseaseImpact: {
      withCondition: normalized.filter(p => p.heart_disease === 1),
      riskIncrease: calculateRiskIncrease(normalized, 'heart_disease')
    },
    smokingImpact: {
      smokers: normalized.filter(p => p.smoking_status === 'Smokes'),
      formerSmokers: normalized.filter(p => p.smoking_status === 'Formerly smoked')
    }
  }

  const currentHighRiskPercentage = (normalized.filter(p => p.risk_level === 'high').length / normalized.length) * 100
  const projectedHighRiskIn6Months = Math.round(currentHighRiskPercentage * 1.15)
  const projectedHighRiskIn1Year = Math.round(currentHighRiskPercentage * 1.25)

  const avgAge = normalized.reduce((sum, p) => sum + p.age, 0) / normalized.length
  const estimatedNextCriticalAge = Math.ceil(avgAge / 10) * 10 + 10

  return {
    riskProgression,
    riskFactorAnalysis,
    projections: {
      currentHighRiskPercentage: Math.round(currentHighRiskPercentage),
      projectedHighRiskIn6Months,
      projectedHighRiskIn1Year,
      estimatedNextCriticalAge,
      recommendedActionItems: [
        `${projectedHighRiskIn6Months - Math.round(currentHighRiskPercentage)}% additional high-risk patients expected in 6 months`,
        `Close monitoring recommended for patients aged ${Math.ceil(avgAge / 5) * 5}-${Math.ceil(avgAge / 5) * 5 + 5}`,
        `Preventive intervention program recommended for medium-risk patients`,
        riskFactorAnalysis.hypertensionImpact.withCondition.length > 0 ? 
          `${riskFactorAnalysis.hypertensionImpact.withCondition.length} patients with hypertension need additional monitoring` : '',
        riskFactorAnalysis.smokingImpact.smokers.length > 0 ? 
          `Smoking cessation program recommended for ${riskFactorAnalysis.smokingImpact.smokers.length} active smokers` : ''
      ].filter(Boolean)
    },
    summaryMetrics: {
      totalPatients: normalized.length,
      currentHighRiskCount: normalized.filter(p => p.risk_level === 'high').length,
      hypertensionCases: normalized.filter(p => p.hypertension === 1).length,
      heartDiseaseCases: normalized.filter(p => p.heart_disease === 1).length,
      smokingCases: normalized.filter(p => p.smoking_status === 'Smokes').length,
      strokeHistoryCases: normalized.filter(p => p.stroke === 1).length
    }
  }
}
