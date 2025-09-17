import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI, handleAPIError } from '../../services/apiService';
import socketService from '../../services/socketService';
import { FullPageLoader } from '../../components/Common/Loaders';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check for existing auth token on app load
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('studyhive_token');
      
      if (token) {
        try {
          // Verify token by getting user profile
          const response = await authAPI.getProfile();
          if (response.success) {
            setUser(response.user);
            localStorage.setItem('studyhive_user', JSON.stringify(response.user));
            
            // Connect to socket
            socketService.connect(token);
          } else {
            // Invalid token
            localStorage.removeItem('studyhive_token');
            localStorage.removeItem('studyhive_user');
          }
        } catch (error) {
          console.error('Error verifying token:', error);
          localStorage.removeItem('studyhive_token');
          localStorage.removeItem('studyhive_user');
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (loginData, password) => {
    try {
      setError(null);
      setIsLoading(true);
      
      const response = await authAPI.login(loginData, password);
      
      if (response.success) {
        setUser(response.user);
        localStorage.setItem('studyhive_token', response.token);
        localStorage.setItem('studyhive_user', JSON.stringify(response.user));
        
        // Connect to socket
        socketService.connect(response.token);
        
        return { success: true, user: response.user };
      } else {
        return { success: false, message: response.message };
      }
    } catch (error) {
      const errorResult = handleAPIError(error);
      setError(errorResult.message);
      return errorResult;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setError(null);
      setIsLoading(true);
      
      const response = await authAPI.register(userData);
      
      if (response.success) {
        setUser(response.user);
        localStorage.setItem('studyhive_token', response.token);
        localStorage.setItem('studyhive_user', JSON.stringify(response.user));
        
        // Connect to socket
        socketService.connect(response.token);
        
        return { success: true, user: response.user };
      } else {
        return { success: false, message: response.message };
      }
    } catch (error) {
      const errorResult = handleAPIError(error);
      setError(errorResult.message);
      return errorResult;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('studyhive_token');
    localStorage.removeItem('studyhive_user');
    setUser(null);
    setError(null);
    
    // Disconnect socket
    socketService.disconnect();
  };

  const updateProfile = async (profileData) => {
    try {
      setError(null);
      const response = await authAPI.updateProfile(profileData);
      
      if (response.success) {
        setUser(response.user);
        localStorage.setItem('studyhive_user', JSON.stringify(response.user));
        return { success: true, user: response.user };
      } else {
        return { success: false, message: response.message };
      }
    } catch (error) {
      const errorResult = handleAPIError(error);
      setError(errorResult.message);
      return errorResult;
    }
  };

  const refreshProfile = async () => {
    try {
      const response = await authAPI.getProfile();
      if (response.success) {
        setUser(response.user);
        localStorage.setItem('studyhive_user', JSON.stringify(response.user));
      }
    } catch (error) {
      console.error('Error refreshing profile:', error);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value = {
    user,
    login,
    register,
    logout,
    updateProfile,
    refreshProfile,
    isLoading,
    error,
    clearError,
    isAuthenticated: !!user
  };

  // Show full page loader during initial auth check
  if (isLoading && !user && !error) {
    return (
      <>
        <FullPageLoader message="Initializing StudyHive..." />
        <AuthContext.Provider value={value}>
          {children}
        </AuthContext.Provider>
      </>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
