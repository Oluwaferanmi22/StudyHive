import React, { createContext, useState, useContext, useEffect } from 'react';

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

  // Check for existing auth token on app load
  useEffect(() => {
    const token = localStorage.getItem('studyhive_token');
    const userData = localStorage.getItem('studyhive_user');
    
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('studyhive_token');
        localStorage.removeItem('studyhive_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      // This would typically be an API call
      // For now, we'll simulate a successful login
      const mockUser = {
        id: '1',
        email: email,
        name: 'Demo User',
        reputation: 150,
        badge: 'Contributor',
        joinedGroups: 3
      };

      const mockToken = 'mock_jwt_token_' + Date.now();
      
      localStorage.setItem('studyhive_token', mockToken);
      localStorage.setItem('studyhive_user', JSON.stringify(mockUser));
      setUser(mockUser);
      
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Login failed' };
    }
  };

  const register = async (userData) => {
    try {
      // This would typically be an API call
      const newUser = {
        id: Date.now().toString(),
        email: userData.email,
        name: userData.name,
        reputation: 0,
        badge: 'Newcomer',
        joinedGroups: 0
      };

      const mockToken = 'mock_jwt_token_' + Date.now();
      
      localStorage.setItem('studyhive_token', mockToken);
      localStorage.setItem('studyhive_user', JSON.stringify(newUser));
      setUser(newUser);
      
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Registration failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('studyhive_token');
    localStorage.removeItem('studyhive_user');
    setUser(null);
  };

  const value = {
    user,
    login,
    register,
    logout,
    isLoading,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
