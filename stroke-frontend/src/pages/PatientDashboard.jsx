// src/pages/PatientDashboard.jsx
// Patient Dashboard Component - displays personal health overview, appointments, and medical information
// Shows appointments, vital statistics, quick actions, and health reminders
import React, {useEffect, useState} from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FaCalendarAlt, FaUserMd, FaNotesMedical, FaBell, FaArrowRight, FaFileMedical, FaDownload, FaUserEdit, FaExchangeAlt, FaTimes } from 'react-icons/fa'
import { getAppointments, getDoctors, cancelAppointment, rescheduleAppointment } from '../api'
import { jsPDF } from 'jspdf'

// Main Patient Dashboard component
// Displays patient's health information, upcoming appointments, and available actions
export default function PatientDashboard(){
  // Get authenticated patient user from auth context
  const { user } = useAuth()
  
  // Hook for navigation
  const navigate = useNavigate()
  
  // State to store list of upcoming appointments
  const [appointments, setAppointments] = useState([])
  
  // State to store list of doctors for name lookup
  const [doctors, setDoctors] = useState([])
  
  // State to store patient's medical statistics and vital information
  const [medicalStats, setMedicalStats] = useState(null)
  
  // State to track if dashboard data is being loaded
  const [loading, setLoading] = useState(true)
  
  // State for reschedule modal
  const [showRescheduleModal, setShowRescheduleModal] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [rescheduleDate, setRescheduleDate] = useState('')
  const [rescheduleTime, setRescheduleTime] = useState('')
  const [rescheduleLoading, setRescheduleLoading] = useState(false)
  const [availableSlots] = useState(['09:00', '09:30', '10:00', '10:30', '11:00', '14:00', '14:30', '15:00', '15:30', '16:00'])

  // Effect hook to load dashboard data when component mounts
  useEffect(() => {
    loadDashboardData()
  }, [])

  // Function to load real appointments from MongoDB
  async function loadDashboardData() {
    try {
      setLoading(true)
      
      // Fetch real appointments from MongoDB
      const appointmentsData = await getAppointments()
      const doctorsData = await getDoctors()
      
      setDoctors(doctorsData?.doctors || [])
      
      // Format appointments for display
      const formattedAppointments = (appointmentsData?.appointments || []).map(apt => {
        // Find doctor details
        const doctor = (doctorsData?.doctors || []).find(d => d.id == apt.doctor_id)
        const doctorName = doctor ? `Dr. ${doctor.first_name} ${doctor.last_name}` : 'Unknown Doctor'
        
        return {
          id: apt.id,
          doctor: doctorName,
          date: apt.appointment_date,
          time: apt.appointment_time,
          status: apt.status === 'scheduled' ? 'Confirmed' : 
                  apt.status === 'cancelled' ? 'Cancelled' : 'Pending',
          type: apt.urgency === 'routine' ? 'Consultation' : 
                apt.urgency === 'urgent' ? 'Urgent Care' : 'Emergency',
          reason: apt.reason
        }
      })
      
      setAppointments(formattedAppointments)
      
      // Initialize medical statistics (keep existing mock data structure)
      setMedicalStats({
        lastCheckup: '2024-11-15',
        nextAppointment: formattedAppointments.length > 0 ? formattedAppointments[0].date : 'Not scheduled',
        riskLevel: 'Medium',
        bmi: 24.5,
        bloodPressure: '120/80'
      })
      
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      // Set empty arrays on error
      setAppointments([])
    } finally {
      setLoading(false)
    }
  }

  // Function to determine status badge color based on appointment status
  // Returns CSS classes for styling the status badge
  const getStatusColor = (status) => {
    const colors = {
      'Confirmed': 'bg-green-100 text-green-800 border-green-200',
      'Pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Cancelled': 'bg-red-100 text-red-800 border-red-200'
    }
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  // Function to handle appointment rescheduling
  // Opens modal for selecting new date and time
  const handleReschedule = (appointment) => {
    setSelectedAppointment(appointment)
    setRescheduleDate(appointment.date)
    setRescheduleTime(appointment.time)
    setShowRescheduleModal(true)
  }

  // Function to submit rescheduled appointment
  const submitReschedule = async () => {
    if (!rescheduleDate || !rescheduleTime) {
      alert('Please select both date and time')
      return
    }
    
    try {
      setRescheduleLoading(true)
      const response = await rescheduleAppointment(selectedAppointment.id, {
        appointment_date: rescheduleDate,
        appointment_time: rescheduleTime
      })
      
      if (response?.message?.includes('successfully')) {
        alert('Appointment rescheduled successfully!')
        setShowRescheduleModal(false)
        loadDashboardData() // Reload appointments
      } else {
        alert(response?.message || 'Failed to reschedule appointment')
      }
    } catch (error) {
      console.error('Reschedule error:', error)
      alert(error.message || 'Failed to reschedule appointment')
    } finally {
      setRescheduleLoading(false)
    }
  }

  // Function to handle appointment cancellation
  // Asks for user confirmation before canceling
  const handleCancel = async (appointmentId) => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      try {
        const response = await cancelAppointment(appointmentId)
        
        if (response?.message?.includes('successfully')) {
          alert('Appointment cancelled successfully!')
          loadDashboardData() // Reload appointments
        } else {
          alert(response?.message || 'Failed to cancel appointment')
        }
      } catch (error) {
        console.error('Cancel error:', error)
        alert(error.message || 'Failed to cancel appointment')
      }
    }
  }
  
  // Function to get minimum date for rescheduling (today)
  const getMinDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }
  
  // Function to get maximum date for rescheduling (3 months ahead)
  const getMaxDate = () => {
    const maxDate = new Date()
    maxDate.setMonth(maxDate.getMonth() + 3)
    return maxDate.toISOString().split('T')[0]
  }

  // Quick Action Handlers
  const handleViewMedicalHistory = () => {
    alert('Medical History feature coming soon!\n\nThis will display:\n• Past appointments\n• Test results\n• Medical records\n• Treatment history')
  }

  const handleDownloadHealthReport = () => {
    try {
      const doc = new jsPDF()
      const currentDate = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
      
      // Page settings
      const pageWidth = doc.internal.pageSize.getWidth()
      const margin = 20
      let yPos = 20
      
      // Header - Title
      doc.setFillColor(37, 99, 235) // Blue background
      doc.rect(0, 0, pageWidth, 40, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(24)
      doc.setFont('helvetica', 'bold')
      doc.text('HEALTH REPORT', pageWidth / 2, 20, { align: 'center' })
      doc.setFontSize(12)
      doc.setFont('helvetica', 'normal')
      doc.text('Stroke Care Management System', pageWidth / 2, 30, { align: 'center' })
      
      yPos = 55
      doc.setTextColor(0, 0, 0)
      
      // Patient Information Section
      doc.setFillColor(243, 244, 246) // Light gray background
      doc.rect(margin, yPos, pageWidth - 2 * margin, 25, 'F')
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      yPos += 10
      doc.text('Patient Information', margin + 5, yPos)
      
      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')
      yPos += 8
      doc.text(`Patient Name: ${user?.username || 'N/A'}`, margin + 5, yPos)
      doc.text(`Report Date: ${currentDate}`, pageWidth - margin - 5, yPos, { align: 'right' })
      
      yPos += 15
      
      // Vital Statistics Section
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(37, 99, 235)
      doc.text('Vital Statistics', margin, yPos)
      doc.setTextColor(0, 0, 0)
      yPos += 10
      
      // Vital stats box
      doc.setDrawColor(200, 200, 200)
      doc.setLineWidth(0.5)
      const statsBoxHeight = 50
      doc.rect(margin, yPos, pageWidth - 2 * margin, statsBoxHeight)
      
      // Divide into 4 columns
      const colWidth = (pageWidth - 2 * margin) / 2
      doc.line(margin + colWidth, yPos, margin + colWidth, yPos + statsBoxHeight)
      doc.line(margin, yPos + statsBoxHeight/2, pageWidth - margin, yPos + statsBoxHeight/2)
      
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      
      // Last Checkup
      doc.text('Last Checkup', margin + 5, yPos + 10)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(12)
      doc.text(medicalStats?.lastCheckup || 'N/A', margin + 5, yPos + 18)
      
      // BMI
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('BMI', margin + colWidth + 5, yPos + 10)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(12)
      doc.text(String(medicalStats?.bmi || 'N/A'), margin + colWidth + 5, yPos + 18)
      
      // Blood Pressure
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('Blood Pressure', margin + 5, yPos + statsBoxHeight/2 + 10)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(12)
      doc.text(medicalStats?.bloodPressure || 'N/A', margin + 5, yPos + statsBoxHeight/2 + 18)
      
      // Stroke Risk Level
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('Stroke Risk Level', margin + colWidth + 5, yPos + statsBoxHeight/2 + 10)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(12)
      const riskLevel = medicalStats?.riskLevel || 'N/A'
      const riskColor = riskLevel === 'High' ? [220, 38, 38] : 
                        riskLevel === 'Medium' ? [234, 179, 8] : [34, 197, 94]
      doc.setTextColor(...riskColor)
      doc.text(riskLevel, margin + colWidth + 5, yPos + statsBoxHeight/2 + 18)
      doc.setTextColor(0, 0, 0)
      
      yPos += statsBoxHeight + 20
      
      // Upcoming Appointments Section
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(37, 99, 235)
      doc.text('Upcoming Appointments', margin, yPos)
      doc.setTextColor(0, 0, 0)
      yPos += 10
      
      if (appointments.length === 0) {
        doc.setFontSize(11)
        doc.setFont('helvetica', 'italic')
        doc.setTextColor(100, 100, 100)
        doc.text('No upcoming appointments scheduled', margin, yPos)
        doc.setTextColor(0, 0, 0)
        yPos += 10
      } else {
        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        
        appointments.slice(0, 5).forEach((apt, index) => {
          // Appointment box
          doc.setDrawColor(200, 200, 200)
          doc.setFillColor(249, 250, 251)
          doc.rect(margin, yPos, pageWidth - 2 * margin, 25, 'FD')
          
          yPos += 8
          doc.setFont('helvetica', 'bold')
          doc.text(apt.doctor, margin + 5, yPos)
          
          // Status badge
          const statusColor = apt.status === 'Confirmed' ? [34, 197, 94] :
                             apt.status === 'Pending' ? [234, 179, 8] : [220, 38, 38]
          doc.setTextColor(...statusColor)
          doc.setFontSize(9)
          doc.text(apt.status, pageWidth - margin - 5, yPos, { align: 'right' })
          doc.setTextColor(0, 0, 0)
          
          yPos += 6
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(9)
          doc.text(`Date: ${apt.date}  |  Time: ${apt.time}  |  Type: ${apt.type}`, margin + 5, yPos)
          
          yPos += 16
          
          // Check if we need a new page
          if (yPos > 250 && index < appointments.length - 1) {
            doc.addPage()
            yPos = 20
          }
        })
      }
      
      // Footer
      const pageCount = doc.internal.pages.length - 1
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(9)
        doc.setTextColor(150, 150, 150)
        doc.text(
          `Page ${i} of ${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        )
        doc.text(
          'This is a confidential medical document',
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 5,
          { align: 'center' }
        )
      }
      
      // Save the PDF
      const fileName = `health-report-${user?.username}-${new Date().toISOString().split('T')[0]}.pdf`
      doc.save(fileName)
      
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Failed to generate PDF report. Please try again.')
    }
  }

  const handleUpdatePersonalInfo = () => {
    alert('Update Personal Information\n\nThis feature will allow you to:\n• Update contact details\n• Change password\n• Update emergency contacts\n• Modify health information')
  }

  if (loading) {
    return (
      <div className="container mx-auto p-8">
        <div className="card text-center">
          <div className="flex justify-center items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span>Loading your dashboard...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto px-4 py-8"
    >
      {/* Welcome Section - Displays personalized greeting and quick booking button */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-8">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Welcome back, {user?.username}!
            </h1>
            <p className="text-gray-600">
              Here's your health overview and upcoming appointments.
            </p>
          </div>
          {/* Button to book new appointment */}
          <Link
            to="/appointment"
            className="mt-4 md:mt-0 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-md"
          >
            <FaCalendarAlt />
            Book New Appointment
          </Link>
        </div>
      </div>

      {/* Main content grid - Health overview on left, Appointments on right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column - Health Overview and Quick Actions */}
        <motion.div
          className="lg:col-span-1 space-y-6"
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {/* Health Overview Card - Displays vital statistics and medical information */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FaNotesMedical className="text-blue-600" />
              Health Overview
            </h2>
            
            {medicalStats ? (
              // Display medical statistics if data is available
              <div className="space-y-4">
                {/* Last Checkup date */}
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Last Checkup</span>
                  <span className="font-medium text-gray-800">{medicalStats.lastCheckup}</span>
                </div>
                {/* Next Appointment date */}
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Next Appointment</span>
                  <span className="font-medium text-blue-600">{medicalStats.nextAppointment}</span>
                </div>
                {/* Stroke Risk Level with color coding */}
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Stroke Risk</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                    medicalStats.riskLevel === 'High' 
                      ? 'bg-red-100 text-red-800 border-red-200'
                      : medicalStats.riskLevel === 'Medium'
                      ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                      : 'bg-green-100 text-green-800 border-green-200'
                  }`}>
                    {medicalStats.riskLevel}
                  </span>
                </div>
                {/* BMI (Body Mass Index) */}
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">BMI</span>
                  <span className="font-medium text-gray-800">{medicalStats.bmi}</span>
                </div>
                {/* Blood Pressure reading */}
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Blood Pressure</span>
                  <span className="font-medium text-gray-800">{medicalStats.bloodPressure}</span>
                </div>
              </div>
            ) : (
              // Show placeholder if no medical data available
              <p className="text-gray-500 text-center py-4">No medical data available</p>
            )}
          </div>

          {/* Quick Actions Card - Displays buttons for common patient actions */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FaArrowRight className="text-blue-600" />
              Quick Actions
            </h3>
            <div className="space-y-3">
              {/* View Medical History button */}
              <button 
                onClick={handleViewMedicalHistory}
                className="w-full p-4 border-2 border-blue-200 bg-blue-50 rounded-lg hover:bg-blue-100 hover:border-blue-300 transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <FaFileMedical className="text-blue-600 text-lg" />
                  <span className="font-medium text-gray-800">View Medical History</span>
                </div>
                <FaArrowRight className="text-blue-600 transition-colors" />
              </button>
              
              {/* Download Health Report button */}
              <button 
                onClick={handleDownloadHealthReport}
                className="w-full p-4 border-2 border-green-200 bg-green-50 rounded-lg hover:bg-green-100 hover:border-green-300 transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <FaDownload className="text-green-600 text-lg" />
                  <span className="font-medium text-gray-800">Download Health Report</span>
                </div>
                <FaArrowRight className="text-green-600 transition-colors" />
              </button>
              
              {/* Update Personal Information button */}
              <button 
                onClick={handleUpdatePersonalInfo}
                className="w-full p-4 border-2 border-purple-200 bg-purple-50 rounded-lg hover:bg-purple-100 hover:border-purple-300 transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <FaUserEdit className="text-purple-600 text-lg" />
                  <span className="font-medium text-gray-800">Update Personal Information</span>
                </div>
                <FaArrowRight className="text-purple-600 transition-colors" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Right Column - Appointments and Health Tips */}
        <motion.div
          className="lg:col-span-2 space-y-6"
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {/* Appointments Card - Displays upcoming appointments with action buttons */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <FaCalendarAlt className="text-blue-600" />
                Upcoming Appointments
              </h2>
              {/* Counter showing number of appointments */}
              <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                {appointments.length} appointment(s)
              </span>
            </div>

            {appointments.length === 0 ? (
              // Show empty state if no appointments scheduled
              <div className="text-center py-8">
                <FaCalendarAlt className="text-4xl mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500 mb-4">No upcoming appointments</p>
                <Link
                  to="/appointment"
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors shadow-md"
                >
                  <FaCalendarAlt />
                  Book Your First Appointment
                </Link>
              </div>
            ) : (
              // Display list of appointments with details and action buttons
              <div className="space-y-6">
                {appointments.map((appointment, index) => (
                  <motion.div
                    key={appointment.id}
                    className="border-2 border-gray-200 rounded-xl p-6 bg-white shadow-sm"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                      {/* Appointment Information Section */}
                      <div className="flex-1">
                        {/* Doctor name and appointment status */}
                        <div className="flex items-center gap-4 mb-4">
                          <div className="p-3 bg-blue-100 rounded-xl">
                            <FaUserMd className="text-blue-600 text-xl" />
                          </div>
                          <div className="flex flex-col gap-1">
                            <div className="flex flex-wrap items-center gap-3">
                              <h3 className="font-bold text-gray-800 text-xl">{appointment.doctor}</h3>
                              {/* Status badge with dynamic coloring */}
                              <span className={`px-4 py-1 rounded-full text-sm font-medium border-2 ${getStatusColor(appointment.status)}`}>
                                {appointment.status}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Appointment details grid - Date, Time, Type */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-gray-500 text-xs uppercase tracking-wide mb-1">Date</span>
                            <span className="text-gray-800 font-bold text-md">{appointment.date}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-gray-500 text-xs uppercase tracking-wide mb-1">Time</span>
                            <span className="text-gray-800 font-bold text-md">{appointment.time}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-gray-500 text-xs uppercase tracking-wide mb-1">Type</span>
                            <span className="text-gray-800 font-bold text-md">{appointment.type}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Action Buttons - Reschedule and Cancel */}
                      <div className="flex flex-col sm:flex-row gap-3">
                        {/* Reschedule Appointment button */}
                        <button 
                          onClick={() => handleReschedule(appointment)}
                          className="flex items-center justify-center gap-2 px-5 py-3 bg-blue-100 border-2 border-blue-300 text-blue-700 rounded-lg font-semibold whitespace-nowrap hover:bg-blue-200 hover:border-blue-400 transition-colors shadow-sm"
                        >
                          <FaExchangeAlt />
                          Reschedule
                        </button>
                        {/* Cancel Appointment button */}
                        <button 
                          onClick={() => handleCancel(appointment.id)}
                          className="flex items-center justify-center gap-2 px-5 py-3 bg-red-100 border-2 border-red-300 text-red-700 rounded-lg font-semibold whitespace-nowrap hover:bg-red-200 hover:border-red-400 transition-colors shadow-sm"
                        >
                          <FaTimes />
                          Cancel
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Health Tips Card - Displays important health reminders and recommendations */}
          <motion.div 
            className="bg-green-50 border-2 border-green-300 rounded-xl p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-green-100 rounded-xl">
                <FaBell className="text-green-600 text-xl" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-green-800 mb-3 text-lg">Health Reminder</h3>
                <p className="text-green-700 mb-4">
                  Regular checkups and maintaining a healthy lifestyle can significantly reduce stroke risk. 
                  Remember to monitor your blood pressure and maintain a balanced diet.
                </p>
                {/* Health recommendations grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  {/* Monitor blood pressure recommendation */}
                  <div className="flex items-center gap-3 p-2 bg-green-100 rounded-lg">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-green-800 font-medium">Monitor blood pressure weekly</span>
                  </div>
                  {/* Exercise recommendation */}
                  <div className="flex items-center gap-3 p-2 bg-green-100 rounded-lg">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-green-800 font-medium">Exercise for 30 minutes daily</span>
                  </div>
                  {/* Diet recommendation */}
                  <div className="flex items-center gap-3 p-2 bg-green-100 rounded-lg">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-green-800 font-medium">Maintain balanced diet</span>
                  </div>
                  {/* Lifestyle recommendation */}
                  <div className="flex items-center gap-3 p-2 bg-green-100 rounded-lg">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-green-800 font-medium">Avoid smoking & limit alcohol</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
      
      {/* Reschedule Modal */}
      {showRescheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <FaExchangeAlt className="text-blue-600" />
                Reschedule Appointment
              </h3>
              <button
                onClick={() => setShowRescheduleModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Current appointment with <strong>{selectedAppointment?.doctor}</strong>
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Currently scheduled for: {selectedAppointment?.date} at {selectedAppointment?.time}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select New Date
                </label>
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  min={getMinDate()}
                  max={getMaxDate()}
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select New Time
                </label>
                <select
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="input w-full"
                >
                  <option value="">Choose a time slot</option>
                  {availableSlots.map(slot => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={submitReschedule}
                  disabled={rescheduleLoading || !rescheduleDate || !rescheduleTime}
                  className="btn btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {rescheduleLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Rescheduling...
                    </>
                  ) : (
                    'Confirm Reschedule'
                  )}
                </button>
                <button
                  onClick={() => setShowRescheduleModal(false)}
                  disabled={rescheduleLoading}
                  className="btn btn-secondary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}