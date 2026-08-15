import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create a custom axios instance
export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Interceptor to add JWT token if stored in local storage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loginStep, setLoginStep] = useState(1); // Step 1: Credentials, Step 2: OTP
  const [pendingCredentials, setPendingCredentials] = useState(null); // Save credentials temporarily

  useEffect(() => {
    const fetchMe = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get('/auth/me');
        if (res.data.success) {
          setUser(res.data.data);
        } else {
          localStorage.removeItem('token');
        }
      } catch (err) {
        console.error('Session verification failed:', err.message);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };
    fetchMe();
  }, []);

  const register = async (formData) => {
    try {
      const res = await api.post('/auth/register', formData);
      return res.data;
    } catch (err) {
      throw err.response?.data?.message || 'Registration failed';
    }
  };

  const loginStepOne = async (userId, gstNumber) => {
    try {
      const res = await api.post('/auth/login', { userId, gstNumber });
      if (res.data.success) {
        setPendingCredentials({ userId, gstNumber });
        setLoginStep(2);
      }
      return res.data;
    } catch (err) {
      throw err.response?.data?.message || 'Login initiation failed';
    }
  };

  const loginStepTwo = async (otp) => {
    if (!pendingCredentials) throw new Error('No pending login session');
    try {
      const res = await api.post('/auth/verify-otp', {
        userId: pendingCredentials.userId,
        otp,
      });
      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        setUser(res.data.user);
        // Reset login flow
        setLoginStep(1);
        setPendingCredentials(null);
      }
      return res.data;
    } catch (err) {
      throw err.response?.data?.message || 'OTP verification failed';
    }
  };

  const adminLogin = async (email, password) => {
    try {
      const res = await api.post('/auth/admin-login', { email, password });
      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        setUser(res.data.user);
      }
      return res.data;
    } catch (err) {
      throw err.response?.data?.message || 'Admin login failed';
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setLoginStep(1);
    setPendingCredentials(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      loginStep,
      pendingCredentials,
      register,
      loginStepOne,
      loginStepTwo,
      adminLogin,
      logout,
      setLoginStep,
      setPendingCredentials,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
