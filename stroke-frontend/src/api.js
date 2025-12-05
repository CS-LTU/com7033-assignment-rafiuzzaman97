/**
 * API Client Module - api.js
 * 
 * Centralized API communication layer for the healthcare application.
 * Handles all HTTP requests to the backend with features like:
 * - Automatic authentication token injection
 * - Request timeout handling
 * - Automatic retry logic with exponential backoff
 * - Error handling and logging
 * - Request/response interceptors
 * - Mock data for development/testing
 * 
 * Base URL: http://localhost:5000/api (Flask backend)
 */

// Backend API base URL - change this when deploying to different environments
let API_BASE_URL = 'http://localhost:5000/api';

// Import secure storage utility for managing authentication tokens and user data
import { secureStorage } from './utils/secureStorage';

// Security and Network Configuration
// Maximum time to wait for a response (milliseconds)
const REQUEST_TIMEOUT = 10000; // 10 seconds

// Number of times to automatically retry failed requests
const MAX_RETRIES = 2;

/**
 * Function - secureFetch
 * 
 * Core HTTP request function with built-in security, timeout, and retry features.
 * Automatically adds authentication token from secure storage to all requests.
 * 
 * @async
 * @param {string} endpoint - API endpoint path (e.g., '/auth/login')
 * @param {Object} [options={}] - Request options
 * @param {Object} [options.headers={}] - Custom HTTP headers to add to request
 * @param {string} [options.method='GET'] - HTTP method (GET, POST, PUT, DELETE, etc.)
 * @param {string|FormData} [options.body] - Request body (automatically stringified for JSON)
 * 
 * @returns {Promise<Object>} Parsed JSON response from server
 * 
 * @throws {Error} Network errors, timeouts, invalid responses, or HTTP errors
 * 
 * Features:
 * - Automatic bearer token injection from secure storage
 * - Request timeout with AbortController (10 seconds)
 * - Automatic retry with exponential backoff on network failures
 * - Detailed error messages for different HTTP status codes
 * - Validation of response structure
 * 
 * Usage:
 *   const response = await secureFetch('/patients/1');
 *   const updatedUser = await secureFetch('/users/1', { 
 *     method: 'PUT', 
 *     body: JSON.stringify({name: 'John'}) 
 *   });
 */
