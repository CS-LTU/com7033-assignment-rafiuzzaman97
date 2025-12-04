// src/pages/Appointment.jsx
// Appointment booking page component - allows patients to schedule appointments with doctors
// Provides date/time selection, doctor choice, and urgency level configuration
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaCalendarAlt, FaUserMd, FaClock, FaSpinner, FaCheckCircle, FaExclamationTriangle, FaStethoscope } from 'react-icons/fa';
import { getDoctors, bookAppointment } from '../api';
import { sanitizeInput } from '../utils/validation';

// Main Appointment booking component
// Manages appointment form, doctor selection, date/time scheduling, and submission
export default function Appointment() {
  // Get authenticated user from auth context
  const { user } = useAuth();
  
  // Hook to navigate to different pages after successful booking
  const navigate = useNavigate();
  
  // State to store list of available doctors fetched from API
  const [doctors, setDoctors] = useState([]);
  
  // State object containing all appointment form fields
  const [form, setForm] = useState({
    doctor_id: '',      // Selected doctor's ID
    date: '',           // Selected appointment date
    time: '',           // Selected appointment time
    reason: '',         // Reason for the appointment/symptoms
    urgency: 'routine'  // Urgency level (routine, urgent, emergency)
  });
  
  // State for displaying success/error messages to the user
  const [msg, setMsg] = useState('');
  
  // State to track if doctors are being loaded from API
  const [isLoading, setIsLoading] = useState(false);
  
  // State to track if appointment is being submitted to API
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State to store available time slots for the selected doctor and date
  const [availableSlots, setAvailableSlots] = useState([]);

  // Effect hook to load doctors list when component mounts or user changes
  useEffect(() => {
    loadDoctors();
  }, [user]);

  // Effect hook to load available time slots when doctor or date is selected
  // Automatically updates available slots based on user's doctor and date selection
  useEffect(() => {
    if (form.doctor_id && form.date) {
      loadAvailableSlots(form.doctor_id, form.date);
    }
  }, [form.doctor_id, form.date]);

  // Function to fetch list of available doctors from the API
  // Populates doctor dropdown with specialists and their availability status
  async function loadDoctors() {
    try {
      // Show loading indicator while fetching doctors
      setIsLoading(true);
      
      // Fetch active doctors from backend API using /doctors/ endpoint
      const data = await getDoctors();
      
      // Extract doctors array from response and update state
      setDoctors(data?.doctors || []);
    } catch (error) {
      // Handle API errors gracefully
      console.error('Error loading doctors:', error);
      setMsg('Failed to load doctors. Please try again.');
      setDoctors([]);
    } finally {
      // Stop loading indicator regardless of success or failure
      setIsLoading(false);
    }
  }

  // Function to load available time slots for a specific doctor on a specific date
  // Used to populate the time selection dropdown
  async function loadAvailableSlots(doctorId, date) {
    try {
      // Mock available appointment slots (morning: 9 AM-11 AM, afternoon: 2 PM-4 PM)
      const slots = [
        '09:00', '09:30', '10:00', '10:30', '11:00', 
        '14:00', '14:30', '15:00', '15:30', '16:00'
      ];
      // Update state with available time slots
      setAvailableSlots(slots);
    } catch (error) {
      // Handle errors gracefully
      console.error('Error loading slots:', error);
      setAvailableSlots([]);
    }
  }

  // Function to update form field with sanitization to prevent XSS attacks
  // Clears error messages when user starts editing the form
  function updateFormField(key, value) {
    // Sanitize string inputs to prevent malicious code injection
    const sanitizedValue = typeof value === 'string' ? sanitizeInput(value) : value;
    
    // Update form state with new sanitized value
    setForm(prev => ({ ...prev, [key]: sanitizedValue }));
    
    // Clear error message when user makes changes
    if (msg) setMsg('');
  }

  // Function to validate appointment form before submission
  // Checks for required fields and validates data constraints
  function validateForm() {
    const errors = [];
    
    // Validate doctor selection
    if (!form.doctor_id) errors.push('Please select a doctor');
    
    // Validate date selection
    if (!form.date) errors.push('Please select a date');
    
    // Validate time selection
    if (!form.time) errors.push('Please select a time');
    
    // Validate appointment reason - must be at least 10 characters for detailed description
    if (!form.reason || form.reason.trim().length < 10) {
      errors.push('Please provide a detailed reason (minimum 10 characters)');
    }
    
    // Validate that selected date is not in the past
    const selectedDate = new Date(form.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      errors.push('Cannot book appointments in the past');
    }
    
    // Return array of validation errors (empty if form is valid)
    return errors;
  }

  // Function to handle appointment booking form submission
  // Validates form, sends data to API, and handles success/error responses
  async function submit(e) {
    // Prevent default form submission behavior
    e.preventDefault();
    
    // Clear any previous messages
    setMsg('');
    
    // Validate form before submission
    const errors = validateForm();
    
    // If validation errors exist, display them and stop submission
    if (errors.length > 0) {
      setMsg(errors.join(', '));
      return;
    }
    
    // Show loading indicator during API submission
    setIsSubmitting(true);
    
    try {
      // Transform form data to match backend API field names
      const appointmentData = {
        doctor_id: form.doctor_id,
        appointment_date: form.date,      // Backend expects 'appointment_date'
        appointment_time: form.time,      // Backend expects 'appointment_time'
        reason: form.reason,
        urgency: form.urgency
      };
      
      // Send appointment booking request to API with transformed data
      const res = await bookAppointment(appointmentData);
      
      // Check if booking was successful
      if (res?.message && res.message.includes('successfully')) {
        // Display success message and redirect to patient dashboard after 2 seconds
        setMsg('Appointment booked successfully! Redirecting...');
        setTimeout(() => navigate('/patient'), 2000);
      } else {
        // Display error message from API response
        setMsg(res?.message || 'Failed to book appointment. Please try again.');
      }
    } catch (error) {
      // Handle network errors
      console.error('Booking error:', error);
      setMsg(error.message || 'Network error. Please try again.');
    } finally {
      // Stop loading indicator regardless of outcome
      setIsSubmitting(false);
    }
  }

  // Function to get minimum date for appointment booking (today's date)
  // Prevents booking appointments in the past
  const getMinDate = () => {
    const today = new Date();
    // Return date in YYYY-MM-DD format for HTML date input
    return today.toISOString().split('T')[0];
  };

  // Function to get maximum date for appointment booking (3 months from now)
  // Limits booking range to 3-month advance window
  const getMaxDate = () => {
    const maxDate = new Date();
    // Add 3 months to current date
    maxDate.setMonth(maxDate.getMonth() + 3);
    // Return date in YYYY-MM-DD format for HTML date input
    return maxDate.toISOString().split('T')[0];
  };

  // Function to find and return the currently selected doctor object
  // Used to display doctor details in the sidebar
  const getSelectedDoctor = () => {
    return doctors.find(d => d.id == form.doctor_id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto px-4 py-8 max-w-6xl"
    >
      {/* Page Header - Title and description */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 text-blue-600 text-2xl font-bold mb-2">
          <FaCalendarAlt className="text-3xl" />
          <h1>Book an Appointment</h1>
        </div>
        <p className="text-gray-600 text-lg">
          Schedule your medical appointment with our specialist doctors
        </p>
        <div className="mt-4 flex justify-center">
          <Link
            to="/patient"
            className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg border border-gray-300 transition-colors"
          >
            {/* Back to Dashboard */}
            Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Main content grid - form on left, sidebar info on right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Appointment Booking Form - Left section (2 columns wide) */}
        <motion.div
          className="lg:col-span-2"
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            {/* Form title with stethoscope icon */}
            <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
              <FaStethoscope className="text-blue-600" />
              Appointment Details
            </h2>

            {/* Success/Error message display - shows booking confirmation or validation errors */}
            {msg && (
              <div className={`p-4 rounded-lg mb-6 flex items-start gap-3 ${
                msg.includes('successful') 
                  ? 'bg-green-50 border border-green-200 text-green-700' 
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}>
                {msg.includes('successful') ? (
                  <FaCheckCircle className="text-green-500 mt-1 flex-shrink-0" />
                ) : (
                  <FaExclamationTriangle className="text-red-500 mt-1 flex-shrink-0" />
                )}
                <div>
                  <p className="font-medium">{msg.includes('successful') ? 'Success!' : 'Please check your input'}</p>
                  <p className="text-sm">{msg}</p>
                </div>
              </div>
            )}

            {/* Appointment booking form */}
            <form onSubmit={submit} className="space-y-6">
              
              {/* Doctor Selection Section - Dropdown to choose healthcare provider */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Doctor *
                </label>
                {/* Loading indicator or doctor dropdown */}
                {isLoading ? (
                  <div className="flex items-center gap-2 text-gray-500 p-3 border border-gray-300 rounded-lg">
                    <FaSpinner className="animate-spin" />
                    Loading doctors...
                  </div>
                ) : (
                  // Dropdown to select doctor from available doctors list
                  <select
                    value={form.doctor_id}
                    onChange={e => updateFormField('doctor_id', e.target.value)}
                    className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                    required
                    disabled={isSubmitting}
                  >
                    <option value="">Choose a doctor...</option>
                    {doctors.map(doctor => (
                      <option key={doctor.id} value={doctor.id}>
                        Dr. {doctor.first_name} {doctor.last_name} - {doctor.specialization || 'General Medicine'}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Date and Time Selection Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Date Picker Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Appointment Date *
                  </label>
                  {/* Date input restricted to today through 3 months ahead */}
                  <input
                    type="date"
                    value={form.date}
                    onChange={e => updateFormField('date', e.target.value)}
                    min={getMinDate()}
                    max={getMaxDate()}
                    className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                    required
                    disabled={isSubmitting || !form.doctor_id}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Available up to 3 months in advance
                  </p>
                </div>

                {/* Time Slot Selection Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Time *
                  </label>
                  {/* Time dropdown populated with available slots for selected doctor and date */}
                  <select
                    value={form.time}
                    onChange={e => updateFormField('time', e.target.value)}
                    className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                    required
                    disabled={isSubmitting || !form.date}
                  >
                    <option value="">Select a time</option>
                    {availableSlots.map(slot => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                  {form.date && availableSlots.length === 0 && (
                    <p className="text-xs text-yellow-600 mt-1">
                      No available slots for selected date
                    </p>
                  )}
                </div>
              </div>

              {/* Appointment Reason Section - Textarea for symptom/reason description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Visit *
                </label>
                <textarea
                  value={form.reason}
                  onChange={e => updateFormField('reason', e.target.value)}
                  placeholder="Please describe your symptoms or reason for the appointment..."
                  className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all h-32 resize-none bg-white"
                  required
                  maxLength={500}
                  disabled={isSubmitting}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Be specific about your symptoms</span>
                  <span>{form.reason.length}/500 characters</span>
                </div>
              </div>

              {/* Urgency Level Selection - Radio-style buttons for priority level */}
              <div>
  <label className="block text-sm font-medium text-gray-700 mb-3">
    Urgency Level
  </label>
  {/* Three urgency level options: Routine (green), Urgent (yellow), Emergency (red) */}
  <div className="grid grid-cols-3 gap-3">
    {[
      { 
        value: 'routine', 
        label: 'Routine', 
        color: 'bg-green-100 text-green-800 border-green-400',
        activeColor: 'bg-green-500 text-white border-green-600'
      },
      { 
        value: 'urgent', 
        label: 'Urgent', 
        color: 'bg-yellow-100 text-yellow-800 border-yellow-400',
        activeColor: 'bg-yellow-500 text-white border-yellow-600'
      },
      { 
        value: 'emergency', 
        label: 'Emergency', 
        color: 'bg-red-100 text-red-800 border-red-400',
        activeColor: 'bg-red-500 text-white border-red-600'
      }
    ].map(level => (
      <button
        key={level.value}
        type="button"
        onClick={() => updateFormField('urgency', level.value)}
        className={`p-4 rounded-lg border-2 transition-all font-semibold text-sm ${
          form.urgency === level.value
            ? `${level.activeColor} shadow-md`
            : `${level.color} hover:shadow-md`
        }`}
        disabled={isSubmitting}
      >
        {level.label}
      </button>
    ))}
  </div>
</div>

              {/* Submit Button - Confirms and submits the appointment booking */}
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                disabled={isSubmitting || isLoading}
              >
                {isSubmitting ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    Booking Appointment...
                  </>
                ) : (
                  <>
                    <FaCalendarAlt />
                    Confirm Booking
                  </>
                )}
              </button>
            </form>
          </div>
        </motion.div>

        {/* Right Sidebar - Selected doctor info, booking instructions, and emergency notice */}
        <motion.div
          className="lg:col-span-1 space-y-6"
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {/* Selected Doctor Information Card - Shows doctor details when one is selected */}
          {getSelectedDoctor() && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <FaUserMd className="text-blue-600" />
                Selected Doctor
              </h3>
              <div className="space-y-2">
                <p className="font-bold text-gray-800 text-lg">
                  Dr. {getSelectedDoctor().first_name} {getSelectedDoctor().last_name}
                </p>
                <p className="text-gray-600">{getSelectedDoctor().specialization || 'General Medicine'}</p>
                <p className="text-sm text-gray-500">{getSelectedDoctor().email}</p>
                {getSelectedDoctor().phone && (
                  <p className="text-sm text-gray-500">{getSelectedDoctor().phone}</p>
                )}
                <div className="text-sm text-gray-500 mt-3 space-y-1">
                  <p className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    {getSelectedDoctor().is_active ? 'Available for consultations' : 'Currently unavailable'}
                  </p>
                  {getSelectedDoctor().specialization && (
                    <p className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      Specialist in {getSelectedDoctor().specialization}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Booking Instructions Card - Important guidelines for appointment */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-lg">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <FaClock className="text-green-600" />
              Booking Information
            </h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <p>Appointments are scheduled during business hours (9 AM - 4 PM)</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <p>Please arrive 15 minutes before your scheduled time</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <p>Bring your ID and insurance information</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <p>Cancellations require 24 hours notice</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <p>Emergency cases will be prioritized</p>
              </div>
            </div>
          </div>

          {/* Emergency Notice Card - Critical warning about stroke symptoms (F.A.S.T.) */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <h3 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
              <FaExclamationTriangle />
              Emergency Notice
            </h3>
            <p className="text-sm text-red-700">
              If you're experiencing stroke symptoms (<strong>F.A.S.T.</strong>: Face drooping, Arm weakness, Speech difficulty, Time to call emergency), 
              please go to the nearest emergency room immediately.
            </p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}