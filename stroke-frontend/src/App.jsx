/**
 * Main Application Component - App.jsx
 * 
 * Root component that handles:
 * 1. Application layout and page routing
 * 2. Header with user info and navigation
 * 3. Main content area with role-based page access
 * 4. Footer with copyright information
 * 
 * Routing Structure:
 * - Public Routes: Login, Register (accessible to everyone)
 * - Protected Routes: Admin, Doctor, Patient dashboards (requires authentication and specific role)
 * - Catch-all: 404 page for undefined routes
 * 
 * Authentication State:
 * - Uses AuthContext to access current user and logout function
 * - User object contains: id, username, email, role
 * - Role determines which pages user can access (admin/doctor/patient)
 */

import React from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import Login from './pages/Login'
import RegisterPatient from './pages/RegisterPatient'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import AdminDashboard from './pages/AdminDashboard'
import DoctorDashboard from './pages/DoctorDashboard'
import PatientDashboard from './pages/PatientDashboard'
import Appointment from './pages/Appointment'
import ManageDoctors from './pages/ManageDoctors'
import ProtectedRoute from './components/ProtectedRoute'
import { useAuth } from './contexts/AuthContext'
import { motion } from 'framer-motion'
import { FaUserMd, FaUser, FaSignOutAlt } from 'react-icons/fa'

/**
 * Component - App
 * 
 * Main application component rendering the complete page structure including:
 * - Navigation header with user authentication info
 * - Route-based page switching with role-based access control
 * - Smooth page transitions using Framer Motion
 * - Footer with application information
 * 
 * @returns {ReactNode} Complete application JSX with layout and routes
 */
export default function App() {
  // Retrieve current user and logout function from authentication context
  const { user, signOut } = useAuth()

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900 transition-colors duration-300">
      
      {/* 
        ========== HEADER SECTION ==========
        Navigation bar with:
        - Application branding and logo
        - User authentication display
        - Logout functionality
      */}
      <header className="bg-blue-600 dark:bg-blue-800 text-white shadow-md py-4 transition-colors duration-300">
        <div className="container mx-auto flex justify-between items-center px-6">
          
          {/* Logo and Application Title */}
          <Link to="/" className="text-2xl font-bold flex items-center gap-2">
            <FaUserMd className="text-3xl" />
            StrokeCare Portal
          </Link>

          {/* User Navigation Section - Authentication Status Display */}
          <div>
            {user ? (
              // Authenticated User - Show username, role, and logout button
              <div className="flex items-center gap-4">
                {/* Display logged-in user's username and role badge */}
                <span className="text-sm bg-blue-800 px-3 py-1 rounded-full">
                  {user.username} ({user.role})
                </span>
                
                {/* Logout Button - Calls signOut function to end session */}
                <button
                  onClick={signOut}
                  className="flex items-center gap-2 bg-red-500 hover:bg-red-600 px-3 py-2 rounded-lg text-white text-sm"
                >
                  <FaSignOutAlt /> Logout
                </button>
              </div>
            ) : (
              // Unauthenticated User - Show login link
              <Link to="/" className="hover:underline">Login</Link>
            )}
          </div>
        </div>
      </header>

      {/* 
        ========== MAIN CONTENT AREA ==========
        Contains page content with smooth fade-in animation on page load/change
        Uses Framer Motion for professional page transitions
      */}
      <motion.main
        className="flex-grow container mx-auto px-4 py-8"
        initial={{ opacity: 0, y: 15 }}      // Starting state - invisible, slightly down
        animate={{ opacity: 1, y: 0 }}       // Ending state - visible, normal position
        transition={{ duration: 0.4 }}       // Animation duration
      >
        {/* 
          ========== ROUTE DEFINITIONS ==========
          Defines application navigation paths and associated page components
          Uses ProtectedRoute wrapper for role-based access control
        */}
        <Routes>
          {/* 
            ===== PUBLIC ROUTES =====
            Accessible to all visitors (authenticated or not)
          */}
          {/* Login Page - Entry point for user authentication */}
          <Route path='/' element={<Login />} />
          
          {/* Patient Registration Page - Self-registration for new patients */}
          <Route path='/register' element={<RegisterPatient />} />
          
          {/* Forgot Password Page - Request password reset email */}
          <Route path='/forgot-password' element={<ForgotPassword />} />
          
          {/* Reset Password Page - Set new password with token from email */}
          <Route path='/reset-password' element={<ResetPassword />} />

          {/* 
            ===== PROTECTED ROUTES =====
            Wrapped with ProtectedRoute component that checks:
            1. User authentication status (must be logged in)
            2. User role (must match specified role to access)
            
            If access denied, user is redirected to login page
          */}
          
          {/* Admin Dashboard - System analytics and user management (admin only) */}
          <Route 
            path='/admin' 
            element={<ProtectedRoute role='admin'><AdminDashboard /></ProtectedRoute>} 
          />
          
          {/* Manage Doctors Page - Full CRUD operations for doctors (admin only) */}
          <Route 
            path='/admin/doctors' 
            element={<ProtectedRoute role='admin'><ManageDoctors /></ProtectedRoute>} 
          />
          
          {/* Doctor Dashboard - Patient list and medical records management (doctor only) */}
          <Route 
            path='/doctor' 
            element={<ProtectedRoute role='doctor'><DoctorDashboard /></ProtectedRoute>} 
          />
          
          {/* Patient Dashboard - Personal health overview and appointments (patient only) */}
          <Route 
            path='/patient' 
            element={<ProtectedRoute role='patient'><PatientDashboard /></ProtectedRoute>} 
          />
          
          {/* Appointment Booking Page - Schedule appointments with doctors (patient only) */}
          <Route 
            path='/appointment' 
            element={<ProtectedRoute role='patient'><Appointment /></ProtectedRoute>} 
          />

          {/* 
            ===== ERROR ROUTE =====
            Catch-all route for undefined/invalid paths
            Displays 404 page not found message
          */}
          <Route path='*' element={<div className="text-center text-2xl">404 - Page Not Found</div>} />
        </Routes>
      </motion.main>

      {/* 
        ========== FOOTER SECTION ==========
        Displays copyright, course information, and application metadata
      */}
      <footer className="bg-gray-100 dark:bg-gray-800 text-center py-3 text-sm text-gray-600 dark:text-gray-400 border-t dark:border-gray-700 transition-colors duration-300">
        © 2025 StrokeCare System | Secure Software Development (COM7033)
      </footer>
    </div>
  )
}