export async function secureFetch(endpoint, options = {}) {
  // Retrieve stored user data which includes authentication token
  const storedUser = secureStorage.get('st_user');
  const token = storedUser?.token;

  // Destructure request options and set defaults
  const {
    headers: optionHeaders = {},
    method = 'GET',
    body,
    ...rest
  } = options;

  // Build request headers with authorization and content type
  const headers = {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    ...optionHeaders,
    // Add Bearer token to Authorization header if token exists
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  // Build final fetch configuration
  const config = {
    ...rest,
    method,
    headers,
    // Include request body for non-GET requests
    ...(body && method !== 'GET' ? { body } : {}),
  };

  // Existing timeout/retry logic…





  if (options.body && config.method !== 'GET') {
    config.body = options.body;
  }

  console.log('  📋 Final request headers:', config.headers);

  // Track last error for retries
  let lastError;
  
  /**
   * Retry Loop - Attempt request up to MAX_RETRIES + 1 times
   * If network error occurs, automatically retry with exponential backoff
   */
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Create abort controller for request timeout
      const controller = new AbortController();
      // Set timeout to automatically cancel request if it takes too long
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
      
      // Execute the fetch request with timeout signal
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...config,
        signal: controller.signal,
      });
      
      // Clear timeout timer when response is received
      clearTimeout(timeoutId);
      
      /**
       * HTTP Error Handling - Check if response has error status
       */
      if (!response.ok) {
        // Attempt to parse error details from response
        const errorData = await response.json().catch(() => ({}));
        
        // User authentication failure - could auto-logout and redirect to login
        // if (response.status === 401) {
        //   sessionStorage.removeItem('st_user');
        //   sessionStorage.removeItem('st_token');
        //   window.location.href = '/?session=expired';
        //   throw new Error('Authentication failed. Please login again.');
        // }
        
        // Map HTTP status codes to user-friendly error messages
        const errorMessages = {
          400: 'Bad request. Please check your input.',
          403: 'Access forbidden. Insufficient permissions.',
          404: 'Resource not found.',
          429: 'Too many requests. Please slow down.',
          500: 'Server error. Please try again later.',
          503: 'Service temporarily unavailable.',
        };
        
        // Throw error with server message or generic message based on status
        throw new Error(errorData.message || errorMessages[response.status] || `HTTP error! status: ${response.status}`);
      }
      
      /**
       * Success - Parse and Validate Response
       */
      // Parse response JSON
      const data = await response.json();
      
      // Validate response is not null/undefined
      if (data === undefined || data === null) {
        throw new Error('Invalid response from server');
      }
      
      // Return successful response data
      return data;
      
    } catch (error) {
      // Store error for potential re-throw after all retries
      lastError = error;
      
      /**
       * Non-Retryable Errors - Throw immediately
       */
      // Request timeout (AbortError) - don't retry, timeout is likely persistent
      if (error.name === 'AbortError') {
        throw new Error('Request timeout. Please check your connection and try again.');
      }
      
      // Authentication errors - don't retry, user needs to login
      if (error.message.includes('Authentication failed') || error.message.includes('403')) {
        throw error;
      }
      
      /**
       * Retryable Errors - Log and retry with exponential backoff
       */
      // If we have retries remaining, wait and retry
      if (attempt < MAX_RETRIES) {
        // Exponential backoff: wait 1s, then 2s, then 3s
        console.warn(`API call failed, retrying... (${attempt + 1}/${MAX_RETRIES})`, error);
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }
  
  // All retries exhausted - throw last error
  throw lastError;
}
/**
 * Function - requestInterceptor
 * 
 * Middleware function that intercepts and logs all outgoing API requests.
 * Used for analytics, debugging, and adding request-level metadata.
 * 
 * @param {string} endpoint - API endpoint being called
 * @param {Object} options - Request options
 * 
 * @returns {Object} Modified endpoint and options with timestamp header added
 */
const requestInterceptor = (endpoint, options) => {
  // Log request details for debugging
  console.log(`API Request: ${options.method || 'GET'} ${endpoint}`, options.body ? JSON.parse(options.body) : '');
  
  // Add timestamp for request tracking and analytics
  const timestamp = new Date().toISOString();
  
  return {
    endpoint,
    options: {
      ...options,
      headers: {
        ...options.headers,
        'X-Request-Timestamp': timestamp,
      }
    }
  };
};

/**
 * Function - responseInterceptor
 * 
 * Middleware function that intercepts all API responses.
 * Used for logging, error tracking, and analytics reporting.
 * 
 * @param {Object} response - Response data from API
 * @param {string} endpoint - API endpoint that was called
 * 
 * @returns {Object} Response data (potentially modified)
 */
const responseInterceptor = (response, endpoint) => {
  // Log response details for debugging
  console.log(`API Response: ${endpoint}`, response);
  
  // Track successful requests for analytics (e.g., send to analytics service)
  if (response.success !== false) {
    // Could send to analytics service here
  }
  
  return response;
};

/**
 * Function - enhancedSecureFetch
 * 
 * Wrapper around secureFetch that adds request/response interceptors.
 * Provides logging, error tracking, and analytics capabilities.
 * 
 * @async
 * @param {string} endpoint - API endpoint to call
 * @param {Object} [options={}] - Request options
 * 
 * @returns {Promise<Object>} Response data with interceptors applied
 * 
 * @throws {Object} Enhanced error object with metadata (endpoint, timestamp, user agent)
 */
async function enhancedSecureFetch(endpoint, options = {}) {
  // Apply request interceptor (logging, metadata addition)
  const { endpoint: processedEndpoint, options: processedOptions } = requestInterceptor(endpoint, options);
  
  try {
    // Execute actual fetch with processed endpoint/options
    const response = await secureFetch(processedEndpoint, processedOptions);
    // Apply response interceptor (logging, analytics)
    return responseInterceptor(response, processedEndpoint);
  } catch (error) {
    // Log error details
    console.error(`API Error in ${endpoint}:`, error);
    
    // Create enhanced error object with debugging metadata
    const enhancedError = {
      message: error.message,
      endpoint,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    };
    
    // In production, could send error to error tracking service (e.g., Sentry)
    if (process.env.NODE_ENV === 'production') {
      // logToService(enhancedError);
    }
    
    throw enhancedError;
  }
}

