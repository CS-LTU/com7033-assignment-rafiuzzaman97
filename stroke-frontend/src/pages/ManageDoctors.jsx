// src/pages/ManageDoctors.jsx
// Doctor Management Page - Complete CRUD operations for doctors
// Allows viewing, adding, editing, activating/deactivating, and deleting doctors
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { getAllUsers, createUser, updateUser } from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaUserMd, 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaEye, 
  FaEyeSlash, 
  FaTimes, 
  FaSearch,
  FaArrowLeft,
  FaSave,
  FaPhone,
  FaEnvelope,
  FaIdCard,
  FaStethoscope
} from 'react-icons/fa';
import { Link } from 'react-router-dom';

export default function ManageDoctors() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  
  // State management
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  
  // Form data for add/edit
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: '',
    specialization: '',
    license_number: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Load doctors on component mount
  useEffect(() => {
    loadDoctors();
  }, []);

  // Filter doctors when search query changes
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredDoctors(doctors);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = doctors.filter(doctor => 
        doctor.username?.toLowerCase().includes(query) ||
        doctor.first_name?.toLowerCase().includes(query) ||
        doctor.last_name?.toLowerCase().includes(query) ||
        doctor.email?.toLowerCase().includes(query) ||
        doctor.specialization?.toLowerCase().includes(query)
      );
      setFilteredDoctors(filtered);
    }
  }, [searchQuery, doctors]);

  // Load all doctors from API
  const loadDoctors = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAllUsers('doctor');
      setDoctors(response.users || []);
      setFilteredDoctors(response.users || []);
    } catch (err) {
      console.error('Failed to load doctors:', err);
      setError('Failed to load doctors. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle add doctor
  const handleAddDoctor = async (e) => {
    e.preventDefault();
    setFormErrors({});
    
    try {
      const doctorData = {
        ...formData,
        role: 'doctor'
      };
      
      await createUser(doctorData);
      setShowAddModal(false);
      resetForm();
      loadDoctors();
      alert('Doctor added successfully!');
    } catch (err) {
      if (err.message.includes('Username')) {
        setFormErrors({ username: err.message });
      } else if (err.message.includes('Email')) {
        setFormErrors({ email: err.message });
      } else {
        alert('Failed to add doctor: ' + err.message);
      }
    }
  };

  // Handle edit doctor
  const handleEditDoctor = async (e) => {
    e.preventDefault();
    setFormErrors({});
    
    try {
      const updates = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        specialization: formData.specialization,
        license_number: formData.license_number
      };
      
      // Only include password if it's been changed
      if (formData.password) {
        updates.password = formData.password;
      }
      
      await updateUser(selectedDoctor.id, updates);
      setShowEditModal(false);
      resetForm();
      loadDoctors();
      alert('Doctor updated successfully!');
    } catch (err) {
      alert('Failed to update doctor: ' + err.message);
    }
  };

  // Handle toggle doctor status (activate/deactivate)
  const handleToggleStatus = async (doctor) => {
    try {
      await updateUser(doctor.id, { is_active: !doctor.is_active });
      loadDoctors();
      alert(`Doctor ${doctor.is_active ? 'deactivated' : 'activated'} successfully!`);
    } catch (err) {
      alert('Failed to update doctor status: ' + err.message);
    }
  };

  // Handle delete doctor
  const handleDeleteDoctor = async () => {
    try {
      // For now, we'll deactivate instead of deleting
      await updateUser(selectedDoctor.id, { is_active: false });
      setShowDeleteModal(false);
      setSelectedDoctor(null);
      loadDoctors();
      alert('Doctor deactivated successfully!');
    } catch (err) {
      alert('Failed to delete doctor: ' + err.message);
    }
  };

  // Open edit modal with doctor data
  const openEditModal = (doctor) => {
    setSelectedDoctor(doctor);
    setFormData({
      username: doctor.username,
      email: doctor.email,
      password: '',
      first_name: doctor.first_name,
      last_name: doctor.last_name,
      phone: doctor.phone || '',
      specialization: doctor.specialization || '',
      license_number: doctor.license_number || ''
    });
    setShowEditModal(true);
  };

  // Open view modal
  const openViewModal = (doctor) => {
    setSelectedDoctor(doctor);
    setShowViewModal(true);
  };

  // Open delete confirmation
  const openDeleteModal = (doctor) => {
    setSelectedDoctor(doctor);
    setShowDeleteModal(true);
  };

  // Reset form data
  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      first_name: '',
      last_name: '',
      phone: '',
      specialization: '',
      license_number: ''
    });
    setFormErrors({});
    setShowPassword(false);
    setSelectedDoctor(null);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <span className="text-gray-700 dark:text-gray-200 font-medium">Loading doctors...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="max-w-md text-center space-y-4">
          <p className="text-red-600 dark:text-red-400 font-semibold">{error}</p>
          <button
            onClick={loadDoctors}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300"
    >
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link
              to="/admin"
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <FaArrowLeft className="text-gray-600 dark:text-gray-300" size={20} />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Manage Doctors</h1>
              <p className="text-gray-600 dark:text-gray-300">View, add, edit, and manage all doctors in the system</p>
            </div>
          </div>

          {/* Search and Add Section */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search doctors by name, email, or specialization..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-lg"
            >
              <FaPlus /> Add Doctor
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                <FaUserMd className="text-blue-600 dark:text-blue-400" size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{doctors.length}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">Total Doctors</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                <FaEye className="text-green-600 dark:text-green-400" size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">
                  {doctors.filter(d => d.is_active).length}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">Active Doctors</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 dark:bg-red-900 rounded-full">
                <FaEyeSlash className="text-red-600 dark:text-red-400" size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">
                  {doctors.filter(d => !d.is_active).length}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">Inactive Doctors</p>
              </div>
            </div>
          </div>
        </div>

        {/* Doctors Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Doctor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Specialization
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredDoctors.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                      {searchQuery ? 'No doctors found matching your search.' : 'No doctors available.'}
                    </td>
                  </tr>
                ) : (
                  filteredDoctors.map((doctor) => (
                    <tr key={doctor.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                            <FaUserMd className="text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              Dr. {doctor.first_name} {doctor.last_name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              @{doctor.username}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">{doctor.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {doctor.specialization || 'Not specified'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            doctor.is_active
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}
                        >
                          {doctor.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openViewModal(doctor)}
                            className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900 dark:hover:bg-blue-800 rounded-lg border border-blue-200 dark:border-blue-700 transition-all"
                            title="View Details"
                          >
                            <FaEye size={18} />
                          </button>
                          <button
                            onClick={() => openEditModal(doctor)}
                            className="p-2 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 bg-green-50 hover:bg-green-100 dark:bg-green-900 dark:hover:bg-green-800 rounded-lg border border-green-200 dark:border-green-700 transition-all"
                            title="Edit"
                          >
                            <FaEdit size={18} />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(doctor)}
                            className={`p-2 rounded-lg border transition-all ${
                              doctor.is_active
                                ? 'text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-300 bg-yellow-50 hover:bg-yellow-100 dark:bg-yellow-900 dark:hover:bg-yellow-800 border-yellow-200 dark:border-yellow-700'
                                : 'text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 bg-green-50 hover:bg-green-100 dark:bg-green-900 dark:hover:bg-green-800 border-green-200 dark:border-green-700'
                            }`}
                            title={doctor.is_active ? 'Deactivate' : 'Activate'}
                          >
                            {doctor.is_active ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                          </button>
                          <button
                            onClick={() => openDeleteModal(doctor)}
                            className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 bg-red-50 hover:bg-red-100 dark:bg-red-900 dark:hover:bg-red-800 rounded-lg border border-red-200 dark:border-red-700 transition-all"
                            title="Delete"
                          >
                            <FaTrash size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Doctor Modal */}
      {showAddModal && (
        <DoctorFormModal
          title="Add New Doctor"
          formData={formData}
          setFormData={setFormData}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          formErrors={formErrors}
          onSubmit={handleAddDoctor}
          onClose={() => {
            setShowAddModal(false);
            resetForm();
          }}
          isEdit={false}
        />
      )}

      {/* Edit Doctor Modal */}
      {showEditModal && (
        <DoctorFormModal
          title="Edit Doctor"
          formData={formData}
          setFormData={setFormData}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          formErrors={formErrors}
          onSubmit={handleEditDoctor}
          onClose={() => {
            setShowEditModal(false);
            resetForm();
          }}
          isEdit={true}
        />
      )}

      {/* View Doctor Modal */}
      {showViewModal && selectedDoctor && (
        <ViewDoctorModal
          doctor={selectedDoctor}
          onClose={() => {
            setShowViewModal(false);
            setSelectedDoctor(null);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedDoctor && (
        <DeleteConfirmModal
          doctor={selectedDoctor}
          onConfirm={handleDeleteDoctor}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedDoctor(null);
          }}
        />
      )}
    </motion.div>
  );
}

