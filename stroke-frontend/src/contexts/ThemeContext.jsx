// src/contexts/ThemeContext.jsx
// Theme Context - Manages dark/light mode state across the application
// Provides theme toggle functionality and persists preference to localStorage
import React, { createContext, useContext, useState, useEffect } from 'react';

// Create context for theme management
const ThemeContext = createContext();

// Custom hook to access theme context
// Throws error if used outside ThemeProvider
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// ThemeProvider component - wraps app to provide theme state
export const ThemeProvider = ({ children }) => {
  // Initialize theme from localStorage or default to 'light'
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('st_theme');
    return savedTheme || 'light';
  });

  // Effect to apply theme class to document root and save to localStorage
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    // Remove any existing theme classes from both html and body
    root.classList.remove('light', 'dark');
    body.classList.remove('light', 'dark');
    // Add the current theme class to both for maximum compatibility
    root.classList.add(theme);
    body.classList.add(theme);
    // Expose theme on data attribute for CSS frameworks/plugins
    root.setAttribute('data-theme', theme);
    // Persist selection
    localStorage.setItem('st_theme', theme);
  }, [theme]);

  // Function to toggle between light and dark mode
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  // Provide theme state and toggle function to children
  const value = {
    theme,
    toggleTheme,
    isDark: theme === 'dark'
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