/**
 * ========== AUTHENTICATION API FUNCTIONS ==========
 */

/**
 * Function - loginUser
 * Authenticates user with username and password
 * Returns user data and authentication token on success
 */
export const loginUser = async (credentials) => {
  return enhancedSecureFetch('/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });
};

/**
 * Function - registerPatient
 * Registers a new patient account (admin/system function)
 * Returns confirmation or error message
 */
export const registerPatient = async (patientData) => {
  return enhancedSecureFetch('/patients/register', {
    method: 'POST',
    body: JSON.stringify(patientData),
  });
};

/**
 * Function - selfRegisterPatient
 * Allows patient self-registration (public registration endpoint)
 * Returns confirmation or validation errors
 */
export const selfRegisterPatient = async (patientData) => {
  return enhancedSecureFetch('/patients/self-register', {
    method: 'POST',
    body: JSON.stringify(patientData),
  });
};

/**
 * Function - logoutUser
 * Signs out current user and invalidates session
 */
export const logoutUser = async () => {
  return enhancedSecureFetch('/auth/logout', {
    method: 'POST',
  });
};

/**
 * Function - refreshToken
 * Obtains a new authentication token using existing session
 * Used to extend session when token expires
 */
export const refreshToken = async () => {
  return enhancedSecureFetch('/auth/refresh', {
    method: 'POST',
  });
};

/**
 * ========== DOCTOR API FUNCTIONS ==========
 */

/**
 * Function - fetchDoctors
 * Retrieves list of available doctors
 * Returns array of doctor objects with specialization and availability
 */
export const fetchDoctors = async () => {
  return enhancedSecureFetch('/doctors');
};

/**
 * Function - fetchDoctorPatients
 * Retrieves all patients assigned to logged-in doctor
 * Returns array of patient objects with medical information
 */
export const fetchDoctorPatients = async () => {
  return enhancedSecureFetch('/doctors/patients');
};

/**
 * ========== PATIENT API FUNCTIONS ==========
 */

/**
 * Function - fetchPatientProfile
 * Retrieves specific patient's profile and medical information
 * @param {string} patientId - ID of patient to retrieve
 */
export const fetchPatientProfile = async (patientId) => {
  return enhancedSecureFetch(`/patients/${patientId}`);
};

/**
 * Function - updatePatientProfile
 * Updates patient profile information
 * @param {string} patientId - ID of patient to update
 * @param {Object} updates - Fields to update (name, contact, medical info, etc.)
 */
export const updatePatientProfile = async (patientId, updates) => {
  return enhancedSecureFetch(`/patients/${patientId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
};

/**
 * Function - deletePatientRecord
 * Permanently deletes patient record from system
 * @param {string} patientId - ID of patient record to delete
 */
export const deletePatientRecord = async (patientId) => {
  return enhancedSecureFetch(`/patients/${patientId}`, {
    method: 'DELETE',
  });
};

/**
 * Function - getMedicalHistory
 * Retrieves patient's complete medical history and past visits
 * @param {string} patientId - ID of patient
 */
export const getMedicalHistory = async (patientId) => {
  return enhancedSecureFetch(`/patients/${patientId}/history`);
};

/**
 * Function - addMedicalRecord
 * Adds new medical record entry to patient's medical history
 * @param {string} patientId - ID of patient
 * @param {Object} record - Medical record data (notes, findings, diagnosis, etc.)
 */
export const addMedicalRecord = async (patientId, record) => {
  return enhancedSecureFetch(`/patients/${patientId}/records`, {
    method: 'POST',
    body: JSON.stringify(record),
  });
};

/**
 * ========== APPOINTMENT API FUNCTIONS ==========
 */

/**
 * Function - bookAppointment
 * Books new appointment with doctor
 * @param {Object} appointmentData - Appointment details (doctor, date, time, reason)
 */
export const bookAppointment = async (appointmentData) => {
  return enhancedSecureFetch('/appointments/book', {
    method: 'POST',
    body: JSON.stringify(appointmentData),
  });
};

/**
 * Function - getAppointments
 * Retrieves appointments with optional filtering
 * @param {Object} [filters={}] - Filter parameters (date, doctor, status, etc.)
 */
export const getAppointments = async (filters = {}) => {
  const queryParams = new URLSearchParams(filters).toString();
  const url = queryParams ? `/appointments/?${queryParams}` : '/appointments/';
  return enhancedSecureFetch(url);
};

/**
 * Function - cancelAppointment
 * Cancels scheduled appointment
 * @param {string} appointmentId - ID of appointment to cancel
 */
export const cancelAppointment = async (appointmentId) => {
  return enhancedSecureFetch(`/appointments/${appointmentId}/cancel`, {
    method: 'POST',
  });
};

/**
 * Function - rescheduleAppointment
 * Reschedules an existing appointment
 * @param {string} appointmentId - ID of appointment to reschedule
 * @param {Object} newDateTime - New date and time {appointment_date, appointment_time}
 */
export const rescheduleAppointment = async (appointmentId, newDateTime) => {
  return enhancedSecureFetch(`/appointments/${appointmentId}/reschedule`, {
    method: 'POST',
    body: JSON.stringify(newDateTime),
  });
};

/**
 * ========== ADMIN API FUNCTIONS ==========
 */

/**
 * Function - getSystemStats
 * Retrieves system-wide statistics and metrics (user counts, appointment stats, etc.)
 * Admin-only endpoint
 */
export const getSystemStats = async () => {
  return enhancedSecureFetch('/admin/stats');
};

/**
 * Function - getAllUsers
 * Retrieves list of all users with optional role filtering
 * @param {string} [role=''] - Optional role filter (patient, doctor, admin)
 */
export const getAllUsers = async (role = '') => {
  const query = role ? `?role=${role}` : '';
  return enhancedSecureFetch(`/admin/users${query}`);
};

/**
 * Function - getDoctors
 * Retrieves list of active doctors (accessible to all authenticated users)
 * Used for appointment booking - patients can view doctor list
 * @returns {Promise<Object>} Object containing doctors array
 */
export const getDoctors = async () => {
  return enhancedSecureFetch('/doctors/');
};

/**
 * Function - createUser
 * Creates new user account (admin function)
 * @param {Object} userData - User data (username, email, role, password, etc.)
 */
export const createUser = async (userData) => {
  return enhancedSecureFetch('/admin/users', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
};

/**
 * Function - updateUser
 * Updates user information and settings
 * @param {string} userId - ID of user to update
 * @param {Object} updates - Fields to update
 */
export const updateUser = async (userId, updates) => {
  return enhancedSecureFetch(`/admin/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
};

/**
 * ========== ANALYTICS & PREDICTION API FUNCTIONS ==========
 */

/**
 * Function - getDashboardStats
 * Retrieves analytics data for doctor/admin dashboard
 * Returns statistics about patients, appointments, risk factors
 */
export const getDashboardStats = async () => {
  return enhancedSecureFetch('/analytics/dashboard-stats');
};

/**
 * Function - getRiskFactors
 * Retrieves information about patient stroke risk factors
 * Used for analytics and recommendations
 */
export const getRiskFactors = async () => {
  return enhancedSecureFetch('/analytics/risk-factors');
};

/**
 * Function - getStrokePrediction
 * Submits patient data to ML model for stroke risk prediction
 * @param {Object} patientData - Patient medical and demographic data
 * @returns {Object} Prediction result (risk score, probability, recommendations)
 */
export const getStrokePrediction = async (patientData) => {
  return enhancedSecureFetch('/predict/stroke', {
    method: 'POST',
    body: JSON.stringify(patientData),
  });
};

/**
 * ========== FILE HANDLING API FUNCTIONS ==========
 */

/**
 * Function - uploadFile
 * Uploads file to server (medical records, reports, documents)
 * @param {File} file - File object to upload
 * @param {string} patientId - ID of patient this file belongs to
 */
export const uploadFile = async (file, patientId) => {
  // Use FormData for file upload (multipart/form-data)
  const formData = new FormData();
  formData.append('file', file);
  formData.append('patientId', patientId);
  
  return enhancedSecureFetch('/upload', {
    method: 'POST',
    headers: {
      // Don't set Content-Type for FormData - let browser set it with boundary
    },
    body: formData,
  });
};

/**
 * Function - downloadReport
 * Downloads patient's health report in specified format
 * @param {string} patientId - ID of patient
 * @param {string} reportType - Type of report (PDF, CSV, etc.)
 */
export const downloadReport = async (patientId, reportType) => {
  return enhancedSecureFetch(`/reports/${patientId}/${reportType}`, {
    method: 'GET',
  });
};

/**
 * ========== UTILITY & HEALTH CHECK FUNCTIONS ==========
 */

/**
 * Function - healthCheck
 * Pings backend to verify API is available and responding
 * Used for connection testing and monitoring
 */
export const healthCheck = async () => {
  return enhancedSecureFetch('/health');
};

/**
 * ========== MOCK API - Development & Testing ==========
 * Simulates backend responses for UI development and testing without a real backend
 */
export const mockApi = {
  /**
   * Mock Function - fetchDoctors
   * Simulates doctor list with random delay
   */
  fetchDoctors: async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return [
      { 
        id: 1, 
        username: 'Dr. Smith', 
        specialization: 'Neurology',
        experience: '15 years',
        rating: 4.8,
        available: true
      },
      { 
        id: 2, 
        username: 'Dr. Johnson', 
        specialization: 'Cardiology',
        experience: '12 years',
        rating: 4.9,
        available: true
      },
      { 
        id: 3, 
        username: 'Dr. Williams', 
        specialization: 'General Medicine',
        experience: '10 years',
        rating: 4.7,
        available: false
      },
      { 
        id: 4, 
        username: 'Dr. Brown', 
        specialization: 'Neurology',
        experience: '8 years',
        rating: 4.6,
        available: true
      },
    ];
  },
  
  /**
   * Mock Function - fetchDoctorPatients
   * Simulates list of patients for doctor dashboard with varied risk levels
   */
  fetchDoctorPatients: async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return [
      { 
        _id: '1', 
        age: 45, 
        gender: 'Male', 
        notes: 'Regular checkup - stable condition',
        hypertension: 0,
        heart_disease: 0,
        last_visit: '2024-11-15',
        risk_level: 'low'
      },
      { 
        _id: '2', 
        age: 67, 
        gender: 'Female', 
        notes: 'Follow-up appointment - monitoring blood pressure',
        hypertension: 1,
        heart_disease: 0,
        last_visit: '2024-11-10',
        risk_level: 'medium'
      },
      { 
        _id: '3', 
        age: 34, 
        gender: 'Male', 
        notes: 'Initial consultation - family history of stroke',
        hypertension: 0,
        heart_disease: 1,
        last_visit: '2024-11-20',
        risk_level: 'high'
      },
      { 
        _id: '4', 
        age: 58, 
        gender: 'Female', 
        notes: 'Diabetes management - elevated glucose levels',
        hypertension: 1,
        heart_disease: 1,
        last_visit: '2024-11-18',
        risk_level: 'high'
      },
    ];
  },

  /**
   * Mock Function - registerPatient
   * Simulates patient registration with validation and random success rate
   */
  registerPatient: async (patientData) => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simulate validation
    const requiredFields = ['age', 'gender', 'avg_glucose_level', 'bmi'];
    const missingFields = requiredFields.filter(field => !patientData[field]);
    
    if (missingFields.length > 0) {
      return {
        ok: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      };
    }
    
    // Simulate random success/failure (70% success rate)
    const success = Math.random() > 0.3;
    
    if (success) {
      return {
        ok: true,
        insertedId: 'mock_' + Math.random().toString(36).substr(2, 9),
        message: 'Patient registered successfully',
        patient: {
          ...patientData,
          id: 'mock_' + Math.random().toString(36).substr(2, 9),
          registered_date: new Date().toISOString().split('T')[0]
        }
      };
    } else {
      return {
        ok: false,
        message: 'Registration failed. Patient may already exist or server error occurred.'
      };
    }
  },

  /**
   * Mock Function - bookAppointment
   * Simulates appointment booking with availability checking
   */
  bookAppointment: async (appointmentData) => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Validate required fields
    if (!appointmentData.doctor_id || !appointmentData.date || !appointmentData.time) {
      return {
        ok: false,
        message: 'Missing required appointment details'
      };
    }
    
    // Simulate 80% success rate for appointment booking
    const success = Math.random() > 0.2;
    
    if (success) {
      return {
        ok: true,
        appointmentId: 'appt_' + Math.random().toString(36).substr(2, 9),
        message: 'Appointment booked successfully',
        appointment: {
          ...appointmentData,
          id: 'appt_' + Math.random().toString(36).substr(2, 9),
          status: 'confirmed',
          booked_at: new Date().toISOString()
        }
      };
    } else {
      return {
        ok: false,
        message: 'Time slot no longer available. Please choose another time.'
      };
    }
  },

  /**
   * Mock Function - getSystemStats
   * Simulates system statistics for admin dashboard
   */
  getSystemStats: async () => {
    await new Promise(resolve => setTimeout(resolve, 800));
    return {
      totalPatients: 1247,
      totalDoctors: 23,
      todayAppointments: 18,
      highRiskPatients: 45,
      availableBeds: 12,
      monthlyRevenue: 125430,
      patientSatisfaction: 94.5
    };
  },

  /**
   * Mock Function - getStrokePrediction
   * Simulates ML model stroke prediction based on patient risk factors
   */
  getStrokePrediction: async (patientData) => {
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    // Calculate mock risk score based on risk factors
    let riskScore = 0;
    
    // Weight each risk factor by importance
    if (patientData.age > 60) riskScore += 30;
    if (patientData.hypertension) riskScore += 25;
    if (patientData.heart_disease) riskScore += 20;
    if (patientData.avg_glucose_level > 150) riskScore += 15;
    if (patientData.bmi > 30) riskScore += 10;
    if (patientData.smoking_status === 'Smokes') riskScore += 10;
    
    // Cap probability at 95% and classify risk level
    const probability = Math.min(riskScore, 95);
    const highRisk = probability > 50;
    
    return {
      probability: probability,
      risk_level: highRisk ? 'high' : probability > 25 ? 'medium' : 'low',
      // List contributing risk factors
      factors: [
        patientData.age > 60 ? 'Age' : null,
        patientData.hypertension ? 'Hypertension' : null,
        patientData.heart_disease ? 'Heart Disease' : null,
        patientData.avg_glucose_level > 150 ? 'Elevated Glucose' : null,
        patientData.bmi > 30 ? 'High BMI' : null,
        patientData.smoking_status === 'Smokes' ? 'Smoking' : null,
      ].filter(Boolean),
      // Provide health recommendations based on risk level
      recommendations: highRisk ? [
        'Consult with cardiologist',
        'Monitor blood pressure regularly',
        'Consider lifestyle changes',
        'Schedule follow-up in 2 weeks'
      ] : [
        'Maintain healthy lifestyle',
        'Regular exercise recommended',
        'Annual checkup advised'
      ]
    };
  }
};

