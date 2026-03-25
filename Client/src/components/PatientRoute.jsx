import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export const PatientRoute = () => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) return <Navigate to="/patient/login" replace />;
  if (!user || user.role !== "PATIENT") return <Navigate to="/login" replace />;

  return <Outlet />;
};

