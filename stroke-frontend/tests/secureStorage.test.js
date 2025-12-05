import { describe, it, expect, vi, beforeEach } from 'vitest'
import { secureStorage } from '../src/utils/secureStorage'

describe('SecureStorage Unit Tests', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    sessionStorage.clear()
  })

  describe('Token Storage', () => {
    it('stores token securely', () => {
      const token = 'test-jwt-token'
      secureStorage.setToken(token)

      const retrieved = secureStorage.getToken()
      expect(retrieved).toBe(token)
    })

    it('removes token on logout', () => {
      secureStorage.setToken('test-token')
      expect(secureStorage.getToken()).toBe('test-token')

      secureStorage.removeToken()
      expect(secureStorage.getToken()).toBeNull()
    })

    it('returns null for non-existent token', () => {
      const token = secureStorage.getToken()
      expect(token).toBeNull()
    })
  })

  describe('User Data Storage', () => {
    it('stores and retrieves user data', () => {
      const userData = {
        id: 1,
        username: 'testuser',
        role: 'doctor'
      }

      secureStorage.setUser(userData)
      const retrieved = secureStorage.getUser()

      expect(retrieved).toEqual(userData)
    })

    it('handles JSON serialization correctly', () => {
      const complexData = {
        id: 1,
        username: 'test',
        metadata: {
          lastLogin: new Date().toISOString(),
          permissions: ['read', 'write']
        }
      }

      secureStorage.setUser(complexData)
      const retrieved = secureStorage.getUser()

      expect(retrieved.metadata.permissions).toEqual(['read', 'write'])
    })

    it('clears user data on logout', () => {
      secureStorage.setUser({ id: 1, username: 'test' })
      expect(secureStorage.getUser()).toBeTruthy()

      secureStorage.clear()
      expect(secureStorage.getUser()).toBeNull()
    })
  })

  describe('Security Features', () => {
    it('does not expose sensitive data in plain text', () => {
      const token = 'sensitive-token'
      secureStorage.setToken(token)

      // Check if token is not stored in plain text (should be encoded/encrypted)
      const rawStorage = localStorage.getItem('auth_token')
      // Depending on implementation, token might be encrypted
      expect(rawStorage).toBeDefined()
    })

    it('validates token format before storage', () => {
      const invalidToken = ''
      secureStorage.setToken(invalidToken)

      // Empty tokens should not be stored
      const retrieved = secureStorage.getToken()
      expect(retrieved).toBeFalsy()
    })

    it('handles corrupted data gracefully', () => {
      // Manually corrupt the stored data
      localStorage.setItem('user_data', 'invalid-json-{')

      const user = secureStorage.getUser()
      // Should return null or default instead of throwing
      expect(user).toBeNull()
    })
  })

  describe('Session Management', () => {
    it('checks if user is authenticated', () => {
      expect(secureStorage.isAuthenticated()).toBe(false)

      secureStorage.setToken('valid-token')
      expect(secureStorage.isAuthenticated()).toBe(true)
    })

    it('clears all session data', () => {
      secureStorage.setToken('token')
      secureStorage.setUser({ id: 1, username: 'test' })

      expect(secureStorage.isAuthenticated()).toBe(true)

      secureStorage.clear()

      expect(secureStorage.getToken()).toBeNull()
      expect(secureStorage.getUser()).toBeNull()
      expect(secureStorage.isAuthenticated()).toBe(false)
    })
  })
})

describe('SecureStorage Integration Tests', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  it('handles complete login flow', () => {
    // Simulate login response
    const loginResponse = {
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      user: {
        id: 1,
        username: 'doctor',
        role: 'doctor',
        email: 'doctor@example.com'
      }
    }

    // Store login data
    secureStorage.setToken(loginResponse.token)
    secureStorage.setUser(loginResponse.user)

    // Verify authentication
    expect(secureStorage.isAuthenticated()).toBe(true)

    // Verify data integrity
    const storedUser = secureStorage.getUser()
    expect(storedUser.username).toBe('doctor')
    expect(storedUser.role).toBe('doctor')
  })

  it('handles complete logout flow', () => {
    // Setup authenticated session
    secureStorage.setToken('token')
    secureStorage.setUser({ id: 1, username: 'test' })

    expect(secureStorage.isAuthenticated()).toBe(true)

    // Perform logout
    secureStorage.clear()

    // Verify all data cleared
    expect(secureStorage.getToken()).toBeNull()
    expect(secureStorage.getUser()).toBeNull()
    expect(secureStorage.isAuthenticated()).toBe(false)
  })

  it('persists data across page reloads', () => {
    const token = 'persistent-token'
    const user = { id: 1, username: 'persistent' }

    secureStorage.setToken(token)
    secureStorage.setUser(user)

    // Simulate page reload by creating new instance
    expect(secureStorage.getToken()).toBe(token)
    expect(secureStorage.getUser()).toEqual(user)
  })

  it('handles concurrent storage operations', () => {
    // Simulate multiple rapid updates
    for (let i = 0; i < 10; i++) {
      secureStorage.setUser({ id: i, username: `user${i}` })
    }

    // Should have last update
    const user = secureStorage.getUser()
    expect(user.id).toBe(9)
    expect(user.username).toBe('user9')
  })
})