/**
 * ========== API UTILITIES - Testing & Debugging ==========
 * Helper functions for testing, debugging, and error simulation
 */
export const apiUtils = {
  /**
   * Utility - setBaseURL
   * Override the API base URL (useful for switching between environments)
   */
  setBaseURL: (newUrl) => {
    API_BASE_URL = newUrl;
  },
  
  /**
   * Utility - getBaseURL
   * Get current API base URL
   */
  getBaseURL: () => {
    return API_BASE_URL;
  },
  
  /**
   * Utility - clearAuth
   * Clear all authentication data (useful for logout testing)
   */
  clearAuth: () => {
    sessionStorage.removeItem('st_user');
    sessionStorage.removeItem('st_token');
  },
  
  /**
   * Utility - simulateNetworkDelay
   * Introduce artificial delay for testing timeout handling
   */
  simulateNetworkDelay: (delay = 1000) => {
    return new Promise(resolve => setTimeout(resolve, delay));
  },
  
  /**
   * Utility - simulateError
   * Simulate different error conditions for testing error handling
   */
  simulateError: (errorType = 'network') => {
    const errors = {
      network: new Error('Network error: Failed to fetch'),
      timeout: new Error('Request timeout'),
      server: new Error('Server error: 500 Internal Server Error'),
      auth: new Error('Authentication failed: 401 Unauthorized')
    };
    
    throw errors[errorType] || errors.network;
  }
};

