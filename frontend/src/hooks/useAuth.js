import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

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
  const [loading, setLoading] = useState(true);

  // Set axios defaults with environment configuration
  const API_BASE_URL = process.env.REACT_APP_API_URL || 
    (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:8000');
  
  if (API_BASE_URL) {
    axios.defaults.baseURL = API_BASE_URL;
  }
  
  // Enable cookies for all requests (needed for httpOnly cookies)
  axios.defaults.withCredentials = true;

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // With httpOnly cookies, we don't need to manually set headers
      // The browser will automatically include the cookies
      const response = await axios.get('/auth/me');
      setUser(response.data);
    } catch (error) {
      // Auth check failed - this is expected on first load or expired sessions
      // Clear any legacy localStorage token
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post('/auth/login-json', { email, password });
      const { user: userData } = response.data;
      
      // With httpOnly cookies, token is automatically set by the server
      // We only need to update the user state
      setUser(userData);
      
      // Clear any legacy localStorage token
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Login failed' 
      };
    }
  };

  const register = async (email, password, name) => {
    try {
      const response = await axios.post('/auth/register', { email, password, name });
      const { user: userData } = response.data;
      
      // Registration also sets httpOnly cookie automatically
      setUser(userData);
      
      // Clear any legacy localStorage token
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Registration failed' 
      };
    }
  };

  const logout = async () => {
    try {
      // Call logout endpoint to clear httpOnly cookie
      await axios.post('/auth/logout');
    } catch (error) {
      // Logout request failed - continue with local cleanup
    } finally {
      // Clear any legacy localStorage token
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      setUser(null);
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};