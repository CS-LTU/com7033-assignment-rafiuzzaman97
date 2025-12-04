/**
 * Secure Storage Utility - secureStorage.js
 * 
 * Wrapper around browser's sessionStorage API with error handling and JSON serialization.
 * Provides safe, consistent interface for storing and retrieving sensitive data like:
 * - Authentication tokens
 * - User session data
 * - Temporary application state
 * 
 * Security Notes:
 * - Uses sessionStorage (cleared when browser tab closes)
 * - NOT suitable for highly sensitive data like passwords
 * - Data is base64 encoded by browser but not encrypted
 * - Use with HTTPS in production for network security
 * 
 * Alternative: For production applications requiring encryption, consider:
 * - IndexedDB with encryption libraries
 * - Web Crypto API for client-side encryption
 * - Secure HttpOnly cookies for auth tokens
 */

/**
 * Object - secureStorage
 * 
 * Provides methods for safely storing/retrieving data in sessionStorage.
 * Automatically handles JSON serialization and error handling.
 */
export const secureStorage = {
  /**
   * Method - set
   * 
   * Stores a value in sessionStorage with automatic JSON serialization.
   * Wraps in try-catch to handle storage quota and serialization errors.
   * 
   * @param {string} key - Storage key to use (e.g., 'st_user', 'st_token')
   * @param {*} value - Value to store (automatically JSON stringified)
   * 
   * Behavior:
   * - Converts value to JSON string before storing
   * - Catches and logs errors (full storage, serialization failures, etc.)
   * - Silent failure - error is logged but doesn't throw
   * 
   * Usage:
   *   secureStorage.set('st_user', { id: 1, username: 'john', role: 'patient' });
   *   secureStorage.set('st_token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
   */
  set: (key, value) => {
    try {
      // Serialize value to JSON and store in sessionStorage
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      // Log error but don't throw - prevents app crash from storage issues
      console.error('Storage error:', error);
    }
  },
  
  /**
   * Method - get
   * 
   * Retrieves and deserializes value from sessionStorage.
   * Returns null if key doesn't exist or deserialization fails.
   * 
   * @param {string} key - Storage key to retrieve
   * @returns {*|null} Deserialized value or null if not found/error
   * 
   * Behavior:
   * - Retrieves value from sessionStorage
   * - Parses JSON string to restore original data type
   * - Returns null if key not found
   * - Catches and logs errors, returns null instead of throwing
   * 
   * Usage:
   *   const user = secureStorage.get('st_user');
   *   if (user) {
   *     console.log(user.username); // Original object structure restored
   *   }
   */
  get: (key) => {
    try {
      // Retrieve value from sessionStorage
      const item = sessionStorage.getItem(key);
      // If found, parse JSON and return; otherwise return null
      return item ? JSON.parse(item) : null;
    } catch (error) {
      // Log error but return null - prevents app crash from deserialization issues
      console.error('Storage error:', error);
      return null;
    }
  },
  
  /**
   * Method - remove
   * 
   * Removes a single key from sessionStorage.
   * Used to delete specific stored values (e.g., logout).
   * 
   * @param {string} key - Storage key to remove
   * 
   * Usage:
   *   // On logout, remove user data
   *   secureStorage.remove('st_user');
   *   secureStorage.remove('st_token');
   */
  remove: (key) => {
    sessionStorage.removeItem(key);
  },
  
  /**
   * Method - clear
   * 
   * Clears ALL data from sessionStorage.
   * Nuclear option - removes all stored data at once.
   * 
   * Usage:
   *   // On app logout or session end
   *   secureStorage.clear();
   * 
   * Note:
   *   This is more aggressive than removing individual keys.
   *   Use remove() for specific keys, clear() for complete cleanup.
   */
  clear: () => {
    sessionStorage.clear();
  }
};