import { describe, it, expect, beforeEach, vi } from 'vitest'
import { validatePatient, validateAppointment, validateUsername } from '../src/utils/validation'

describe('Validation Utils Unit Tests', () => {
  describe('validatePatient', () => {
    it('accepts valid patient data', () => {
      const validPatient = {
        name: 'John Doe',
        age: 45,
        gender: 'Male',
        hypertension: 0,
        heart_disease: 0,
        smoking_status: 'Never smoked',
        avg_glucose_level: 100,
        bmi: 25
      }

      const result = validatePatient(validPatient)
      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual({})
    })

    it('rejects negative age', () => {
      const invalidPatient = {
        name: 'John Doe',
        age: -5,
        gender: 'Male',
        hypertension: 0,
        heart_disease: 0
      }

      const result = validatePatient(invalidPatient)
      expect(result.isValid).toBe(false)
      expect(result.errors.age).toBeDefined()
    })

    it('rejects unrealistic age', () => {
      const invalidPatient = {
        name: 'John Doe',
        age: 200,
        gender: 'Male'
      }

      const result = validatePatient(invalidPatient)
      expect(result.isValid).toBe(false)
      expect(result.errors.age).toBeDefined()
    })

    it('requires name field', () => {
      const invalidPatient = {
        age: 45,
        gender: 'Male'
      }

      const result = validatePatient(invalidPatient)
      expect(result.isValid).toBe(false)
      expect(result.errors.name).toBeDefined()
    })

    it('validates BMI range', () => {
      const invalidPatient = {
        name: 'John Doe',
        age: 45,
        gender: 'Male',
        bmi: -5
      }

      const result = validatePatient(invalidPatient)
      expect(result.isValid).toBe(false)
      expect(result.errors.bmi).toBeDefined()
    })

    it('validates glucose level range', () => {
      const invalidPatient = {
        name: 'John Doe',
        age: 45,
        gender: 'Male',
        avg_glucose_level: -10
      }

      const result = validatePatient(invalidPatient)
      expect(result.isValid).toBe(false)
      expect(result.errors.avg_glucose_level).toBeDefined()
    })
  })

  describe('validateAppointment', () => {
    it('accepts valid appointment data', () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 7)

      const validAppointment = {
        doctor_id: 1,
        appointment_date: futureDate.toISOString(),
        reason: 'Regular checkup'
      }

      const result = validateAppointment(validAppointment)
      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual({})
    })

    it('rejects past appointment dates', () => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 1)

      const invalidAppointment = {
        doctor_id: 1,
        appointment_date: pastDate.toISOString(),
        reason: 'Test'
      }

      const result = validateAppointment(invalidAppointment)
      expect(result.isValid).toBe(false)
      expect(result.errors.appointment_date).toBeDefined()
    })

    it('requires doctor_id', () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 7)

      const invalidAppointment = {
        appointment_date: futureDate.toISOString(),
        reason: 'Test'
      }

      const result = validateAppointment(invalidAppointment)
      expect(result.isValid).toBe(false)
      expect(result.errors.doctor_id).toBeDefined()
    })

    it('requires reason field', () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 7)

      const invalidAppointment = {
        doctor_id: 1,
        appointment_date: futureDate.toISOString()
      }

      const result = validateAppointment(invalidAppointment)
      expect(result.isValid).toBe(false)
      expect(result.errors.reason).toBeDefined()
    })
  })

  describe('validateUsername', () => {
    it('accepts valid username', () => {
      const result = validateUsername('johndoe123')
      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('rejects username shorter than 3 characters', () => {
      const result = validateUsername('ab')
      expect(result.isValid).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('rejects username with special characters', () => {
      const result = validateUsername('john@doe')
      expect(result.isValid).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('rejects username with spaces', () => {
      const result = validateUsername('john doe')
      expect(result.isValid).toBe(false)
      expect(result.error).toBeDefined()
    })
  })
})

describe('Validation Integration Tests', () => {
  it('validates complete patient registration flow', () => {
    const patientData = {
      name: 'Jane Smith',
      age: 52,
      gender: 'Female',
      hypertension: 1,
      heart_disease: 0,
      smoking_status: 'Formerly smoked',
      avg_glucose_level: 120,
      bmi: 28
    }

    const result = validatePatient(patientData)
    expect(result.isValid).toBe(true)

    // All fields should be present
    Object.keys(patientData).forEach(key => {
      expect(result.errors[key]).toBeUndefined()
    })
  })

  it('validates complete appointment booking flow', () => {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 14)

    const appointmentData = {
      doctor_id: 1,
      appointment_date: futureDate.toISOString(),
      reason: 'Follow-up consultation',
      notes: 'Patient has been experiencing headaches'
    }

    const result = validateAppointment(appointmentData)
    expect(result.isValid).toBe(true)
  })

  it('handles multiple validation errors', () => {
    const invalidPatient = {
      name: '',
      age: -10,
      gender: 'Invalid',
      bmi: 100,
      avg_glucose_level: -50
    }

    const result = validatePatient(invalidPatient)
    expect(result.isValid).toBe(false)

    // Should have multiple errors
    const errorCount = Object.keys(result.errors).length
    expect(errorCount).toBeGreaterThan(1)
  })
})
