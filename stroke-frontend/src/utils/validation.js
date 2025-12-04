/**
 * Validation Utilities - validation.js
 * 
 * Collection of helper functions for data validation and input sanitization.
 * Used throughout the application to:
 * - Prevent XSS (cross-site scripting) attacks via input sanitization
 * - Validate medical data (age, BMI, glucose levels)
 * - Validate form inputs (passwords, emails, appointments)
 * - Ensure data integrity before sending to backend
 */

/**
 * Function - sanitizeInput
 * 
 * Removes potentially dangerous characters and patterns from user input to prevent XSS attacks.
 * 
 * @param {*} input - User input to sanitize (any type)
 * @returns {*} Sanitized input (dangerous characters removed) or original input if not string
 * 
 * Security measures:
 * - Removes '<' and '>' characters (prevent HTML injection)
 * - Removes 'javascript:' protocol (prevent javascript: URLs)
 * - Removes 'onerror' handler (prevent error event exploitation)
 * - Removes 'onload' handler (prevent load event exploitation)
 * - Trims whitespace from beginning/end
 * 
 * Usage:
 *   const safeName = sanitizeInput(userInput);
 *   const safeEmail = sanitizeInput(emailInput);
 */
export const sanitizeInput = (input) => {
  // Return non-strings unchanged
  if (typeof input !== 'string') return input;
  
  // Remove potential XSS vectors
  return input
    .replace(/[<>]/g, '')                  // Remove HTML brackets
    .replace(/javascript:/gi, '')          // Remove javascript: protocol
    .replace(/onerror/gi, '')              // Remove onerror handler
    .replace(/onload/gi, '')               // Remove onload handler
    .trim();                               // Remove leading/trailing whitespace
};

/**
 * Function - validateMedicalData
 * 
 * Validates medical data fields against clinical ranges.
 * Ensures data is realistic and within acceptable medical parameters.
 * 
 * @param {Object} data - Medical data to validate
 * @param {number} data.age - Patient age in years (0-120)
 * @param {number} data.bmi - Body Mass Index (10-60)
 * @param {number} data.avg_glucose_level - Blood glucose level (50-300 mg/dL)
 * 
 * @returns {Array<string>} Array of error messages (empty if no errors)
 * 
 * Validations:
 * - Age: 0-120 years (must exist)
 * - BMI: 10-60 (reasonable BMI range)
 * - Glucose: 50-300 mg/dL (clinical range)
 * 
 * Usage:
 *   const errors = validateMedicalData({age: 45, bmi: 25, avg_glucose_level: 120});
 *   if (errors.length > 0) {
 *     console.error(errors); // Display validation errors to user
 *   }
 */
export const validateMedicalData = (data) => {
  const errors = [];
  
  // Age validation - must be present and within human lifespan
  if (!data.age || data.age < 0 || data.age > 120) {
    errors.push('Age must be between 0 and 120');
  }
  
  // BMI validation - Body Mass Index range validation
  if (!data.bmi || data.bmi < 10 || data.bmi > 60) {
    errors.push('BMI must be between 10 and 60');
  }
  
  // Glucose level validation - Blood glucose in mg/dL
  if (!data.avg_glucose_level || data.avg_glucose_level < 50 || data.avg_glucose_level > 300) {
    errors.push('Glucose level must be between 50 and 300');
  }
  
  return errors;
};

/**
 * Function - validatePassword
 * 
 * Validates password meets minimum security requirements.
 * 
 * @param {string} password - Password to validate
 * @returns {string|null} Error message if invalid, null if valid
 * 
 * Requirements:
 * - Minimum 6 characters long
 * 
 * Future enhancements could include:
 * - Uppercase/lowercase letter mix
 * - Special character requirement
 * - Digit requirement
 * 
 * Usage:
 *   const error = validatePassword(userPassword);
 *   if (error) console.error(error);
 */
export const validatePassword = (password) => {
  // Check minimum length requirement
  if (password.length < 6) {
    return 'Password must be at least 6 characters long';
  }
  return null;
};

