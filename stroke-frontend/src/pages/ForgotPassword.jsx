// Forgot Password page component - handles password reset requests
// Allows users to request a password reset link via email
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaEnvelope, FaSpinner, FaCheckCircle, FaArrowLeft } from 'react-icons/fa';
import { sanitizeInput } from '../utils/validation';
import api from '../api';

export default function ForgotPassword() {
  // State for storing email input
  const [email, setEmail] = useState('');
  
  // State for displaying messages
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState(''); // 'success' or 'error'
  
  // State for tracking loading state
  const [isLoading, setIsLoading] = useState(false);
  
  // State to track if email was sent successfully
  const [emailSent, setEmailSent] = useState(false);
  
  // Hook to navigate between pages
  const nav = useNavigate();

  // Function to handle forgot password form submission
  async function submit(e) {
    e.preventDefault();
    console.log('🔐 FORGOT PASSWORD FORM SUBMITTED');
    setIsLoading(true);
    setMsg('');
    setMsgType('');
    
    // Sanitize email to prevent injection attacks
    const sanitizedEmail = sanitizeInput(email);
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitizedEmail)) {
      setMsg('Please enter a valid email address');
      setMsgType('error');
      setIsLoading(false);
      return;
    }
    
    try {
      // Send password reset request to backend
      const response = await api.post('/auth/forgot-password', { 
        email: sanitizedEmail 
      });
      
      console.log('✅ Password reset email sent successfully');
      
      // Show success message
      setMsg('Password reset instructions have been sent to your email address. Please check your inbox.');
      setMsgType('success');
      setEmailSent(true);
      
    } catch (error) {
      console.error('❌ Forgot password error:', error);
      
      // Display appropriate error message
      if (error.response?.data?.message) {
        setMsg(error.response.data.message);
      } else if (error.response?.status === 404) {
        setMsg('No account found with this email address');
      } else if (error.response?.status === 429) {
        setMsg('Too many requests. Please try again later');
      } else {
        setMsg('Unable to process request. Please try again later');
      }
      setMsgType('error');
      
    } finally {
      setIsLoading(false);
      console.log('🏁 Forgot password process completed');
    }
  }

  return (
    <motion.div
      className="max-w-md mx-auto mt-12 card"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Back to login link */}
      <button
        onClick={() => nav('/login')}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 text-sm font-medium transition-colors"
      >
        <FaArrowLeft /> Back to Login
      </button>

      {/* Page header with icon and title */}
      <div className="text-center mb-6">
        <div className="flex justify-center mb-4">
          <div className="bg-blue-100 rounded-full p-4">
            <FaEnvelope className="text-3xl text-blue-600" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Forgot Password?</h1>
        <p className="text-gray-600">
          {emailSent 
            ? "Check your email for reset instructions"
            : "Enter your email address and we'll send you instructions to reset your password"
          }
        </p>
      </div>

      {/* Display success or error messages */}
      {msg && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${
            msgType === 'success' 
              ? 'bg-green-50 border-green-200 text-green-700' 
              : 'bg-red-50 border-red-200 text-red-700'
          } border px-4 py-3 rounded-lg mb-6 text-sm flex items-start gap-2`}
        >
          {msgType === 'success' && <FaCheckCircle className="mt-0.5 flex-shrink-0" />}
          <span>{msg}</span>
        </motion.div>
      )}

      {!emailSent ? (
        // Password reset request form
        <form onSubmit={submit} className="flex flex-col gap-4">
          {/* Email input field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Enter your email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
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
                Sending...
              </>
            ) : (
              <>
                <FaEnvelope />
                Send Reset Instructions
              </>
            )}
          </button>
        </form>
      ) : (
        // Success state - show options after email sent
        <div className="space-y-4">
          <button
            onClick={() => {
              setEmailSent(false);
              setEmail('');
              setMsg('');
              setMsgType('');
            }}
            className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Try Different Email
          </button>
          
          <button
            onClick={() => nav('/login')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Return to Login
          </button>
        </div>
      )}

      {/* Help text */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Need Help?</h3>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• Check your spam folder if you don't see the email</li>
          <li>• Reset links expire after 1 hour for security</li>
          <li>• Contact support if you continue having issues</li>
        </ul>
      </div>

      {/* Link back to login */}
      <p className="mt-6 text-center text-sm text-gray-600">
        Remember your password?{' '}
        <button 
          onClick={() => nav('/login')}
          className="text-blue-600 hover:underline font-medium"
        >
          Sign in
        </button>
      </p>
    </motion.div>
  );
}
