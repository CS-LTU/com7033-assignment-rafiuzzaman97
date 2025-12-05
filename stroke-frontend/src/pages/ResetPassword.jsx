// Reset Password page component - handles password reset with token
// Allows users to set a new password using the reset token from email
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaLock, FaSpinner, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { sanitizeInput } from '../utils/validation';
import api from '../api';

export default function ResetPassword() {
  // Get token from URL query parameters
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  // State for password inputs
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // State for messages
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState(''); // 'success' or 'error'
  
  // State for loading
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  
  // State for token validity
  const [tokenValid, setTokenValid] = useState(false);
  
  // State for password reset success
  const [resetSuccess, setResetSuccess] = useState(false);
  
  // Hook to navigate
  const nav = useNavigate();

  // Verify token on component mount
  useEffect(() => {
    async function verifyToken() {
      if (!token) {
        setMsg('Invalid or missing reset token');
        setMsgType('error');
        setTokenValid(false);
        setIsVerifying(false);
        return;
      }

      try {
        // Verify token with backend
        await api.post('/auth/verify-reset-token', { token });
        setTokenValid(true);
        console.log('✅ Reset token verified successfully');
      } catch (error) {
        console.error('❌ Token verification failed:', error);
        
        if (error.response?.status === 404 || error.response?.status === 400) {
          setMsg('This reset link is invalid or has expired. Please request a new one.');
        } else {
          setMsg('Unable to verify reset link. Please try again.');
        }
        setMsgType('error');
        setTokenValid(false);
      } finally {
        setIsVerifying(false);
      }
    }

    verifyToken();
  }, [token]);

  // Function to handle password reset form submission
  async function submit(e) {
    e.preventDefault();
    console.log('🔐 RESET PASSWORD FORM SUBMITTED');
    setIsLoading(true);
    setMsg('');
    setMsgType('');
    
    // Sanitize inputs
    const sanitizedPassword = sanitizeInput(password);
    const sanitizedConfirmPassword = sanitizeInput(confirmPassword);
    
    // Validate passwords
    if (sanitizedPassword.length < 6) {
      setMsg('Password must be at least 6 characters long');
      setMsgType('error');
      setIsLoading(false);
      return;
    }
    
    if (sanitizedPassword !== sanitizedConfirmPassword) {
      setMsg('Passwords do not match');
      setMsgType('error');
      setIsLoading(false);
      return;
    }
    
    try {
      // Send password reset request to backend
      await api.post('/auth/reset-password', {
        token,
        password: sanitizedPassword
      });
      
      console.log('✅ Password reset successfully');
      
      // Show success message
      setMsg('Your password has been reset successfully! Redirecting to login...');
      setMsgType('success');
      setResetSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        nav('/login');
      }, 3000);
      
    } catch (error) {
      console.error('❌ Password reset error:', error);
      
      // Display appropriate error message
      if (error.response?.data?.message) {
        setMsg(error.response.data.message);
      } else if (error.response?.status === 400) {
        setMsg('Invalid or expired reset token. Please request a new one.');
      } else {
        setMsg('Unable to reset password. Please try again later.');
      }
      setMsgType('error');
      
    } finally {
      setIsLoading(false);
      console.log('🏁 Password reset process completed');
    }
  }

  // Show loading spinner while verifying token
  if (isVerifying) {
    return (
      <motion.div
        className="max-w-md mx-auto mt-12 card text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
        <p className="text-gray-600">Verifying reset link...</p>
      </motion.div>
    );
  }

  // Show error if token is invalid
  if (!tokenValid) {
    return (
      <motion.div
        className="max-w-md mx-auto mt-12 card"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="text-center">
          <FaTimesCircle className="text-5xl text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Invalid Reset Link</h1>
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
            {msg}
          </div>
          <button
            onClick={() => nav('/forgot-password')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Request New Reset Link
          </button>
          <button
            onClick={() => nav('/login')}
            className="w-full mt-3 border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Back to Login
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="max-w-md mx-auto mt-12 card"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Page header */}
      <div className="text-center mb-6">
        <div className="flex justify-center mb-4">
          <div className="bg-blue-100 rounded-full p-4">
            <FaLock className="text-3xl text-blue-600" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Reset Your Password</h1>
        <p className="text-gray-600">
          {resetSuccess 
            ? "Password reset successful!"
            : "Enter your new password below"
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

      {!resetSuccess ? (
        // Password reset form
        <form onSubmit={submit} className="flex flex-col gap-4">
          {/* New password input */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>
            <input
              id="password"
              type="password"
              className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Enter new password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
          </div>
          
          {/* Confirm password input */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Confirm New Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              disabled={isLoading}
            />
          </div>
          
          {/* Submit button */}
          <button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <FaSpinner className="animate-spin" />
                Resetting Password...
              </>
            ) : (
              <>
                <FaLock />
                Reset Password
              </>
            )}
          </button>
        </form>
      ) : (
        // Success state
        <div className="text-center">
          <FaCheckCircle className="text-5xl text-green-500 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">Redirecting to login page...</p>
          <button
            onClick={() => nav('/login')}
            className="text-blue-600 hover:underline font-medium"
          >
            Click here if not redirected
          </button>
        </div>
      )}

      {/* Security tips */}
      {!resetSuccess && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Password Tips:</h3>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Use at least 6 characters</li>
            <li>• Include numbers and special characters</li>
            <li>• Don't reuse passwords from other sites</li>
            <li>• Avoid common words or personal information</li>
          </ul>
        </div>
      )}
    </motion.div>
  );
}
