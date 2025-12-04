// src/pages/RegisterPatient.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaUserPlus, FaSpinner } from 'react-icons/fa';
import { sanitizeInput, validateMedicalData } from '../utils/validation';
import { selfRegisterPatient } from '../api';

export default function RegisterPatient() {
  const sensitiveFields = new Set(['password', 'confirmPassword']);
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    gender: 'Male', 
    age: '', 
    hypertension: 0, 
    heart_disease: 0, 
    ever_married: 'No',
    work_type: 'Private', 
    Residence_type: 'Urban', 
    avg_glucose_level: '',
    bmi: '', 
    smoking_status: 'Unknown', 
    stroke: 0
  });
  const [msg, setMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const nav = useNavigate();

  function updateField(key, value) {
    // Sanitize input based on field type
    let sanitizedValue = value;
    if (typeof value === 'string' && !sensitiveFields.has(key)) {
      sanitizedValue = sanitizeInput(value);
    }
    
    setForm(prev => ({ ...prev, [key]: sanitizedValue }));
    
    // Clear field-specific error
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: '' }));
    }
  }

  function validateForm() {
    const newErrors = {};
    
    // Required fields validation
    if (!form.age) newErrors.age = 'Age is required';
    if (!form.avg_glucose_level) newErrors.avg_glucose_level = 'Glucose level is required';
    if (!form.bmi) newErrors.bmi = 'BMI is required';
    
    // Medical data validation
    const medicalErrors = validateMedicalData(form);
    if (medicalErrors.length > 0) {
      medicalErrors.forEach(error => {
        if (error.includes('Age')) newErrors.age = error;
        if (error.includes('BMI')) newErrors.bmi = error;
        if (error.includes('Glucose')) newErrors.avg_glucose_level = error;
      });
    }

    if (!form.first_name) newErrors.first_name = 'First name is required';
    if (!form.last_name) newErrors.last_name = 'Last name is required';

    if (!form.username) {
      newErrors.username = 'Username is required';
    } else if (form.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (/\s/.test(form.username)) {
      newErrors.username = 'Username cannot contain spaces';
    }

    if (!form.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Enter a valid email address';
    }

    if (!form.password) {
      newErrors.password = 'Password is required';
    } else if (form.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!form.confirmPassword) {
      newErrors.confirmPassword = 'Confirm your password';
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function submit(e) {
    e.preventDefault();
    setMsg('');
    
    if (!validateForm()) {
      setMsg('Please fix the errors below');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { confirmPassword, ...submissionData } = form;
      const response = await selfRegisterPatient(submissionData);
      if (response?.patient_id || response?.message === 'Patient registered successfully') {
        setMsg('Registration successful! Redirecting...');
        setTimeout(() => nav('/'), 2000);
      } else {
        setMsg(response?.message || 'Registration failed. Please try again.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setMsg(error.message || 'Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <motion.div
      className="max-w-2xl mx-auto mt-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="card">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 text-primary text-2xl font-bold mb-2">
            <FaUserPlus className="text-3xl" />
            <h1>Patient Registration</h1>
          </div>
          <p className="text-gray-600">Register as a new patient for stroke prediction analysis</p>
        </div>

        {msg && (
          <div className={`p-4 rounded-lg mb-6 ${
            msg.includes('successful') 
              ? 'bg-green-50 border border-green-200 text-green-700' 
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {msg}
          </div>
        )}

        <form onSubmit={submit} className="space-y-6">
          {/* Account Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name *
              </label>
              <input
                type="text"
                value={form.first_name}
                onChange={e => updateField('first_name', e.target.value)}
                className={`w-full border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.first_name ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
              {errors.first_name && <p className="text-red-500 text-xs mt-1">{errors.first_name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name *
              </label>
              <input
                type="text"
                value={form.last_name}
                onChange={e => updateField('last_name', e.target.value)}
                className={`w-full border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.last_name ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
              {errors.last_name && <p className="text-red-500 text-xs mt-1">{errors.last_name}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username *
              </label>
              <input
                type="text"
                value={form.username}
                onChange={e => updateField('username', e.target.value)}
                className={`w-full border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.username ? 'border-red-500' : 'border-gray-300'
                }`}
                required
                minLength={3}
              />
              {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                value={form.email}
                onChange={e => updateField('email', e.target.value)}
                className={`w-full border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password *
              </label>
              <input
                type="password"
                value={form.password}
                onChange={e => updateField('password', e.target.value)}
                className={`w-full border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.password ? 'border-red-500' : 'border-gray-300'
                }`}
                required
                minLength={8}
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password *
              </label>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={e => updateField('confirmPassword', e.target.value)}
                className={`w-full border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
              {errors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone (optional)
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={e => updateField('phone', e.target.value)}
              className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., +1 555 123 4567"
            />
          </div>
          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gender *
              </label>
              <select 
                value={form.gender} 
                onChange={e => updateField('gender', e.target.value)}
                className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Age *
              </label>
              <input 
                type="number" 
                value={form.age} 
                onChange={e => updateField('age', e.target.value)}
                className={`w-full border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.age ? 'border-red-500' : 'border-gray-300'
                }`}
                min="0"
                max="120"
                required
              />
              {errors.age && <p className="text-red-500 text-xs mt-1">{errors.age}</p>}
            </div>
          </div>

          {/* Health Conditions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hypertension
              </label>
              <select 
                value={form.hypertension} 
                onChange={e => updateField('hypertension', Number(e.target.value))}
                className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={0}>No</option>
                <option value={1}>Yes</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Heart Disease
              </label>
              <select 
                value={form.heart_disease} 
                onChange={e => updateField('heart_disease', Number(e.target.value))}
                className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={0}>No</option>
                <option value={1}>Yes</option>
              </select>
            </div>
          </div>

          {/* Lifestyle Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ever Married
              </label>
              <select 
                value={form.ever_married} 
                onChange={e => updateField('ever_married', e.target.value)}
                className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Work Type
              </label>
              <select 
                value={form.work_type} 
                onChange={e => updateField('work_type', e.target.value)}
                className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Private">Private</option>
                <option value="Self-employed">Self-employed</option>
                <option value="Govt_job">Government Job</option>
                <option value="Children">Children</option>
                <option value="Never_worked">Never Worked</option>
              </select>
            </div>
          </div>

          {/* Medical Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Average Glucose Level *
              </label>
              <input 
                type="number" 
                step="0.1"
                value={form.avg_glucose_level} 
                onChange={e => updateField('avg_glucose_level', e.target.value)}
                className={`w-full border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.avg_glucose_level ? 'border-red-500' : 'border-gray-300'
                }`}
                min="50"
                max="300"
                required
              />
              {errors.avg_glucose_level && (
                <p className="text-red-500 text-xs mt-1">{errors.avg_glucose_level}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                BMI *
              </label>
              <input 
                type="number" 
                step="0.1"
                value={form.bmi} 
                onChange={e => updateField('bmi', e.target.value)}
                className={`w-full border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.bmi ? 'border-red-500' : 'border-gray-300'
                }`}
                min="10"
                max="60"
                required
              />
              {errors.bmi && <p className="text-red-500 text-xs mt-1">{errors.bmi}</p>}
            </div>
          </div>

          {/* Additional Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Residence Type
              </label>
              <select 
                value={form.Residence_type} 
                onChange={e => updateField('Residence_type', e.target.value)}
                className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Urban">Urban</option>
                <option value="Rural">Rural</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Smoking Status
              </label>
              <select 
                value={form.smoking_status} 
                onChange={e => updateField('smoking_status', e.target.value)}
                className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Never smoked">Never Smoked</option>
                <option value="Smokes">Currently Smokes</option>
                <option value="Formerly smoked">Formerly Smoked</option>
                <option value="Unknown">Unknown</option>
              </select>
            </div>
          </div>

          {/* Stroke History */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stroke
            </label>
            <select 
              value={form.stroke} 
              onChange={e => updateField('stroke', Number(e.target.value))}
              className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={0}>No</option>
              <option value={1}>Yes</option>
            </select>
          </div>

          <button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <FaSpinner className="animate-spin" />
                Registering...
              </>
            ) : (
              'Register Patient'
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <a href="/" className="text-blue-600 hover:underline font-medium">
            Login here
          </a>
        </p>
      </div>
    </motion.div>
  );
}
