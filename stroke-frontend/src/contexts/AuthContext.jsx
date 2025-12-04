/**
 * AuthContext - Application-Wide Authentication State Management
 * 
 * This context provides authentication state and functions to all components in the application.
 * It manages user login/logout, stores authentication tokens, and persists user data across sessions.
 * 
 * Purpose: Centralized authentication state and functions using React Context API
 * Provides: user object, signIn function, signOut function, loading state
 */

import React, { createContext, useState, useContext, useEffect } from 'react';
import { loginUser } from '../api';
import { secureStorage } from '../utils/secureStorage';

// Create authentication context for providing auth state to child components
const AuthContext = createContext();

/**
 * AuthProvider Component - Wraps application to provide authentication context
 * 
 * Responsibilities:
 * 1. Manages user authentication state (login/logout)
 * 2. Persists user session across page refreshes using secure storage
 * 3. Handles API communication for authentication
 * 4. Provides signIn/signOut functions to all child components
 * 
 * @param {Object} props - Component props
 * @param {ReactNode} props.children - Child components that will have access to auth context
 * 
 * @returns {ReactNode} AuthContext.Provider wrapping children
 * 
 * Usage:
 *   <AuthProvider>
 *     <App />
 *   </AuthProvider>
 */
export function AuthProvider({ children }) {
  // State to store currently logged-in user object (null if not authenticated)
  const [user, setUser] = useState(null);
  
  // State to track if authentication status is being verified (prevents UI flashing)
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Effect Hook - Restore User Session on App Load
   * 
   * Runs once on component mount to check if user data exists in secure storage.
   * This allows users to stay logged in after page refresh.
   * 
   * Logic:
   * 1. Retrieve stored user from sessionStorage via secureStorage utility
   * 2. If user exists in storage, set it to state (session restored)
   * 3. Set loading to false to indicate auth check is complete
   */
  useEffect(() => {
    console.log('🔄 AuthProvider MOUNTING');
    // Retrieve previously stored user data from secure storage
    const storedUser = secureStorage.get('st_user');
    console.log('📦 Stored user from sessionStorage:', storedUser);
    
    if (storedUser) {
      console.log('✅ Setting user from storage');
      // Restore user session from storage
      setUser(storedUser);
    } else {
      console.log('❌ No stored user found');
    }
    // Indicate authentication check is complete
    setIsLoading(false);
  }, []);

  /**
   * Function - User Sign In with Credentials
   * 
   * Authenticates user by sending credentials to backend API.
   * On success, stores user data and token in secure storage for session persistence.
   * 
   * @async
   * @param {string} username - User's username or email
   * @param {string} password - User's password
   * 
   * @returns {Promise<Object>} Result object with structure:
   *   {
   *     ok: boolean,                    // True if login successful
   *     message: string,                // Status/error message
   *     user: Object (if ok: true)      // User data object with id, username, role
   *   }
   * 
   * Flow:
   * 1. Call loginUser() API function with credentials
   * 2. If response includes token + user data, store in state and secure storage
   * 3. If response fails, return error message
   * 4. Always set isLoading to false when complete
   */
  const signIn = async (username, password) => {
    try {
      console.log('🔐 SIGN IN STARTED for:', username);
      // Set loading to true during API call
      setIsLoading(true);
      
      // Call backend API to authenticate user credentials
      const response = await loginUser({ username, password });
      console.log('📨 Login API response:', response);
      
      // Check if API returned success with token and user data
      if (response.token && response.user) {
        // Create user object with token included for future API calls
        const userData = {
          ...response.user,
          token: response.token
        };
        
        console.log('💾 Storing user data:', userData);
        // Update user state to logged-in state
        setUser(userData);
        // Persist user data in secure storage for session persistence
        secureStorage.set('st_user', userData);
        
        console.log('✅ SIGN IN SUCCESS - User state updated');
        // Return success with user information
        return { ok: true, message: 'Login successful', user: response.user };
      } else {
        // API response did not include required token or user data
        console.log('❌ SIGN IN FAILED - No token in response');
        return { ok: false, message: response.message || 'Login failed' };
      }
      
    } catch (error) {
      // Handle network errors, API errors, or other exceptions
      console.error('💥 SIGN IN ERROR:', error);
      return { 
        ok: false, 
        message: error.message || 'Network error. Please try again.' 
      };
    } finally {
      // Always set loading to false when sign-in attempt is complete
      setIsLoading(false);
      console.log('🏁 SIGN IN COMPLETED - isLoading set to false');
    }
  };

  /**
   * Function - User Sign Out / Logout
   * 
   * Clears user session by:
   * 1. Removing user from state
   * 2. Clearing user data from secure storage
   * 3. Clearing authentication token from secure storage
   * 
   * Effect: User will be required to log in again; state persists logout on refresh
   */
  const signOut = () => {
    console.log('🚪 SIGNING OUT');
    // Clear user from React state
    setUser(null);
    // Remove user data from secure storage
    secureStorage.remove('st_user');
    // Remove authentication token from secure storage
    secureStorage.remove('st_token');
  };

  /**
   * Context Value Object - Contains all auth-related state and functions
   * 
   * Properties:
   * - user: Current user object (null if not logged in)
   * - signIn: Function to authenticate with username/password
   * - signOut: Function to logout current user
   * - isLoading: Boolean indicating if auth check is in progress
   */
  const value = {
    user,
    signIn,
    signOut,
    isLoading
  };

  console.log('🎯 AuthContext RENDER - user:', user, 'isLoading:', isLoading);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook - useAuth
 * 
 * Provides access to authentication context in any child component.
 * Must be called within a component tree wrapped by AuthProvider.
 * 
 * @throws {Error} If called outside of AuthProvider (hook misuse)
 * 
 * @returns {Object} Authentication context object with:
 *   {
 *     user: Object|null,       // Current user data or null
 *     signIn: Function,        // Async login function
 *     signOut: Function,       // Logout function
 *     isLoading: boolean       // Auth status check in progress
 *   }
 * 
 * Usage in components:
 *   const { user, signIn, signOut, isLoading } = useAuth();
 *   
 *   // Check if user is logged in
 *   if (user) {
 *     console.log(`Logged in as ${user.username} (${user.role})`);
 *   }
 *   
 *   // Sign in user
 *   const result = await signIn('username', 'password');
 *   
 *   // Sign out user
 *   signOut();
 */
export const useAuth = () => {
  // Retrieve authentication context
  const context = useContext(AuthContext);
  
  // Validate context is being used within AuthProvider
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};