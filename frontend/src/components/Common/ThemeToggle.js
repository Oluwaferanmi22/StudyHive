import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const ThemeToggle = ({ className = '', showLabel = false, size = 'md' }) => {
  const { theme, toggleTheme, isTransitioning } = useTheme();

  const sizeClasses = {
    sm: 'w-8 h-8 p-1',
    md: 'w-10 h-10 p-2',
    lg: 'w-12 h-12 p-3'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={toggleTheme}
        disabled={isTransitioning}
        className={`
          relative rounded-lg transition-all duration-300 ease-in-out
          bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700
          text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100
          border border-gray-200 dark:border-gray-600
          focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400
          disabled:opacity-50 disabled:cursor-not-allowed
          ${sizeClasses[size]} ${className}
        `}
        title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      >
        {/* Sun Icon (Light Mode) */}
        <div className={`
          absolute inset-0 flex items-center justify-center transition-all duration-300 ease-in-out
          ${theme === 'light' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-75'}
        `}>
          <svg className={iconSizes[size]} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" 
            />
          </svg>
        </div>

        {/* Moon Icon (Dark Mode) */}
        <div className={`
          absolute inset-0 flex items-center justify-center transition-all duration-300 ease-in-out
          ${theme === 'dark' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-75'}
        `}>
          <svg className={iconSizes[size]} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" 
            />
          </svg>
        </div>

        {/* Loading indicator when transitioning */}
        {isTransitioning && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`animate-spin rounded-full border-2 border-current border-t-transparent ${iconSizes[size]}`}></div>
          </div>
        )}
      </button>

      {showLabel && (
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
          {theme} mode
        </span>
      )}
    </div>
  );
};

export default ThemeToggle;