// ==================== SECURITY LOG API ====================

/**
 * Get Security Logs
 * Retrieves security logs with optional filtering (admin only)
 * 
 * @param {Object} filters - Filter options
 * @param {number} filters.limit - Maximum number of logs to return
 * @param {string} filters.event_type - Filter by event type
 * @param {number} filters.user_id - Filter by user ID
 * @param {string} filters.severity - Filter by severity level
 * @param {number} filters.hours - Time window in hours
 * @param {string} filters.status - Filter by status
 * @returns {Promise<Object>} Security logs and total count
 */
export async function getSecurityLogs(filters = {}) {
  const params = new URLSearchParams();
  
  if (filters.limit) params.append('limit', filters.limit);
  if (filters.event_type) params.append('event_type', filters.event_type);
  if (filters.user_id) params.append('user_id', filters.user_id);
  if (filters.severity) params.append('severity', filters.severity);
  if (filters.hours) params.append('hours', filters.hours);
  if (filters.status) params.append('status', filters.status);
  
  const queryString = params.toString();
  const endpoint = `/security/logs${queryString ? `?${queryString}` : ''}`;
  
  return await secureFetch(endpoint);
}

/**
 * Get Failed Login Attempts
 * Retrieves failed login attempts for security monitoring (admin only)
 * 
 * @param {Object} filters - Filter options
 * @param {string} filters.username - Filter by username
 * @param {number} filters.hours - Time window in hours
 * @param {number} filters.limit - Maximum number of logs
 * @returns {Promise<Object>} Failed login attempts with IP analysis
 */
