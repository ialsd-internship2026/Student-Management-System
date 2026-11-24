import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI, setToken, clearToken, getToken } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);       // { _id, name, email, role, active }
  const [profile, setProfile] = useState(null);  // role-specific profile data
  const [loading, setLoading] = useState(true);  // initial auth check

  // Check if already logged in on mount
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    authAPI.me()
      .then((data) => {
        setUser(data.user);
        setProfile(data.profile);
      })
      .catch(() => {
        // Token expired or invalid
        clearToken();
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await authAPI.login(email, password);
    setToken(data.token);
    setUser(data.user);
    setProfile(data.profile);
    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch (e) {
      // ignore
    }
    clearToken();
    setUser(null);
    setProfile(null);
  }, []);

  const isAuthenticated = !!user;
  const role = user?.role || null;

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAuthenticated, role, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export default AuthContext;
