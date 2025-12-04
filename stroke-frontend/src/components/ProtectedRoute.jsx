/**
 * ProtectedRoute Component - Role-Based Access Control Wrapper
 * 
 * This component wraps protected pages and ensures only authenticated users with the correct
 * role can access them. It checks authentication status and role permissions before rendering
 * child components. If access is denied, it redirects users to the login page.
 * 
 * Purpose: Implement role-based access control (RBAC) for route protection
 * Roles Supported: "patient", "doctor", "admin"
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * ProtectedRoute - Validates authentication and role-based access before rendering component
 * 
 * @param {Object} props - Component props
 * @param {ReactNode} props.children - Child components to render if access is granted
 * @param {string} [props.role=null] - Required user role for access. If null, only authentication is checked.
 *                                     Valid values: "patient", "doctor", "admin"
 * 
 * @returns {ReactNode} Loading spinner, Navigation component, or children based on auth state and role
 * 
 * Usage Examples:
 *   <ProtectedRoute><PatientDashboard /></ProtectedRoute>  // Only check authentication
 *   <ProtectedRoute role="patient"><PatientDashboard /></ProtectedRoute>  // Check auth + patient role
 *   <ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>  // Check auth + admin role
 */
const ProtectedRoute = ({ children, role = null }) => {
  // Get authentication state and user info from AuthContext
  const { user, isLoading } = useAuth();

  console.log('🛡️ ProtectedRoute CHECK - user:', user, 'isLoading:', isLoading, 'required role:', role);

  /**
   * Loading State - Display while authentication status is being verified
   * This prevents brief flashes of the login page while checking auth state
   */
  if (isLoading) {
    console.log('⏳ ProtectedRoute: Loading...');
    return (
      <div className="flex justify-center items-center h-64">
        {/* Animated spinner indicating data is being loaded */}
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  /**
   * No User Authentication - Redirect to login page
   * If user is not authenticated (null), deny access and redirect to home/login
   */
  if (!user) {
    console.log('🚫 ProtectedRoute: No user - REDIRECTING to login');
    return <Navigate to="/" replace />;
  }

  /**
   * Role Validation - Check if user has required role
   * If a specific role is required and user's role doesn't match, deny access
   * This prevents patients from accessing doctor pages, for example
   */
  if (role && user.role !== role) {
    console.log(`🚫 ProtectedRoute: Role mismatch - user has ${user.role}, required ${role} - REDIRECTING`);
    return <Navigate to="/" replace />;
  }

  /**
   * Access Granted - Render protected component
   * User is authenticated and has the required role (if specified)
   */
  console.log('✅ ProtectedRoute: ACCESS GRANTED for role:', user.role);
  return children;
};

export default ProtectedRoute;