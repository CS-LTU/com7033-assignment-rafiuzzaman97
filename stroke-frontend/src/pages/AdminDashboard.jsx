// src/pages/AdminDashboard.jsx
// Admin Dashboard Component - displays system statistics and management options
// Provides overview of patients, doctors, appointments, and high-risk patients
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getSystemStats, getAllUsers, updateUser, createUser, getSecurityLogs } from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUsers, FaUserMd, FaChartBar, FaShieldAlt, FaExclamationTriangle, FaTimes, FaEdit, FaTrash, FaPlus, FaEye, FaEyeSlash } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

// Main Admin Dashboard component
// Fetches and displays system statistics, recent user activity, and management options
export default function AdminDashboard() {
  // Get authenticated user from auth context
  const { user } = useAuth();
  
  // Navigation hook
  const navigate = useNavigate();
  
  // State to store system statistics (patients, doctors, appointments, high-risk patients)
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalDoctors: 0,
    todayAppointments: 0,
    highRiskPatients: 0
  });
  
  // State to store recent user activity/events in the system
  const [recentActivity, setRecentActivity] = useState([]);
  
  // State to store security logs
  const [securityLogs, setSecurityLogs] = useState([]);
  
  // State to track if data is currently being loaded from API
  const [loading, setLoading] = useState(true);
  
  // State to store error messages if API calls fail
  const [error, setError] = useState(null);

  // Modal states for different management sections
  const [showDoctorsModal, setShowDoctorsModal] = useState(false);
  const [showPatientsModal, setShowPatientsModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  
  // User management states
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userFormData, setUserFormData] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'doctor',
    phone: '',
    specialization: ''
  });

  // Effect hook to load dashboard data when component mounts or user changes
  // Fetches system statistics and user list from API
  useEffect(() => {
    if (!user) return;
    // Flag to prevent state updates after component unmounts
    let isMounted = true;

    // Async function to fetch all dashboard data from the API
    const loadDashboardData = async () => {
      try {
        // Show loading state while fetching data
        setLoading(true);
        setError(null);

        // Fetch system statistics and all users in parallel for better performance
        const [statsResponse, usersResponse] = await Promise.all([
          getSystemStats(),
          getAllUsers()
        ]);

        // Check if component is still mounted before updating state
        if (!isMounted) return;

        // Extract statistics from API response with fallback values
        const apiStats = statsResponse?.stats || {};
        setStats({
          totalPatients: apiStats.total_patients || 0,
          totalDoctors: apiStats.total_doctors || 0,
          todayAppointments: apiStats.today_appointments || 0,
          highRiskPatients: apiStats.high_risk_patients || 0
        });

        // Transform user data into recent activity format
        const users = Array.isArray(usersResponse?.users) ? usersResponse.users : [];
        const recent = users.slice(0, 6).map((u) => {
          // Combine first and last name, with fallback to empty string
          const fullName = `${u.first_name || ''} ${u.last_name || ''}`.trim();
          // Capitalize user role (e.g., 'admin' becomes 'Admin')
          const roleLabel = u.role ? u.role.charAt(0).toUpperCase() + u.role.slice(1) : 'User';
          return {
            id: u.id,
            action: `${roleLabel} account`,
            user: fullName || u.username,
            // Convert timestamp to readable format, or use 'Recently' if not available
            time: u.created_at ? new Date(u.created_at).toLocaleString() : 'Recently'
          };
        });
        setRecentActivity(recent);
        
        // Fetch security logs
        await loadSecurityLogs();
      } catch (err) {
        // Only update state if component is still mounted
        if (!isMounted) return;
        console.error('Admin dashboard load failed:', err);
        setError(err.message || 'Failed to load admin data');
      } finally {
        // Stop loading indicator if component is still mounted
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Execute the data loading function
    loadDashboardData();

    // Cleanup function to prevent memory leaks and state updates after unmount
    return () => {
      isMounted = false;
    };
  }, [user]);

  // Load security logs
  const loadSecurityLogs = async () => {
    try {
      const response = await getSecurityLogs({ limit: 50, hours: 168 }); // Last 7 days
      setSecurityLogs(response.logs || []);
    } catch (err) {
      console.error('Failed to load security logs:', err);
    }
  };

  // Load doctors when modal opens
  const loadDoctors = async () => {
    try {
      const response = await getAllUsers('doctor');
      setDoctors(response.users || []);
    } catch (err) {
      console.error('Failed to load doctors:', err);
    }
  };

  // Load patients when modal opens
  const loadPatients = async () => {
    try {
      const response = await getAllUsers('patient');
      setPatients(response.users || []);
    } catch (err) {
      console.error('Failed to load patients:', err);
    }
  };

  // Handle opening doctor management modal
  const handleManageDoctors = () => {
    navigate('/admin/doctors');
  };

  // Handle opening patient records modal
  const handleManagePatients = () => {
    setShowPatientsModal(true);
    loadPatients();
  };

  // Handle opening security logs modal
  const handleSecurityLogs = () => {
    setShowSecurityModal(true);
    loadSecurityLogs(); // Refresh logs when opening modal
  };

  // Handle adding new user (doctor)
  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      await createUser(userFormData);
      setShowAddUserModal(false);
      setUserFormData({
        username: '',
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        role: 'doctor',
        phone: '',
        specialization: ''
      });
      // Reload the appropriate list
      if (userFormData.role === 'doctor') {
        loadDoctors();
      } else if (userFormData.role === 'patient') {
        loadPatients();
      }
    } catch (err) {
      alert('Failed to add user: ' + (err.message || 'Unknown error'));
    }
  };

  // Handle user deactivation/activation
  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      await updateUser(userId, { is_active: !currentStatus });
      // Reload users
      loadDoctors();
      loadPatients();
    } catch (err) {
      alert('Failed to update user status: ' + (err.message || 'Unknown error'));
    }
  };

  // StatCard component - displays a single statistic with icon and value
  // Used to show key metrics like total patients, doctors, appointments, etc.
  const StatCard = ({ title, value, icon: Icon, color }) => (
    // Display a statistic card with icon, title, and numeric value
    // Card scales up slightly on hover for better user feedback
    <motion.div
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 flex items-center border border-gray-100 dark:border-gray-700 transition-colors duration-300"
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      {/* Colored icon container on the left side of the card */}
      <div className={`p-3 rounded-full ${color} text-white mr-4`}>
        <Icon size={24} />
      </div>
      
      {/* Title and numeric value displayed on the right side */}
      <div>
        <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{value}</h3>
        <p className="text-gray-600 dark:text-gray-300 text-sm">{title}</p>
      </div>
    </motion.div>
  );

  // Modal Component for displaying user lists
  const UserModal = ({ title, users, onClose, showAddButton = false }) => (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{title}</h2>
            <div className="flex items-center gap-2">
              {showAddButton && (
                <button
                  onClick={() => setShowAddUserModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <FaPlus /> Add New
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <FaTimes className="text-gray-600 dark:text-gray-300" size={20} />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {users.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">No users found</p>
            ) : (
              <div className="space-y-3">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 dark:text-white">
                        {user.first_name} {user.last_name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">@{user.username}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                      {user.specialization && (
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                          Specialization: {user.specialization}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          user.is_active
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}
                      >
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <button
                        onClick={() => handleToggleUserStatus(user.id, user.is_active)}
                        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                        title={user.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {user.is_active ? (
                          <FaEyeSlash className="text-red-600 dark:text-red-400" />
                        ) : (
                          <FaEye className="text-green-600 dark:text-green-400" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  // Modal for adding new users
  const AddUserModal = ({ onClose }) => {
    const [showPassword, setShowPassword] = useState(false);
    
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Add New User</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <FaTimes className="text-gray-600 dark:text-gray-300" size={20} />
              </button>
            </div>

            {/* Modal Body - Form */}
            <form onSubmit={handleAddUser} className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Username *
                  </label>
                  <input
                    type="text"
                    required
                    value={userFormData.username}
                    onChange={(e) => setUserFormData({ ...userFormData, username: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={userFormData.email}
                    onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={userFormData.first_name}
                    onChange={(e) => setUserFormData({ ...userFormData, first_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={userFormData.last_name}
                    onChange={(e) => setUserFormData({ ...userFormData, last_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={userFormData.password}
                      onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Role *
                  </label>
                  <select
                    value={userFormData.role}
                    onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="doctor">Doctor</option>
                    <option value="patient">Patient</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={userFormData.phone}
                    onChange={(e) => setUserFormData({ ...userFormData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                {userFormData.role === 'doctor' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Specialization
                    </label>
                    <input
                      type="text"
                      value={userFormData.specialization}
                      onChange={(e) => setUserFormData({ ...userFormData, specialization: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="e.g., Cardiology, Neurology"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Add User
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  };

  // Security Logs Modal
  const SecurityLogsModal = ({ onClose }) => {
    // Helper function to get color based on event type
    const getEventColor = (eventType) => {
      const colors = {
        'login': 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900',
        'logout': 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900',
        'failed_login': 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900',
        'user_created': 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900',
        'user_updated': 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900',
        'user_deleted': 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900',
        'patient_accessed': 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900',
        'patient_updated': 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900'
      };
      return colors[eventType] || 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900';
    };

    // Helper function to get severity indicator color
    const getSeverityColor = (severity) => {
      const colors = {
        'info': 'bg-blue-500',
        'warning': 'bg-yellow-500',
        'error': 'bg-red-500',
        'critical': 'bg-red-700'
      };
      return colors[severity] || 'bg-gray-500';
    };

    // Helper function to format event type for display
    const formatEventType = (eventType) => {
      return eventType
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    };

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-6xl w-full max-h-[85vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Security Logs</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Last 7 days • {securityLogs.length} events
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <FaTimes className="text-gray-600 dark:text-gray-300" size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(85vh-120px)]">
              {securityLogs.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">No security logs available</p>
              ) : (
                <div className="space-y-2">
                  {securityLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      {/* Severity indicator dot */}
                      <div className={`w-2 h-2 ${getSeverityColor(log.severity)} rounded-full mt-2 flex-shrink-0`}></div>
                      
                      {/* Log content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            {/* Event type badge */}
                            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getEventColor(log.event_type)} mb-2`}>
                              {formatEventType(log.event_type)}
                            </span>
                            
                            {/* Event description */}
                            <p className="text-sm font-medium text-gray-800 dark:text-white">
                              {log.event_description}
                            </p>
                            
                            {/* Event metadata */}
                            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                              {log.username && (
                                <span className="flex items-center gap-1">
                                  <span className="font-medium">User:</span> {log.username}
                                  {log.user_role && <span className="text-blue-600 dark:text-blue-400">({log.user_role})</span>}
                                </span>
                              )}
                              {log.ip_address && (
                                <span className="flex items-center gap-1">
                                  <span className="font-medium">IP:</span> {log.ip_address}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <span className="font-medium">Time:</span> {new Date(log.created_at).toLocaleString()}
                              </span>
                            </div>
                            
                            {/* Status indicator */}
                            <div className="mt-2">
                              <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                                log.status === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                log.status === 'failure' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                log.status === 'warning' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                              }`}>
                                {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                              </span>
                            </div>
                          </div>
                          
                          {/* Target info (if applicable) */}
                          {log.target_username && (
                            <div className="text-right">
                              <p className="text-xs text-gray-500 dark:text-gray-400">Target</p>
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{log.target_username}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  };

  // Display loading spinner while fetching data from API
  // Display loading spinner while fetching data from API
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <div className="card flex items-center gap-3 bg-white dark:bg-gray-800">
          {/* Animated loading spinner */}
          <div className="h-6 w-6 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <span className="text-gray-700 dark:text-gray-200 font-medium">Loading admin analytics...</span>
        </div>
      </div>
    );
  }

  // Display error message if API call fails
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <div className="card max-w-md text-center space-y-4 bg-white dark:bg-gray-800">
          <p className="text-red-600 dark:text-red-400 font-semibold">Failed to load admin data</p>
          <p className="text-gray-600 dark:text-gray-300 text-sm">{error}</p>
          {/* Retry button to reload the page and fetch data again */}
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Main dashboard render - displays statistics, management options, and recent activity
  // Main dashboard render - displays statistics, management options, and recent activity
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300"
    >
      {/* Main Content Container */}
      <div className="container mx-auto px-6 py-8">
        
        {/* Dashboard Header - Title and welcome message */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Admin Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-300">Welcome back, {user?.username || 'Admin'}. Manage your healthcare system efficiently.</p>
        </div>

        {/* Statistics Grid - Displays 4 key metrics in a responsive grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Patients statistic card */}
          <StatCard 
            title="Total Patients" 
            value={stats.totalPatients.toLocaleString()} 
            icon={FaUsers} 
            color="bg-blue-500" 
          />
          
          {/* Total Doctors statistic card */}
          <StatCard 
            title="Total Doctors" 
            value={stats.totalDoctors} 
            icon={FaUserMd} 
            color="bg-green-500" 
          />
          
          {/* Today's Appointments statistic card */}
          <StatCard 
            title="Today's Appointments" 
            value={stats.todayAppointments} 
            icon={FaChartBar} 
            color="bg-purple-500" 
          />
          
          {/* High Risk Patients statistic card - shows patients at higher stroke risk */}
          <StatCard 
            title="High Risk Patients" 
            value={stats.highRiskPatients} 
            icon={FaShieldAlt} 
            color="bg-red-500" 
          />
        </div>

        {/* Two-column section for management options and recent activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Management Section - Quick access to admin functions */}
          <motion.div 
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 transition-colors duration-300"
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">System Management</h2>
            <div className="space-y-3">
              
              {/* Manage Doctors button - Add, edit, or remove doctor accounts */}
              <button 
                onClick={handleManageDoctors}
                className="w-full text-left p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
              >
                <h3 className="font-medium text-gray-800 dark:text-white">Manage Doctors</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Add, edit, or remove doctor accounts</p>
              </button>
              
              {/* Patient Records button - View and manage all patient data and medical history */}
              <button 
                onClick={handleManagePatients}
                className="w-full text-left p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-green-50 dark:hover:bg-green-900 hover:border-green-300 dark:hover:border-green-600 transition-colors"
              >
                <h3 className="font-medium text-gray-800 dark:text-white">Patient Records</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">View and manage all patient data</p>
              </button>
              
              {/* System Settings - Configure application-wide settings and preferences */}
              <div className="w-full text-left p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900 hover:border-purple-300 dark:hover:border-purple-600 transition-colors">
                <div className="space-y-3">
                  <div>
                    <h3 className="font-medium text-gray-800 dark:text-white">System Settings</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Configure application settings</p>
                  </div>
                  
                  <div className="space-y-2">
                    {/* System Status */}
                    <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                      <span className="text-sm text-gray-700 dark:text-gray-300">System Status</span>
                      <span className="flex items-center gap-1.5 text-xs font-medium text-green-600 dark:text-green-400">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        Online
                      </span>
                    </div>

                    {/* Database Connection */}
                    <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                      <span className="text-sm text-gray-700 dark:text-gray-300">Database</span>
                      <span className="flex items-center gap-1.5 text-xs font-medium text-green-600 dark:text-green-400">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        Connected
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Security Logs button - Monitor system access, login attempts, and data changes */}
              <button 
                onClick={handleSecurityLogs}
                className="w-full text-left p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900 hover:border-red-300 dark:hover:border-red-600 transition-colors"
              >
                <h3 className="font-medium text-gray-800 dark:text-white">Security Logs</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Monitor system access and changes</p>
              </button>
            </div>
          </motion.div>

          {/* Recent Activity Section - Shows recent user registrations and account creations */}
          <motion.div 
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 transition-colors duration-300"
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Recent Activity</h2>
            
            {/* Show empty state message if no recent activity exists */}
            {recentActivity.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center">
                No user events recorded yet.
              </p>
            ) : (
              // Display list of recent user activities
              <div className="space-y-4">
                {recentActivity.map(activity => (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 border border-gray-100 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700">
                    {/* Blue dot indicator for each activity */}
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    
                    {/* Activity details - role type and user info */}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800 dark:text-white">{activity.action}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">By {activity.user} &middot; {activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Security Notice - Important reminder about handling sensitive healthcare data */}
        <motion.div 
          className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg transition-colors duration-300"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center">
            {/* Warning icon */}
            <FaExclamationTriangle className="text-yellow-600 dark:text-yellow-400 mr-3 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-yellow-800 dark:text-yellow-200">Security Notice</h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                You are accessing sensitive healthcare data. Ensure proper access controls and data protection measures are in place.
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Modals */}
      {showDoctorsModal && (
        <UserModal
          title="Manage Doctors"
          users={doctors}
          onClose={() => setShowDoctorsModal(false)}
          showAddButton={true}
        />
      )}

      {showPatientsModal && (
        <UserModal
          title="Patient Records"
          users={patients}
          onClose={() => setShowPatientsModal(false)}
          showAddButton={false}
        />
      )}

      {showSecurityModal && (
        <SecurityLogsModal onClose={() => setShowSecurityModal(false)} />
      )}

      {showAddUserModal && (
        <AddUserModal onClose={() => setShowAddUserModal(false)} />
      )}
    </motion.div>
  );
}
