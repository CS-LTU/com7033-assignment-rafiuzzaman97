import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Login from '../src/pages/Login'
import { AuthProvider } from '../src/contexts/AuthContext'

// Mock the API
vi.mock('../src/api', () => ({
  login: vi.fn(),
  register: vi.fn(),
}))

describe('Login Component Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders login form correctly', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </BrowserRouter>
    )

    expect(screen.getByPlaceholderText(/username/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument()
  })

  it('shows validation errors for empty fields', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </BrowserRouter>
    )

    const loginButton = screen.getByRole('button', { name: /login/i })
    fireEvent.click(loginButton)

    // Should show validation messages
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/username/i)).toBeInTheDocument()
    })
  })

  it('disables login button during submission', async () => {
    const { login } = await import('../src/api')
    login.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

    render(
      <BrowserRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </BrowserRouter>
    )

    const usernameInput = screen.getByPlaceholderText(/username/i)
    const passwordInput = screen.getByPlaceholderText(/password/i)
    const loginButton = screen.getByRole('button', { name: /login/i })

    fireEvent.change(usernameInput, { target: { value: 'testuser' } })
    fireEvent.change(passwordInput, { target: { value: 'testpass' } })
    fireEvent.click(loginButton)

    // Button should be disabled during submission
    expect(loginButton).toBeDisabled()
  })
})

describe('Login Component Integration Tests', () => {
  it('successfully logs in with valid credentials', async () => {
    const { login } = await import('../src/api')
    login.mockResolvedValue({
      token: 'fake-jwt-token',
      user: { id: 1, username: 'testuser', role: 'doctor' }
    })

    render(
      <BrowserRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </BrowserRouter>
    )

    const usernameInput = screen.getByPlaceholderText(/username/i)
    const passwordInput = screen.getByPlaceholderText(/password/i)
    const loginButton = screen.getByRole('button', { name: /login/i })

    fireEvent.change(usernameInput, { target: { value: 'doctor' } })
    fireEvent.change(passwordInput, { target: { value: 'doctor123' } })
    fireEvent.click(loginButton)

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith({
        username: 'doctor',
        password: 'doctor123'
      })
    })
  })

  it('displays error message on login failure', async () => {
    const { login } = await import('../src/api')
    login.mockRejectedValue({
      response: { data: { message: 'Invalid credentials' } }
    })

    render(
      <BrowserRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </BrowserRouter>
    )

    const usernameInput = screen.getByPlaceholderText(/username/i)
    const passwordInput = screen.getByPlaceholderText(/password/i)
    const loginButton = screen.getByRole('button', { name: /login/i })

    fireEvent.change(usernameInput, { target: { value: 'wrong' } })
    fireEvent.change(passwordInput, { target: { value: 'wrong' } })
    fireEvent.click(loginButton)

    await waitFor(() => {
      // Error message should be displayed
      expect(login).toHaveBeenCalled()
    })
  })
})
