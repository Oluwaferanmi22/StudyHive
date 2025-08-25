import React from 'react';

// Basic Spinner Loader
export const Spinner = ({ size = 'md', color = 'blue', className = '' }) => {
  const sizeClasses = {
    xs: 'w-4 h-4',
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const colorClasses = {
    blue: 'text-blue-600',
    primary: 'text-primary-600',
    secondary: 'text-secondary-600',
    green: 'text-green-600',
    red: 'text-red-600',
    gray: 'text-gray-600',
    white: 'text-white'
  };

  return (
    <div className={`${sizeClasses[size]} ${colorClasses[color]} ${className}`}>
      <svg
        className="animate-spin"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  );
};

// StudyHive Themed Loader with Hexagon
export const HiveLoader = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20'
  };

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <div className="relative">
        {/* Hexagon Shape */}
        <div className="absolute inset-0 animate-spin">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <polygon
              points="50,5 90,25 90,75 50,95 10,75 10,25"
              fill="none"
              stroke="url(#gradient)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="20 5"
              className="animate-pulse"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" className="text-primary-500" stopColor="currentColor" />
                <stop offset="100%" className="text-secondary-500" stopColor="currentColor" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        
        {/* Center Dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  );
};

// Dots Loader
export const DotsLoader = ({ size = 'md', color = 'primary', className = '' }) => {
  const sizeClasses = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-3 h-3'
  };

  const colorClasses = {
    primary: 'bg-primary-500',
    secondary: 'bg-secondary-500',
    blue: 'bg-blue-500',
    gray: 'bg-gray-500'
  };

  return (
    <div className={`flex space-x-1 ${className}`}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full animate-bounce`}
          style={{
            animationDelay: `${i * 0.1}s`,
            animationDuration: '0.6s'
          }}
        />
      ))}
    </div>
  );
};

// Pulse Loader
export const PulseLoader = ({ className = '' }) => {
  return (
    <div className={`flex space-x-2 ${className}`}>
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="w-3 h-8 bg-gradient-to-t from-primary-400 to-primary-600 rounded animate-pulse"
          style={{
            animationDelay: `${i * 0.15}s`,
            animationDuration: '1s'
          }}
        />
      ))}
    </div>
  );
};

// Skeleton Loader for Cards
export const SkeletonCard = ({ className = '' }) => {
  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="animate-pulse">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gray-300 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-300 rounded w-3/4" />
            <div className="h-3 bg-gray-300 rounded w-1/2" />
          </div>
        </div>
        <div className="mt-4 space-y-3">
          <div className="h-3 bg-gray-300 rounded" />
          <div className="h-3 bg-gray-300 rounded w-5/6" />
          <div className="h-3 bg-gray-300 rounded w-4/6" />
        </div>
        <div className="mt-6 flex space-x-3">
          <div className="h-8 bg-gray-300 rounded w-20" />
          <div className="h-8 bg-gray-300 rounded w-16" />
        </div>
      </div>
    </div>
  );
};

// Skeleton Loader for Messages
export const SkeletonMessage = ({ isOwn = false, className = '' }) => {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${className}`}>
      <div className={`flex ${isOwn ? 'flex-row-reverse' : 'flex-row'} items-start space-x-3 max-w-xs lg:max-w-md`}>
        {!isOwn && <div className="w-8 h-8 bg-gray-300 rounded-full animate-pulse" />}
        <div className="flex-1">
          <div className={`bg-gray-200 rounded-lg p-3 ${isOwn ? 'rounded-br-none' : 'rounded-bl-none'}`}>
            <div className="animate-pulse space-y-2">
              <div className="h-3 bg-gray-300 rounded w-3/4" />
              <div className="h-3 bg-gray-300 rounded w-1/2" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Full Page Loader
export const FullPageLoader = ({ message = 'Loading...', showHive = true }) => {
  return (
    <div className="fixed inset-0 bg-white bg-opacity-90 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="text-center">
        {showHive ? (
          <HiveLoader size="xl" className="mx-auto mb-4" />
        ) : (
          <Spinner size="xl" color="primary" className="mx-auto mb-4" />
        )}
        <h3 className="text-lg font-semibold text-gray-900 mb-2">StudyHive</h3>
        <p className="text-gray-600">{message}</p>
        <DotsLoader className="mt-4 justify-center" />
      </div>
    </div>
  );
};

// Inline Loader with Message
export const InlineLoader = ({ message, size = 'sm', className = '' }) => {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Spinner size={size} color="primary" />
      <span className="text-gray-600 text-sm">{message}</span>
    </div>
  );
};

// Button Loader
export const ButtonLoader = ({ size = 'sm', color = 'white' }) => {
  return <Spinner size={size} color={color} />;
};

// Loading Overlay for Components
export const LoadingOverlay = ({ isLoading, children, message = 'Loading...' }) => {
  return (
    <div className="relative">
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
          <div className="text-center">
            <HiveLoader size="lg" className="mx-auto mb-2" />
            <p className="text-gray-600 text-sm">{message}</p>
          </div>
        </div>
      )}
    </div>
  );
};

// Connection Status Loader
export const ConnectionLoader = () => {
  return (
    <div className="flex items-center space-x-2">
      <DotsLoader size="sm" color="blue" />
      <span className="text-blue-600 text-sm">Connecting to StudyHive...</span>
    </div>
  );
};

// Typing Indicator
export const TypingIndicator = ({ users = [] }) => {
  if (users.length === 0) return null;

  const displayText = 
    users.length === 1 
      ? `${users[0]} is typing...`
      : users.length === 2
      ? `${users[0]} and ${users[1]} are typing...`
      : `${users[0]} and ${users.length - 1} others are typing...`;

  return (
    <div className="flex items-center space-x-2 text-gray-500 text-sm py-2">
      <DotsLoader size="sm" color="gray" />
      <span>{displayText}</span>
    </div>
  );
};

// Progress Bar Loader
export const ProgressBar = ({ progress = 0, className = '', showPercentage = false }) => {
  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-gray-700">Progress</span>
        {showPercentage && (
          <span className="text-sm font-medium text-gray-700">{Math.round(progress)}%</span>
        )}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-gradient-to-r from-primary-500 to-secondary-500 h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
        />
      </div>
    </div>
  );
};

// Loading States for Lists
export const LoadingList = ({ count = 3, type = 'card' }) => {
  const items = Array.from({ length: count }, (_, i) => i);
  
  if (type === 'message') {
    return (
      <div className="space-y-4">
        {items.map((i) => (
          <SkeletonMessage key={i} isOwn={i % 2 === 0} />
        ))}
      </div>
    );
  }
  
  return (
    <div className="grid gap-4">
      {items.map((i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
};
