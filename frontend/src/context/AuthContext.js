import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

// Configure axios base URL - remove trailing slash
axios.defaults.baseURL = 'http://localhost:8000/api';
axios.defaults.headers.common['Content-Type'] = 'application/json';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const setupAxiosInterceptors = useCallback((token) => {
    // Clear existing interceptors to avoid duplicates
    const interceptors = axios.interceptors;
    
    // Request interceptor
    const requestInterceptor = interceptors.request.use(
      (config) => {
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    const responseInterceptor = interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            const refreshToken = localStorage.getItem('refresh_token');
            const response = await axios.post('/auth/token/refresh/', {
              refresh: refreshToken
            });
            
            const newToken = response.data.access;
            localStorage.setItem('access_token', newToken);
            setupAxiosInterceptors(newToken);
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            
            return axios(originalRequest);
          } catch (refreshError) {
            logout();
            toast.error('Session expired. Please login again.');
            window.location.href = '/login';
          }
        }
        
        return Promise.reject(error);
      }
    );
    
    // Store interceptor IDs if needed for cleanup
    return () => {
      interceptors.request.eject(requestInterceptor);
      interceptors.response.eject(responseInterceptor);
    };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const role = localStorage.getItem('role');
    const name = localStorage.getItem('user_name');
    
    if (token && role) {
      setUser({ role, name });
      setupAxiosInterceptors(token);
    }
    setLoading(false);
  }, [setupAxiosInterceptors]);

  const login = async (username, password, navigate) => {
    try {
      // Remove /api/ from the path since baseURL already has /api
      const response = await axios.post('/auth/login/', { username, password });
      const { access, refresh, role, name } = response.data;
      
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      localStorage.setItem('role', role);
      localStorage.setItem('user_name', name);
      
      setUser({ role, name });
      setupAxiosInterceptors(access);
      
      toast.success('Login successful!');
      
      if (role === 'staff') {
        navigate('/staff-dashboard');
      } else {
        navigate('/student-dashboard');
      }
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Login failed';
      toast.error(errorMsg);
      return false;
    }
  };

  const logout = (navigate) => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('role');
    localStorage.removeItem('user_name');
    setUser(null);
    toast.info('Logged out successfully');
    if (navigate) {
      navigate('/login');
    } else {
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};