/**
 * Application Entry Point - main.jsx
 * 
 * This file is the root entry point for the React application.
 * It sets up the React DOM root, wraps the application with necessary providers,
 * and renders the main App component.
 * 
 * Provider Stack (from inside-out):
 * 1. AuthProvider - Manages authentication state for entire app
 * 2. BrowserRouter - Enables client-side routing with React Router
 * 3. React.StrictMode - Highlights potential issues in development
 */

import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import './index.css'

/**
 * Render Application with Provider Hierarchy
 * 
 * This renders the application into the DOM element with id="root".
 * 
 * Provider Breakdown:
 * - React.StrictMode: Development-only wrapper that highlights potential problems
 * - BrowserRouter: Enables React Router navigation throughout the app
 * - AuthProvider: Wraps entire app to provide authentication context
 * - App: Main application component containing page routes and UI
 * 
 * Flow:
 * 1. createRoot() creates a React root for the #root DOM element
 * 2. render() mounts the component tree into that root
 * 3. Providers are set up in order so inner components can use context/routing
 */
createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* BrowserRouter enables client-side routing with React Router */}
    <BrowserRouter>
      {/* ThemeProvider manages dark/light mode across the entire app */}
      <ThemeProvider>
        {/* AuthProvider makes authentication state available to all child components */}
        <AuthProvider>
          {/* App is the main component containing all routes and pages */}
          <App />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
)
