import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "../services/api.js";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("emr_user");
    return stored ? JSON.parse(stored) : null;
  });
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem("emr_access_token"));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem("emr_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("emr_user");
    }
  }, [user]);

  useEffect(() => {
    if (accessToken) {
      localStorage.setItem("emr_access_token", accessToken);
    } else {
      localStorage.removeItem("emr_access_token");
    }
  }, [accessToken]);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const { data } = await api.post("/api/auth/login", { email, password });
      setUser(data.user);
      setAccessToken(data.accessToken);
      return data.user;
    } finally {
      setLoading(false);
    }
  }, []);

  const patientLogin = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const { data } = await api.post("/api/patient/auth/login", { email, password });
      setUser(data.user);
      setAccessToken(data.accessToken);
      return data.user;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/api/auth/logout");
    } catch {
      // ignore
    }
    setUser(null);
    setAccessToken(null);
  }, []);

  const setSession = useCallback((nextUser, nextAccessToken) => {
    if (nextUser) localStorage.setItem("emr_user", JSON.stringify(nextUser));
    else localStorage.removeItem("emr_user");
    if (nextAccessToken) localStorage.setItem("emr_access_token", nextAccessToken);
    else localStorage.removeItem("emr_access_token");
    setUser(nextUser);
    setAccessToken(nextAccessToken);
  }, []);

  const value = {
    user,
    accessToken,
    loading,
    isAuthenticated: !!user && !!accessToken,
    login,
    patientLogin,
    setSession,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