/**
 * Function - validateEmail
 * 
 * Validates email format using regex pattern.
 * Basic validation - more thorough validation should happen on backend.
 * 
 * @param {string} email - Email address to validate
 * @returns {string|null} Error message if invalid, null if valid
 * 
 * Pattern check:
 * - Must have characters before '@'
 * - Must have '@' symbol
 * - Must have characters after '@' and before '.'
 * - Must have domain extension (e.g., .com, .org)
 * 
 * Usage:
 *   const error = validateEmail(emailInput);
 *   if (error) console.error(error); // "Please enter a valid email address"
 */
export const validateEmail = (email) => {
  // Basic email format regex validation
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(email)) {
    return 'Please enter a valid email address';
  }
  return null;
};

/**
 * Function - validateAppointmentData
 * 
 * Comprehensive validation for appointment booking form data.
 * Checks all required fields and business logic constraints.
 * 
 * @param {Object} data - Appointment data to validate
 * @param {string} data.doctor_id - Selected doctor ID (required)
 * @param {string} data.date - Appointment date (required, not in past)
 * @param {string} data.time - Appointment time (required)
 * @param {string} data.reason - Reason for appointment (min 10 chars)
 * @param {string} [data.urgency] - Urgency level (optional)
 * 
 * @returns {Array<string>} Array of error messages (empty if valid)
 * 
 * Validations:
 * - Doctor ID must be selected
 * - Date must be provided and not in the past
 * - Time must be provided
 * - Reason must be at least 10 characters (prevents vague bookings)
 * - Cannot book more than 3 months in advance
 * 
 * Business Rules:
 * - No past date booking (selected date >= today)
 * - Maximum advance booking: 3 months
 * - Reason for appointment prevents spam/vague bookings
 * 
 * Usage:
 *   const errors = validateAppointmentData({
 *     doctor_id: '5',
 *     date: '2024-12-15',
 *     time: '10:00',
 *     reason: 'Regular checkup for hypertension monitoring'
 *   });
 *   if (errors.length > 0) {
 *     // Display errors to user
 *   }
 */
export const validateAppointmentData = (data) => {
  const errors = [];
  
  // Doctor selection is required
  if (!data.doctor_id) errors.push('Doctor selection is required');
  
  // Date selection is required
  if (!data.date) errors.push('Date is required');
  
  // Time selection is required
  if (!data.time) errors.push('Time is required');
  
  // Reason must be provided and meaningful (at least 10 characters)
  if (!data.reason || data.reason.trim().length < 10) {
    errors.push('Please provide a detailed reason (minimum 10 characters)');
  }
  
  /**
   * Date Range Validation - Prevent booking past dates and too far in future
   */
  const selectedDate = new Date(data.date);
  const today = new Date();
  // Reset time to midnight for accurate date comparison
  today.setHours(0, 0, 0, 0);
  
  // Cannot book appointments in the past
  if (selectedDate < today) {
    errors.push('Cannot book appointments in the past');
  }
  
  // Future date limit (3 months maximum advance booking)
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 3);
  if (selectedDate > maxDate) {
    errors.push('Appointments can only be booked up to 3 months in advance');
  }
  
  return errors;
};

/**
 * Function - sanitizeHtml
 * 
 * Escapes HTML content by converting it to plain text.
 * Prevents HTML/JavaScript execution in the DOM.
 * 
 * @param {string} html - HTML string to sanitize
 * @returns {string} Sanitized text content (HTML entities escaped)
 * 
 * How it works:
 * 1. Creates temporary div element
 * 2. Sets HTML content as textContent (automatically escapes)
 * 3. Retrieves escaped innerHTML
 * 
 * Usage:
 *   const safeHtml = sanitizeHtml(userGeneratedHtml);
 *   element.innerHTML = safeHtml; // Safe to display in DOM
 * 
 * Example:
 *   Input: '<img src=x onerror="alert(1)">'
 *   Output: '&lt;img src=x onerror="alert(1)"&gt;'
 */
export const sanitizeHtml = (html) => {
  // Create temporary div element
  const temp = document.createElement('div');
  // Set content as text (automatically escapes HTML)
  temp.textContent = html;
  // Retrieve escaped HTML content
  return temp.innerHTML;
};
