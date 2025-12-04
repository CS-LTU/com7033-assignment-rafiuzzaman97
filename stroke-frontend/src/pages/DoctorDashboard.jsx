// src/pages/DoctorDashboard.jsx
// Doctor Dashboard Component - displays patient list with search, view, edit, and delete functionality
// Shows patient analytics, risk distribution, demographics, and medical history charts
import React, {useEffect, useState} from 'react'
import { fetchDoctorPatients, getDashboardStats, getRiskFactors, updatePatientProfile, deletePatientRecord } from '../api'
import { useAuth } from '../contexts/AuthContext'
import { motion } from 'framer-motion'
import { FaUserInjured, FaNotesMedical, FaSearch, FaExclamationTriangle, FaChartBar, FaVenusMars, FaBirthdayCake, FaHeartbeat } from 'react-icons/fa'
import { sanitizeInput } from '../utils/validation'

// Dropdown option arrays for form fields
const WORK_TYPE_OPTIONS = ['Private', 'Self-employed', 'Govt_job', 'Children', 'Never_worked']
const RESIDENCE_OPTIONS = ['Urban', 'Rural']
const SMOKING_OPTIONS = ['Never smoked', 'Smokes', 'Formerly smoked', 'Unknown']
const GENDER_OPTIONS = ['Male', 'Female', 'Other']

// Function to create interactive button styling with hover effects
// Returns style object and mouse event handlers for dynamic button styling
const createButtonInteraction = (
  baseBg,
  baseBorder,
  baseColor,
  hoverBg,
  hoverBorder = baseBorder,
  hoverColor = baseColor
) => {
  // Base styling applied when button is not hovered
  const style = {
    backgroundColor: baseBg,
    border: `1px solid ${baseBorder}`,
    color: baseColor
  }

  // Mouse event handlers to toggle styling on hover
  const handlers = {
    onMouseEnter: (e) => {
      e.currentTarget.style.backgroundColor = hoverBg
      e.currentTarget.style.borderColor = hoverBorder
      e.currentTarget.style.color = hoverColor
    },
    onMouseLeave: (e) => {
      e.currentTarget.style.backgroundColor = baseBg
      e.currentTarget.style.borderColor = baseBorder
      e.currentTarget.style.color = baseColor
    }
  }

  return { style, handlers }
}

