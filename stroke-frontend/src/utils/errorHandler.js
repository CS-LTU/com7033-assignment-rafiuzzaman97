/**
 * Error Handling Utilities - errorHandler.js
 * 
 * Provides centralized error handling and logging functionality.
 * Includes custom error classes and functions for consistent error management.
 */

/**
 * Class - AppError
 * 
 * Custom error class for application-specific errors.
 * Extends native Error to include error code for better error categorization and handling.
 * 
 * @extends Error
 * @constructor
 * @param {string} message - Human-readable error message to display to user
 * @param {string} [code='UNKNOWN_ERROR'] - Machine-readable error code for error handling logic
 * 
 * Properties:
 * - message: Error message text
 * - name: Always 'AppError' for identification
 * - code: Error code for specific error handling (e.g., 'AUTH_FAILED', 'NETWORK_ERROR')
 * 
 * Usage:
 *   throw new AppError('Authentication failed', 'AUTH_FAILED');
 *   
 *   try {
 *     // some code
 *   } catch (error) {
 *     if (error instanceof AppError) {
 *       console.log('Code:', error.code); // 'AUTH_FAILED'
 *       console.log('Message:', error.message);
 *     }
 *   }
 */
export class AppError extends Error {
  constructor(message, code = 'UNKNOWN_ERROR') {
    super(message);
    this.name = 'AppError';
    this.code = code;
  }
}

/**
 * Function - handleApiError
 * 
 * Processes API errors and returns user-friendly error messages.
 * Converts various error types to consistent response format.
 * 
 * @param {Error|AppError} error - Error object from API call
 * @returns {Object} Standardized error response object
 *   {
 *     ok: false,            // Indicates error occurred
 *     message: string       // User-friendly error message
 *   }
 * 
 * Error Handling Logic:
 * 1. If AppError - return its message directly
 * 2. If network fetch failure - return network error message
 * 3. Otherwise - return generic error message
 * 
 * This ensures users always get meaningful feedback without exposing
 * technical details that could be confusing.
 * 
 * Usage:
 *   try {
 *     const response = await fetchData();
 *   } catch (error) {
 *     const result = handleApiError(error);
 *     showToast(result.message); // Display error to user
 *   }
 */
export const handleApiError = (error) => {
  console.error('API Error:', error);
  
  // If it's our custom AppError, use its message
  if (error instanceof AppError) {
    return { ok: false, message: error.message };
  }
  
  // Network fetch failures get specific handling
  if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
    return { ok: false, message: 'Network error. Please check your connection.' };
  }
  
  // Fallback for unexpected errors
  return { ok: false, message: 'An unexpected error occurred. Please try again.' };
};

/**
 * Function - logError
 * 
 * Centralized error logging function with timestamp and context.
 * Logs to console in development; in production, could send to external service.
 * 
 * @param {Error} error - Error object to log
 * @param {string} [context=''] - Context describing where error occurred (component name, function name, etc.)
 * 
 * Output Format:
 * [ISO_TIMESTAMP] Error in CONTEXT: ERROR_DETAILS
 * 
 * Example:
 * [2024-11-20T14:30:45.123Z] Error in PatientDashboard.fetchAppointments: TypeError: Cannot read properties of undefined
 * 
 * Production Behavior:
 * In production environments, errors can be sent to external logging services:
 * - Sentry: Application performance monitoring and error tracking
 * - LogRocket: Session replay and error logging
 * - Datadog: Infrastructure and application monitoring
 * - CloudWatch: AWS logging service
 * 
 * Usage:
 *   try {
 *     await loadPatientData();
 *   } catch (error) {
 *     logError(error, 'PatientDashboard.loadPatientData');
 *   }
 */
export const logError = (error, context = '') => {
  // Create timestamp for error tracking
  const timestamp = new Date().toISOString();
  // Log error with context and timestamp to console
  console.error(`[${timestamp}] Error in ${context}:`, error);
  
  // In production, send to external error tracking service
  if (process.env.NODE_ENV === 'production') {
    // Example implementations:
    // Sentry.captureException(error, { contexts: { context } });
    // window.datadog?.rum?.addError(error);
    // logRocket?.captureException(error);
  }
};