export async function getFailedLogins(filters = {}) {
  const params = new URLSearchParams();
  
  if (filters.username) params.append('username', filters.username);
  if (filters.hours) params.append('hours', filters.hours);
  if (filters.limit) params.append('limit', filters.limit);
  
  const queryString = params.toString();
  const endpoint = `/security/logs/failed-logins${queryString ? `?${queryString}` : ''}`;
  
  return await secureFetch(endpoint);
}

/**
 * Get User Activity Logs
 * Retrieves activity logs for a specific user
 * 
 * @param {number} userId - User ID to get activity for
 * @param {number} limit - Maximum number of logs
 * @returns {Promise<Object>} User activity logs
 */
export async function getUserActivity(userId, limit = 100) {
  const params = new URLSearchParams();
  if (limit) params.append('limit', limit);
  
  const queryString = params.toString();
  const endpoint = `/security/logs/user-activity/${userId}${queryString ? `?${queryString}` : ''}`;
  
  return await secureFetch(endpoint);
}

/**
 * Get Security Statistics
 * Provides overview of security events for dashboard (admin only)
 * 
 * @param {number} hours - Time window in hours
 * @returns {Promise<Object>} Security statistics
 */
export async function getSecurityStats(hours = 24) {
  const params = new URLSearchParams();
  if (hours) params.append('hours', hours);
  
  const queryString = params.toString();
  const endpoint = `/security/logs/stats${queryString ? `?${queryString}` : ''}`;
  
  return await secureFetch(endpoint);
}

/**
 * Default Export - Convenience Export
 * Allows importing main functions directly: import api from './api'
 */
export default {
  loginUser,
  registerPatient,
  fetchDoctors,
  bookAppointment,
  mockApi,
  apiUtils
};