// Main Doctor Dashboard component - manages patient data, editing, and analytics
export default function DoctorDashboard(){
  // Get authenticated doctor user from auth context
  const { user } = useAuth()
  
  // State for storing complete list of patients fetched from API
  const [patients, setPatients] = useState([])
  
  // State for storing filtered patients based on search criteria
  const [filteredPatients, setFilteredPatients] = useState([])
  
  // State to track if patient data is being loaded from API
  const [loading, setLoading] = useState(true)
  
  // State to store search term for filtering patients
  const [searchTerm, setSearchTerm] = useState('')
  
  // State for storing currently selected patient for detailed view
  const [selectedPatient, setSelectedPatient] = useState(null)
  
  // State to track which patient is currently being edited
  const [editPatient, setEditPatient] = useState(null)
  
  // State for storing edited patient form data before save
  const [editForm, setEditForm] = useState(null)
  
  // State for displaying action success/error messages
  const [actionMessage, setActionMessage] = useState('')
  
  // State to track which patient is being deleted (for loading UI)
  const [actionLoadingId, setActionLoadingId] = useState(null)
  
  // State to track if patient edit is being saved to API
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  
  // Flag to determine if action message is error or success
  const actionIsError = actionMessage.toLowerCase().includes('fail') || actionMessage.toLowerCase().includes('error')
  
  // Button style configurations for View, Edit, and Delete buttons with hover effects
  const viewButtonProps = createButtonInteraction('#eff6ff', '#bfdbfe', '#1d4ed8', '#dbeafe')
const editButtonProps = createButtonInteraction('#eef2ff', '#c7d2fe', '#4338ca', '#e0e7ff')
const deleteButtonProps = createButtonInteraction('#fee2e2', '#fecaca', '#b91c1c', '#fecaca', '#fca5a5', '#7f1d1d')
  
  // State for pagination - current page number
  const [currentPage, setCurrentPage] = useState(1)
  
  // Number of patients to display per page
  const PATIENTS_PER_PAGE = 10
  
  // State for storing dashboard statistics and analytics data
  const [stats, setStats] = useState({
    totalPatients: 0,
    highRisk: 0,
    averageAge: 0,
    genderDistribution: { male: 0, female: 0, other: 0 },
    strokeCases: 0,
    hypertensionCases: 0,
    heartDiseaseCases: 0
  })
  
  // State to store advanced analytics data from the API
  const [analyticsData, setAnalyticsData] = useState(null)
  
  // State for active tab view (patients or prediction)
  const [activeTab, setActiveTab] = useState('patients')
  
  // State for storing prediction analysis results
  const [predictionAnalysis, setPredictionAnalysis] = useState(null)

  // Effect hook to load patient data when component mounts or user changes
  // Fetches patients from API and calculates analytics statistics
  useEffect(() => {
    if (!user) return;

    // Async function to load all dashboard data
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        // Fetch patients from API
        const patientsResponse = await fetchDoctorPatients();
        const realPatients = patientsResponse.patients || [];
        console.log('Fetched patients:', realPatients.length, realPatients); // DEBUG
        setPatients(realPatients);
        setFilteredPatients(realPatients);

        // Try to fetch analytics data (optional - ignore if fails)
        let analyticsStats = null;
        let riskFactors = null;
        try {
          analyticsStats = await getDashboardStats();
          riskFactors = await getRiskFactors();
          setAnalyticsData(analyticsStats);
        } catch {
          // optional analytics, ignore failures
        }

        // Calculate statistics from patient data
        const totalPatients = realPatients.length;
        const highRiskCount = realPatients.filter(p => p.risk_level === 'high').length;
        const averageAge =
          totalPatients > 0
            ? Math.round(realPatients.reduce((sum, p) => sum + (p.age || 0), 0) / totalPatients)
            : 0;

        // Update stats state with calculated and API data
        setStats({
          totalPatients: analyticsStats?.total_patients || totalPatients,
          highRisk: analyticsStats?.risk_distribution?.high || highRiskCount,
          averageAge: Math.round(analyticsStats?.age_stats?.average || averageAge),
          genderDistribution:
            analyticsStats?.gender_distribution || {
              male: realPatients.filter(p => p.gender === 'Male').length,
              female: realPatients.filter(p => p.gender === 'Female').length,
              other: realPatients.filter(p => !['Male', 'Female'].includes(p.gender)).length,
            },
          strokeCases: analyticsStats?.stroke_cases || realPatients.filter(p => p.stroke === 1).length,
          hypertensionCases: riskFactors?.hypertension_cases || realPatients.filter(p => p.hypertension === 1).length,
          heartDiseaseCases: riskFactors?.heart_disease_cases || realPatients.filter(p => p.heart_disease === 1).length,
        });

        // Calculate future predictions based on patient data
        console.log('Calculating initial predictions from', realPatients.length, 'patients'); // DEBUG
        try {
          const predictions = analyzeFuturePredictions(realPatients);
          console.log('Initial predictions calculated:', predictions); // DEBUG
          setPredictionAnalysis(predictions);
          console.log('PredictionAnalysis state updated');
        } catch (predictionError) {
          console.error('Error calculating predictions:', predictionError);
          setPredictionAnalysis(null);
        }
      } catch (error) {
        console.error('Dashboard load failed:', error);
        // optional fallback data here
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user]);


  useEffect(() => {
    console.log('useEffect [searchTerm, patients] triggered with', patients.length, 'patients'); // DEBUG
    const filtered = patients.filter(patient =>
      patient.gender?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.age?.toString().includes(searchTerm) ||
      patient.work_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.smoking_status?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    console.log('Filtered to', filtered.length, 'patients'); // DEBUG
    setFilteredPatients(filtered)
    setCurrentPage(1)
    calculateStats(filtered)
    // Recalculate predictions when filtered data changes
    const predictions = analyzeFuturePredictions(filtered.length > 0 ? filtered : patients);
    console.log('Filtered predictions calculated:', predictions); // DEBUG
    setPredictionAnalysis(predictions);
    console.log('PredictionAnalysis state updated after filter'); // DEBUG
  }, [searchTerm, patients])

  // Function to calculate and update statistics for displayed patients
  // Calculates total, high-risk count, average age, and gender distribution
  const calculateStats = (patientList) => {
    const total = patientList.length
    const highRisk = patientList.filter(p => p.risk_level === 'high').length
    const averageAge = total > 0 ? Math.round(patientList.reduce((sum, p) => sum + (p.age || 0), 0) / total) : 0
    
    // Calculate gender breakdown
    const genderDistribution = {
      male: patientList.filter(p => p.gender === 'Male').length,
      female: patientList.filter(p => p.gender === 'Female').length,
      other: patientList.filter(p => !['Male', 'Female'].includes(p.gender)).length
    }

    // Update stats state with calculated values
    setStats(prevStats => ({
      ...prevStats,
      totalPatients: total,
      highRisk,
      averageAge,
      genderDistribution
    }))
  }

  // Function to get risk level from patient data
  // Returns patient's risk level or defaults to 'low'
  const getRiskLevel = (patient) => {
    return patient.risk_level || 'low'
  }

  // Helper function to get patient ID regardless of field name (id or _id)
  // Some databases use different field names for IDs
  const getPatientIdentifier = (patient) => patient?.id ?? patient?._id

  // Function to analyze future stroke risk predictions based on patient data
  // Generates predictive analytics by analyzing age groups, medical conditions, and risk trends
  const analyzeFuturePredictions = (patientList) => {
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
    const projectedHighRiskIn6Months = Math.round(currentHighRiskPercentage * 1.15) // Assume 15% increase
    const projectedHighRiskIn1Year = Math.round(currentHighRiskPercentage * 1.25) // Assume 25% increase

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

  // Helper function to calculate risk increase percentage for specific medical conditions
  const calculateRiskIncrease = (patientList, condition) => {
    if (patientList.length === 0) return 0
    
    const withCondition = patientList.filter(p => p[condition] === 1)
    const withoutCondition = patientList.filter(p => p[condition] === 0)

    if (withoutCondition.length === 0) return 0

    const avgRiskWith = withCondition.length > 0 ? 
      withCondition.filter(p => p.risk_level === 'high').length / withCondition.length : 0
    const avgRiskWithout = 
      withoutCondition.filter(p => p.risk_level === 'high').length / withoutCondition.length

    return Math.round((avgRiskWith - avgRiskWithout) * 100)
  }

  // Function to set selected patient for viewing detailed information
  const handleViewDetails = (patient) => {
    setSelectedPatient(patient)
    setEditPatient(null)
    setEditForm(null)
    setActionMessage('')
  }

  // Function to initialize edit form with current patient data
  // Creates form object with all patient fields and their current values
  const initializeEditForm = (patient) => ({
    gender: patient.gender || 'Male',
    age: patient.age ?? '',
    hypertension: Number(patient.hypertension ?? 0),
    heart_disease: Number(patient.heart_disease ?? 0),
    ever_married: patient.ever_married || 'No',
    work_type: patient.work_type || 'Private',
    Residence_type: patient.Residence_type || 'Urban',
    avg_glucose_level: patient.avg_glucose_level ?? '',
    bmi: patient.bmi ?? '',
    smoking_status: patient.smoking_status || 'Unknown',
    stroke: Number(patient.stroke ?? 0)
  })

  // Function to initiate patient edit mode
  // Sets selected patient and initializes edit form with current data
  const handleEditPatient = (patient) => {
    setSelectedPatient(patient)
    setEditPatient(patient)
    setEditForm(initializeEditForm(patient))
    setActionMessage('')
  }

  // Function to update a single field in the edit form
  const handleEditFieldChange = (field, value) => {
    setEditForm(prev => ({ ...prev, [field]: value }))
  }

  // Function to save edited patient data back to the API
  // Validates data, sends update request, and updates patient list
  const saveEditedPatient = async () => {
    if (!editPatient || !editForm) return
    const patientId = getPatientIdentifier(editPatient)
    if (!patientId) return

    setIsSavingEdit(true)
    setActionMessage('')
    
    // Create payload with edited patient data
    const payload = {
      gender: editForm.gender,
      age: Number(editForm.age),
      hypertension: Number(editForm.hypertension),
      heart_disease: Number(editForm.heart_disease),
      ever_married: editForm.ever_married,
      work_type: editForm.work_type,
      Residence_type: editForm.Residence_type,
      avg_glucose_level: Number(editForm.avg_glucose_level),
      bmi: Number(editForm.bmi),
      smoking_status: editForm.smoking_status,
      stroke: Number(editForm.stroke)
    }

    // Validate that all numeric fields contain valid numbers
    const numericFields = [
      ['age', payload.age],
      ['avg glucose level', payload.avg_glucose_level],
      ['BMI', payload.bmi]
    ]
    if (numericFields.some(([_, value]) => Number.isNaN(value))) {
      setIsSavingEdit(false)
      setActionMessage('Please provide valid numeric values before saving.')
      return
    }

    try {
      // Send update request to API
      const response = await updatePatientProfile(patientId, payload)
      const updatedPatient = response?.patient || { ...editPatient, ...payload }
      
      // Update patient in list with new data
      setPatients(prev =>
        prev.map(p =>
          getPatientIdentifier(p) === patientId ? { ...p, ...updatedPatient } : p
        )
      )
      
      // Update selected patient view and exit edit mode
      setSelectedPatient(updatedPatient)
      setEditPatient(null)
      setEditForm(null)
      setActionMessage('Patient updated successfully.')
    } catch (error) {
      setActionMessage(error.message || 'Failed to update patient.')
    } finally {
      setIsSavingEdit(false)
    }
  }

  // Function to delete a patient record after confirmation
  // Sends delete request to API and removes patient from list
  const handleDeletePatient = async (patient) => {
    const patientId = getPatientIdentifier(patient)
    if (!patientId) return
    
    // Ask for confirmation before deleting
    if (!window.confirm('Are you sure you want to delete this patient record?')) return

    setActionLoadingId(patientId)
    setActionMessage('')
    try {
      // Send delete request to API
      await deletePatientRecord(patientId)
      
      // Remove patient from list
      setPatients(prev => prev.filter(p => getPatientIdentifier(p) !== patientId))
      
      // Clear selected patient if it was the deleted one
      setSelectedPatient(prev => (prev && getPatientIdentifier(prev) === patientId ? null : prev))
      
      // Clear edit form if editing the deleted patient
      if (editPatient && getPatientIdentifier(editPatient) === patientId) {
        setEditPatient(null)
        setEditForm(null)
      }
      setActionMessage('Patient deleted successfully.')
    } catch (error) {
      setActionMessage(error.message || 'Failed to delete patient.')
    } finally {
      setActionLoadingId(null)
    }
  }

  const RiskBadge = ({ level }) => {
    const styles = {
      high: 'bg-red-100 text-red-800 border-red-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-green-100 text-green-800 border-green-200'
    }
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${styles[level]}`}>
        {level?.toUpperCase() || 'LOW'} RISK
      </span>
    )
  }

  // Chart components
  const RiskDistributionChart = () => {
    const riskLevels = analyticsData?.risk_distribution || filteredPatients.reduce((acc, patient) => {
      const level = getRiskLevel(patient)
      acc[level] = (acc[level] || 0) + 1
      return acc
    }, { high: 0, medium: 0, low: 0 })

    const total = analyticsData?.total_patients || filteredPatients.length
    if (total === 0) return <div className="text-gray-500 text-center py-4">No data available</div>

    return (
      <div className="space-y-2">
        {Object.entries(riskLevels).map(([level, count]) => {
          const percentage = total > 0 ? (count / total) * 100 : 0
          const colors = {
            high: 'bg-red-500',
            medium: 'bg-yellow-500',
            low: 'bg-green-500'
          }
          
          return (
            <div key={level} className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 capitalize">{level} Risk</span>
              <div className="flex items-center gap-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${colors[level]}`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                <span className="text-xs text-gray-600 w-8">{count}</span>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const GenderDistributionChart = () => {
    const genderData = analyticsData?.gender_distribution || stats.genderDistribution
    const total = analyticsData?.total_patients || Object.values(genderData).reduce((sum, count) => sum + count, 0)
    
    if (total === 0) return <div className="text-gray-500 text-center py-4">No data available</div>

    return (
      <div className="space-y-2">
        {[
          { label: 'Male', count: genderData.Male || genderData.male || 0, color: 'bg-blue-500' },
          { label: 'Female', count: genderData.Female || genderData.female || 0, color: 'bg-pink-500' },
          { label: 'Other', count: genderData.Other || genderData.other || 0, color: 'bg-purple-500' }
        ].map(({ label, count, color }) => {
          const percentage = total > 0 ? (count / total) * 100 : 0
          return (
            <div key={label} className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">{label}</span>
              <div className="flex items-center gap-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${color}`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                <span className="text-xs text-gray-600 w-8">{count}</span>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const AgeDistributionChart = () => {
    const ageGroups = {
      'Under 40': filteredPatients.filter(p => p.age < 40).length,
      '40-59': filteredPatients.filter(p => p.age >= 40 && p.age <= 59).length,
      '60+': filteredPatients.filter(p => p.age >= 60).length
    }

    const total = filteredPatients.length
    if (total === 0) return <div className="text-gray-500 text-center py-4">No data available</div>

    return (
      <div className="space-y-2">
        {Object.entries(ageGroups).map(([group, count]) => {
          const percentage = total > 0 ? (count / total) * 100 : 0
          return (
            <div key={group} className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">{group}</span>
              <div className="flex items-center gap-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full bg-indigo-500"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                <span className="text-xs text-gray-600 w-8">{count}</span>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // Additional Statistics Cards for Stroke Dataset
  const AdditionalStatsCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="flex items-center">
          <div className="p-3 bg-red-100 rounded-lg mr-4">
            <FaHeartbeat className="text-red-600 text-xl" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-800">{stats.strokeCases}</h3>
            <p className="text-gray-600 text-sm">Stroke Cases</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="flex items-center">
          <div className="p-3 bg-orange-100 rounded-lg mr-4">
            <FaHeartbeat className="text-orange-600 text-xl" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-800">{stats.hypertensionCases}</h3>
            <p className="text-gray-600 text-sm">Hypertension Cases</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="flex items-center">
          <div className="p-3 bg-purple-100 rounded-lg mr-4">
            <FaHeartbeat className="text-purple-600 text-xl" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-800">{stats.heartDiseaseCases}</h3>
            <p className="text-gray-600 text-sm">Heart Disease Cases</p>
          </div>
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="container mx-auto p-8">
        <div className="card text-center">
          <div className="flex justify-center items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span>Loading patient data from database...</span>
          </div>
        </div>
      </div>
    )
  }

  const totalPages = Math.max(1, Math.ceil(filteredPatients.length / PATIENTS_PER_PAGE))
  const startIndex = (currentPage - 1) * PATIENTS_PER_PAGE
  const paginatedPatients = filteredPatients.slice(startIndex, startIndex + PATIENTS_PER_PAGE)
  const pageStart = filteredPatients.length === 0 ? 0 : startIndex + 1
  const pageEnd = Math.min(startIndex + PATIENTS_PER_PAGE, filteredPatients.length)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto px-4 py-8"
    >
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Doctor Dashboard</h1>
        <p className="text-gray-600">
          Welcome, Dr. {user?.username}. You have {filteredPatients.length} patients to review.
          {analyticsData && <span className="text-green-600 ml-2">✓ Connected to Database</span>}
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-8 flex gap-2 border-b-2 border-gray-300">
        <button
          onClick={() => setActiveTab('patients')}
          className={`px-8 py-4 font-bold text-lg border-b-4 transition-all ${
            activeTab === 'patients'
              ? 'border-blue-600 text-blue-600 bg-blue-50 rounded-t-lg'
              : 'border-transparent text-gray-600 hover:text-blue-500 hover:bg-gray-50'
          }`}
        >
          📋 Patient Management
        </button>
        <button
          onClick={() => {
            console.log('🖱️ BUTTON CLICKED: Future Predictions tab');
            setActiveTab('prediction');
            console.log('🎯 activeTab set to prediction');
          }}
          className={`px-8 py-4 font-bold text-lg border-b-4 transition-all ${
            activeTab === 'prediction'
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50 rounded-t-lg'
              : 'border-transparent text-gray-600 hover:text-indigo-500 hover:bg-gray-50'
          }`}
        >
          🔮 Future Predictions
        </button>
      </div>

      {/* Statistics Cards - Patient Management Tab */}
      {activeTab === 'patients' && (
      <div className="space-y-8">
        {console.log('🎯 RENDER Patient Management Tab: activeTab=', activeTab, 'filteredPatients=', filteredPatients.length)}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg mr-4">
              <FaUserInjured className="text-blue-600 text-xl" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-800">{stats.totalPatients}</h3>
              <p className="text-gray-600 text-sm">Total Patients</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-lg mr-4">
              <FaExclamationTriangle className="text-red-600 text-xl" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-800">{stats.highRisk}</h3>
              <p className="text-gray-600 text-sm">High Risk Patients</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg mr-4">
              <FaBirthdayCake className="text-green-600 text-xl" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-800">{stats.averageAge}</h3>
              <p className="text-gray-600 text-sm">Average Age</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg mr-4">
              <FaHeartbeat className="text-purple-600 text-xl" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-800">{filteredPatients.length}</h3>
              <p className="text-gray-600 text-sm">Active Cases</p>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Stats from Stroke Dataset */}
      <AdditionalStatsCards />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Risk Distribution Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FaChartBar className="text-red-500" />
            Risk Distribution
          </h3>
          <RiskDistributionChart />
        </div>

        {/* Gender Distribution Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FaVenusMars className="text-blue-500" />
            Gender Distribution
          </h3>
          <GenderDistributionChart />
        </div>

        {/* Age Distribution Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FaBirthdayCake className="text-indigo-500" />
            Age Distribution
          </h3>
          <AgeDistributionChart />
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex-1 w-full md:w-auto">
            <div className="relative">
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search patients by gender, age, work type, or smoking status..."
                value={searchTerm}
                onChange={e => setSearchTerm(sanitizeInput(e.target.value))}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="text-sm text-gray-600">
            Showing {filteredPatients.length} of {patients.length} patients
            {analyticsData && ` (Total in database: ${analyticsData.total_patients})`}
          </div>
        </div>
      </div>

      {/* Patients Table */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FaUserInjured />
          Patient List {analyticsData && `- Real Data from Database`}
        </h2>

        {filteredPatients.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FaUserInjured className="text-4xl mx-auto mb-4 text-gray-300" />
            <p>No patients found matching your search criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Patient ID</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Age</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Gender</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Work Type</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Smoking Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Risk Level</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedPatients.map((patient, index) => {
                  const tableIndex = startIndex + index
                  return (
                  <motion.tr
                    key={patient.id || tableIndex}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (index % PATIENTS_PER_PAGE) * 0.05 }}
                  >
                    <td className="py-3 px-4 text-sm font-mono text-gray-600">
                      #{String(patient.id || tableIndex + 1).slice(-6)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-gray-800">{patient.age}</span> years
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {sanitizeInput(patient.gender || 'Unknown')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-600">
                        {patient.work_type ? sanitizeInput(patient.work_type) : 'Not specified'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-600">
                        {patient.smoking_status ? sanitizeInput(patient.smoking_status) : 'Unknown'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <RiskBadge level={getRiskLevel(patient)} />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleViewDetails(patient)}
                          className="text-sm font-semibold px-3 py-1 rounded-lg border transition-colors"
                          style={viewButtonProps.style}
                          {...viewButtonProps.handlers}
                        >
                          View Details
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEditPatient(patient)}
                          className="text-sm font-semibold px-3 py-1 rounded-lg border transition-colors"
                          style={editButtonProps.style}
                          {...editButtonProps.handlers}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePatient(patient)}
                          disabled={actionLoadingId === getPatientIdentifier(patient)}
                          className="text-sm font-semibold px-3 py-1 rounded-lg border transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          style={deleteButtonProps.style}
                          {...(actionLoadingId === getPatientIdentifier(patient) ? {} : deleteButtonProps.handlers)}
                        >
                          {actionLoadingId === getPatientIdentifier(patient) ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                  )
                })}
              </tbody>
            </table>

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mt-4 text-sm text-gray-600">
              <span>
                Showing {pageStart} - {pageEnd} of {filteredPatients.length} patients
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100"
                  style={{ color: '#374151' }}
                >
                  Previous
                </button>
                <span className="font-medium">
                  Page {totalPages === 0 ? 0 : currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage >= totalPages}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100"
                  style={{ color: '#374151' }}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {actionMessage && (
        <div className={`mt-6 p-4 rounded-lg border ${actionIsError ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
          {actionMessage}
        </div>
      )}

      {selectedPatient && (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <FaNotesMedical />
              Patient Details
            </h3>
            <button
              className="text-sm text-gray-500 hover:text-gray-700"
              onClick={() => setSelectedPatient(null)}
            >
              Close
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><span className="font-semibold text-gray-600">Patient ID:</span> {getPatientIdentifier(selectedPatient)}</div>
            <div><span className="font-semibold text-gray-600">Gender:</span> {selectedPatient.gender || 'N/A'}</div>
            <div><span className="font-semibold text-gray-600">Age:</span> {selectedPatient.age ?? 'N/A'}</div>
            <div><span className="font-semibold text-gray-600">Work Type:</span> {selectedPatient.work_type || 'N/A'}</div>
            <div><span className="font-semibold text-gray-600">Residence:</span> {selectedPatient.Residence_type || 'N/A'}</div>
            <div><span className="font-semibold text-gray-600">Smoking Status:</span> {selectedPatient.smoking_status || 'N/A'}</div>
            <div><span className="font-semibold text-gray-600">Average Glucose:</span> {selectedPatient.avg_glucose_level ?? 'N/A'}</div>
            <div><span className="font-semibold text-gray-600">BMI:</span> {selectedPatient.bmi ?? 'N/A'}</div>
            <div><span className="font-semibold text-gray-600">Hypertension:</span> {selectedPatient.hypertension === 1 ? 'Yes' : 'No'}</div>
            <div><span className="font-semibold text-gray-600">Heart Disease:</span> {selectedPatient.heart_disease === 1 ? 'Yes' : 'No'}</div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="font-semibold text-gray-600">Risk Level:</span>
            <RiskBadge level={getRiskLevel(selectedPatient)} />
          </div>
        </div>
      )}

      {editForm && (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 mt-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Update Patient Record</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
              <select
                value={editForm.gender}
                onChange={e => handleEditFieldChange('gender', e.target.value)}
                className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {GENDER_OPTIONS.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
              <input
                type="number"
                min="0"
                max="120"
                value={editForm.age}
                onChange={e => handleEditFieldChange('age', e.target.value)}
                className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hypertension</label>
              <select
                value={editForm.hypertension}
                onChange={e => handleEditFieldChange('hypertension', Number(e.target.value))}
                className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={0}>No</option>
                <option value={1}>Yes</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Heart Disease</label>
              <select
                value={editForm.heart_disease}
                onChange={e => handleEditFieldChange('heart_disease', Number(e.target.value))}
                className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={0}>No</option>
                <option value={1}>Yes</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Marital Status</label>
              <select
                value={editForm.ever_married}
                onChange={e => handleEditFieldChange('ever_married', e.target.value)}
                className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Work Type</label>
              <select
                value={editForm.work_type}
                onChange={e => handleEditFieldChange('work_type', e.target.value)}
                className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {WORK_TYPE_OPTIONS.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Residence Type</label>
              <select
                value={editForm.Residence_type}
                onChange={e => handleEditFieldChange('Residence_type', e.target.value)}
                className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {RESIDENCE_OPTIONS.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Average Glucose Level</label>
              <input
                type="number"
                step="0.1"
                value={editForm.avg_glucose_level}
                onChange={e => handleEditFieldChange('avg_glucose_level', e.target.value)}
                className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">BMI</label>
              <input
                type="number"
                step="0.1"
                value={editForm.bmi}
                onChange={e => handleEditFieldChange('bmi', e.target.value)}
                className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Smoking Status</label>
              <select
                value={editForm.smoking_status}
                onChange={e => handleEditFieldChange('smoking_status', e.target.value)}
                className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {SMOKING_OPTIONS.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Stroke History</label>
              <select
                value={editForm.stroke}
                onChange={e => handleEditFieldChange('stroke', Number(e.target.value))}
                className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={0}>No</option>
                <option value={1}>Yes</option>
              </select>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={saveEditedPatient}
              disabled={isSavingEdit}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSavingEdit ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={() => { setEditPatient(null); setEditForm(null); }}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      </div>
      )}

      {/* Future Predictions Tab */}
      {activeTab === 'prediction' && (
        <div className="space-y-6">
          {console.log('🎯 RENDER Future Predictions Tab: activeTab=', activeTab, 'predictionAnalysis exists=', !!predictionAnalysis, 'totalPatients=', predictionAnalysis?.summaryMetrics?.totalPatients)}
          {!predictionAnalysis || predictionAnalysis.summaryMetrics.totalPatients === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center">
              <p className="text-yellow-800 font-medium">
                {patients.length === 0 
                  ? '⏳ Loading patient data... Predictions will appear once data is loaded.' 
                  : '⏳ Calculating predictions based on patient data...'}
              </p>
            </div>
          ) : (
            <>
          {/* Prediction Summary Header */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-lg p-8 border border-blue-200">
            <h2 className="text-2xl font-bold text-blue-900 mb-2">Stroke Risk Prediction Analysis</h2>
            <p className="text-blue-700">
              Advanced predictive analytics based on {predictionAnalysis.summaryMetrics.totalPatients} patient records
            </p>
          </div>

          {/* Key Prediction Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg mr-4">
                  <FaChartBar className="text-blue-600 text-xl" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">{predictionAnalysis.projections.currentHighRiskPercentage}%</h3>
                  <p className="text-gray-600 text-sm">Current High Risk</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-orange-200">
              <div className="flex items-center">
                <div className="p-3 bg-orange-100 rounded-lg mr-4">
                  <FaExclamationTriangle className="text-orange-600 text-xl" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">{predictionAnalysis.projections.projectedHighRiskIn6Months}%</h3>
                  <p className="text-gray-600 text-sm">Projected in 6 Months</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-red-200">
              <div className="flex items-center">
                <div className="p-3 bg-red-100 rounded-lg mr-4">
                  <FaHeartbeat className="text-red-600 text-xl" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">{predictionAnalysis.projections.projectedHighRiskIn1Year}%</h3>
                  <p className="text-gray-600 text-sm">Projected in 1 Year</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-purple-200">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-lg mr-4">
                  <FaBirthdayCake className="text-purple-600 text-xl" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">{predictionAnalysis.projections.estimatedNextCriticalAge}</h3>
                  <p className="text-gray-600 text-sm">Critical Age Threshold</p>
                </div>
              </div>
            </div>
          </div>

          {/* Risk Factor Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FaHeartbeat className="text-red-500" />
                Medical Condition Impact
              </h3>
              <div className="space-y-4">
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-red-900">Hypertension Cases</span>
                    <span className="text-2xl font-bold text-red-600">{predictionAnalysis.summaryMetrics.hypertensionCases}</span>
                  </div>
                  <p className="text-sm text-red-700">
                    Risk increase: +{calculateRiskIncrease(filteredPatients, 'hypertension')}% vs patients without condition
                  </p>
                </div>

                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-orange-900">Heart Disease Cases</span>
                    <span className="text-2xl font-bold text-orange-600">{predictionAnalysis.summaryMetrics.heartDiseaseCases}</span>
                  </div>
                  <p className="text-sm text-orange-700">
                    Risk increase: +{calculateRiskIncrease(filteredPatients, 'heart_disease')}% vs patients without condition
                  </p>
                </div>

                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-yellow-900">Active Smoking Cases</span>
                    <span className="text-2xl font-bold text-yellow-600">{predictionAnalysis.summaryMetrics.smokingCases}</span>
                  </div>
                  <p className="text-sm text-yellow-700">
                    Smoking cessation program recommended for risk reduction
                  </p>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-purple-900">Prior Stroke Cases</span>
                    <span className="text-2xl font-bold text-purple-600">{predictionAnalysis.summaryMetrics.strokeHistoryCases}</span>
                  </div>
                  <p className="text-sm text-purple-700">
                    Highest priority for intensive monitoring and intervention
                  </p>
                </div>
              </div>
            </div>

            {/* Age Group Risk Progression */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FaBirthdayCake className="text-indigo-500" />
                Risk Progression by Age Group
              </h3>
              <div className="space-y-3">
                {predictionAnalysis.riskProgression.map((group, idx) => (
                  <div key={idx} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-gray-700">{group.ageGroup} years</span>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {group.patientCount} patients
                      </span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">High Risk %:</span>
                        <span className="font-semibold text-red-600">{Math.round(group.highRiskPercentage)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Avg Risk Score:</span>
                        <span className="font-semibold text-indigo-600">{group.averageRiskScore}/100</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recommended Actions */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-green-200 bg-green-50">
            <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center gap-2">
              <FaHeartbeat className="text-green-600" />
              Clinical Recommendations & Action Items
            </h3>
            <ul className="space-y-3">
              {predictionAnalysis.projections.recommendedActionItems.map((action, idx) => (
                <li key={idx} className="flex items-start gap-3 text-green-700">
                  <span className="text-green-600 font-bold mt-1">→</span>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Data Insights */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Prediction Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="font-semibold text-blue-900 mb-2">Risk Trajectory</p>
                <p>
                  Current high-risk percentage is {predictionAnalysis.projections.currentHighRiskPercentage}%. 
                  Based on age distribution and medical conditions, we project a {predictionAnalysis.projections.projectedHighRiskIn6Months - predictionAnalysis.projections.currentHighRiskPercentage}% 
                  increase in 6 months.
                </p>
              </div>
              <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                <p className="font-semibold text-indigo-900 mb-2">Age Factor Analysis</p>
                <p>
                  The average patient age indicates that patients will reach the {predictionAnalysis.projections.estimatedNextCriticalAge}+ age group 
                  within the next 1-2 years, when stroke risk significantly increases.
                </p>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                <p className="font-semibold text-orange-900 mb-2">Preventive Measures</p>
                <p>
                  {predictionAnalysis.summaryMetrics.hypertensionCases + predictionAnalysis.summaryMetrics.heartDiseaseCases} patients 
                  with hypertension or heart disease require intensive management. Lifestyle interventions can reduce risk by 15-30%.
                </p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <p className="font-semibold text-purple-900 mb-2">High-Risk Threshold</p>
                <p>
                  {predictionAnalysis.summaryMetrics.strokeHistoryCases} patients with prior stroke history are at extremely high risk 
                  of recurrence. Daily monitoring and aggressive prevention protocols recommended.
                </p>
              </div>
            </div>
          </div>
            </>
          )}
        </div>
      )}

      {/* High Risk Patients Alert */}
      {activeTab === 'patients' && filteredPatients.filter(p => getRiskLevel(p) === 'high').length > 0 && (
        <motion.div 
          className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <FaExclamationTriangle className="text-red-500 mt-1 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-red-800">High Risk Patients Alert</h3>
            <p className="text-sm text-red-700">
              You have {filteredPatients.filter(p => getRiskLevel(p) === 'high').length} patients 
              with high stroke risk. Please review their cases promptly.
            </p>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
