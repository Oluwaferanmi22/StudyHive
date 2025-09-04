import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light');
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('studyhive_theme');
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    }
  }, []);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    
    // Save to localStorage
    localStorage.setItem('studyhive_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setIsTransitioning(true);
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
    
    // Remove transition class after animation
    setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
  };

  const setLightTheme = () => {
    setIsTransitioning(true);
    setTheme('light');
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const setDarkTheme = () => {
    setIsTransitioning(true);
    setTheme('dark');
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const value = {
    theme,
    toggleTheme,
    setLightTheme,
    setDarkTheme,
    isTransitioning,
    isDark: theme === 'dark',
    isLight: theme === 'light'
  };

  return (
    <ThemeContext.Provider value={value}>
      <div className={`theme-transition ${isTransitioning ? 'transitioning' : ''}`}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
};
