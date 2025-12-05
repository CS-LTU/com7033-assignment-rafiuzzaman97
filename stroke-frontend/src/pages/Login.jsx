// Login page component - handles user authentication
// Allows users to sign in with username and password
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { FaUserShield, FaSpinner } from 'react-icons/fa';
import { sanitizeInput } from '../utils/validation';

export default function Login() {
  // State for storing username input
  const [username, setUsername] = useState('');
  
  // State for storing password input
  const [password, setPassword] = useState('');
  
  // State for displaying error or success messages
  const [msg, setMsg] = useState('');
  
  // State for tracking loading state during login
  const [isLoading, setIsLoading] = useState(false);
  
  // Get authentication functions from auth context
  const auth = useAuth();
  
  // Hook to navigate between pages
  const nav = useNavigate();

  // Function to handle login form submission
  // Validates credentials and authenticates user
  async function submit(e) {
    e.preventDefault();
    console.log('🎯 LOGIN FORM SUBMITTED');
    setIsLoading(true);
    setMsg('');
    
    // Sanitize username and password to prevent injection attacks
    const sanitizedUsername = sanitizeInput(username);
    const sanitizedPassword = sanitizeInput(password);
    
    // Check if credentials are valid
    if (!sanitizedUsername || !sanitizedPassword) {
      setMsg('Please enter valid credentials');
      setIsLoading(false);
      return;
    }
    
    try {
      // Call authentication function with sanitized credentials
      const res = await auth.signIn(sanitizedUsername, sanitizedPassword);
      console.log('📋 Login result from auth.signIn:', res);
      
      // If login is successful, redirect user to appropriate dashboard
      if (res.ok) {
        console.log('📦 User data from API response:', res.user);
        const role = res.user?.role;
        console.log('🎯 Role from API response:', role);
        
        // Map user roles to their respective dashboard routes
        const routes = {
          admin: '/admin',
          doctor: '/doctor', 
          patient: '/patient'
        };
        
        // Get the target route based on user role
        const targetRoute = routes[role] || '/patient';
        console.log('📍 Navigating to:', targetRoute);
        
        // Navigate to the appropriate dashboard
        nav(targetRoute);
      } else {
        // Display error message if login fails
        console.log('❌ Login failed:', res.message);
        setMsg(res.message || 'Login failed. Please check your credentials.');
      }
    } catch (error) {
      // Handle network or other errors
      console.error('💥 Login error:', error);
      setMsg('Network error. Please try again.');
    } finally {
      // Stop loading indicator
      setIsLoading(false);
      console.log('🏁 Login process completed');
    }
  }

  return (
    <motion.div
      className="max-w-md mx-auto mt-12 card"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Login form header with icon and title */}
      <div className="text-center mb-6 text-primary text-2xl font-bold flex justify-center items-center gap-3">
        <FaUserShield className="text-3xl" /> 
        <span>StrokeCare Portal</span>
      </div>

      {/* Welcome message */}
      <h1 className="text-center text-xl font-semibold text-gray-800 mb-2">Welcome Back</h1>
      <p className="text-center text-gray-600 mb-6">Sign in to your account</p>


      {/* Display error messages if login fails */}
      {msg && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
          {msg}
        </div>
      )}

      {/* Login form with username and password inputs */}
      <form onSubmit={submit} className="flex flex-col gap-4">
        {/* Username input field */}
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
            Username
          </label>
          <input
            id="username"
            className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="Enter your username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
            minLength={3}
            maxLength={50}
            disabled={isLoading}
          />
        </div>
        
        {/* Password input field */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <button
              type="button"
              onClick={() => nav('/forgot-password')}
              className="text-xs text-blue-600 hover:underline font-medium"
            >
              Forgot Password?
            </button>
          </div>
          <input
            id="password"
            type="password"
            className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="Enter your password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
            disabled={isLoading}
          />
        </div>
        
        {/* Submit button - shows spinner while loading */}
        <button 
          type="submit" 
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <FaSpinner className="animate-spin" />
              Signing in...
            </>
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      {/* Demo credentials section for testing
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Demo Credentials:</h3>
        <div className="text-xs text-gray-600 space-y-1">
          <p>Admin: admin / admin123</p>
          <p>Doctor: doctor / doctor123</p>
          <p>Patient: patient / patient123</p>
        </div>
      </div> */}

      {/* Link to registration page for new patients */}
      <p className="mt-6 text-center text-sm text-gray-600">
        New patient?{' '}
        <a href="/register" className="text-blue-600 hover:underline font-medium">
          Register here
        </a>
      </p>
    </motion.div>
  );
}