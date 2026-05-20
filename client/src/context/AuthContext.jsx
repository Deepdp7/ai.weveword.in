import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

// Enable cookies to be sent with every request automatically
axios.defaults.withCredentials = true;

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Rehydrate user from localStorage on app load
    const stored = localStorage.getItem('kolomflow_user');
    if (stored) {
      setUser(JSON.parse(stored));
    }
    setLoading(false);
  }, []);

  /**
   * Login — calls POST /api/auth/login
   * Backend response: { status, user: { id, name, email, role, plan, credits, avatar }, token }
   */
  const login = async (email, password) => {
    const { data } = await axios.post(`${API_BASE}/auth/login`, { email, password });
    setUser(data.user);
    localStorage.setItem('kolomflow_user', JSON.stringify(data.user));
    return data.user;
  };

  /**
   * Register — calls POST /api/auth/signup
   */
  const register = async (name, email, password) => {
    const { data } = await axios.post(`${API_BASE}/auth/signup`, { name, email, password });
    setUser(data.user);
    localStorage.setItem('kolomflow_user', JSON.stringify(data.user));
    return data.user;
  };

  /**
   * Logout — calls POST /api/auth/logout (clears httpOnly cookie on server)
   */
  const logout = async () => {
    try {
      await axios.post(`${API_BASE}/auth/logout`);
    } catch (_) {
      // Ignore network errors — still clear local state
    }
    setUser(null);
    localStorage.removeItem('kolomflow_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