// Doctor Form Modal Component (Add/Edit)
function DoctorFormModal({ title, formData, setFormData, showPassword, setShowPassword, formErrors, onSubmit, onClose, isEdit }) {
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
          className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <FaUserMd className="text-blue-600 dark:text-blue-400" size={24} />
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{title}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <FaTimes className="text-gray-600 dark:text-gray-300" size={20} />
            </button>
          </div>

          {/* Modal Body */}
          <form onSubmit={onSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Username *
                </label>
                <input
                  type="text"
                  required
                  disabled={isEdit}
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                    formErrors.username ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  } ${isEdit ? 'bg-gray-100 dark:bg-gray-600 cursor-not-allowed' : ''}`}
                />
                {formErrors.username && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.username}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <FaEnvelope className="inline mr-2" />
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                    formErrors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {formErrors.email && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.email}</p>
                )}
              </div>

              {/* First Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password {!isEdit && '*'}
                  {isEdit && <span className="text-xs text-gray-500"> (leave blank to keep current)</span>}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required={!isEdit}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder={isEdit ? 'Leave blank to keep current' : ''}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <FaPhone className="inline mr-2" />
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="+1234567890"
                />
              </div>

              {/* Specialization */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <FaStethoscope className="inline mr-2" />
                  Specialization
                </label>
                <input
                  type="text"
                  value={formData.specialization}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., Cardiology, Neurology"
                />
              </div>

              {/* License Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <FaIdCard className="inline mr-2" />
                  License Number
                </label>
                <input
                  type="text"
                  value={formData.license_number}
                  onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Medical license number"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
              >
                <FaSave /> {isEdit ? 'Update' : 'Add'} Doctor
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// View Doctor Modal Component
function ViewDoctorModal({ doctor, onClose }) {
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
          className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <FaUserMd className="text-blue-600 dark:text-blue-400" size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                  Dr. {doctor.first_name} {doctor.last_name}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">@{doctor.username}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <FaTimes className="text-gray-600 dark:text-gray-300" size={20} />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InfoField icon={<FaEnvelope />} label="Email" value={doctor.email} />
              <InfoField icon={<FaPhone />} label="Phone" value={doctor.phone || 'Not provided'} />
              <InfoField icon={<FaStethoscope />} label="Specialization" value={doctor.specialization || 'Not specified'} />
              <InfoField icon={<FaIdCard />} label="License Number" value={doctor.license_number || 'Not provided'} />
              <InfoField 
                label="Status" 
                value={
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    doctor.is_active
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {doctor.is_active ? 'Active' : 'Inactive'}
                  </span>
                }
              />
              <InfoField 
                label="Member Since" 
                value={doctor.created_at ? new Date(doctor.created_at).toLocaleDateString() : 'Unknown'}
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Info Field Component
function InfoField({ icon, label, value }) {
  return (
    <div>
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
        {icon && <span className="mr-2">{icon}</span>}
        {label}
      </p>
      <p className="text-base text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}

// Delete Confirmation Modal
function DeleteConfirmModal({ doctor, onConfirm, onClose }) {
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
          className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                <FaTrash className="text-red-600 dark:text-red-400" size={20} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">Deactivate Doctor</h3>
              </div>
            </div>
            
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to deactivate <span className="font-semibold">Dr. {doctor.first_name} {doctor.last_name}</span>? 
              This will prevent them from accessing the system.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Deactivate
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
