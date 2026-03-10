import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "../components/ProtectedRoute.jsx";
import { RoleRoute } from "../components/RoleRoute.jsx";
import { LoginPage } from "../pages/LoginPage.jsx";
import { AdminDashboard } from "../pages/AdminDashboard.jsx";
import { DoctorDashboard } from "../pages/DoctorDashboard.jsx";
import { ReceptionistDashboard } from "../pages/ReceptionistDashboard.jsx";
import { SchedulerPage } from "../pages/SchedulerPage.jsx";
import { BookingPage } from "../pages/BookingPage.jsx";
import { AppointmentListPage } from "../pages/AppointmentListPage.jsx";
import { DoctorsPage } from "../pages/admin/DoctorsPage.jsx";
import { ReceptionistsPage } from "../pages/admin/ReceptionistsPage.jsx";
import { SystemStatsPage } from "../pages/admin/SystemStatsPage.jsx";

export const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />

    <Route element={<ProtectedRoute />}>
      <Route
        path="/admin"
        element={
          <RoleRoute allowedRoles={["SUPER_ADMIN"]}>
            <AdminDashboard />
          </RoleRoute>
        }
      />
      <Route
        path="/admin/doctors"
        element={
          <RoleRoute allowedRoles={["SUPER_ADMIN"]}>
            <DoctorsPage />
          </RoleRoute>
        }
      />
      <Route
        path="/admin/receptionists"
        element={
          <RoleRoute allowedRoles={["SUPER_ADMIN"]}>
            <ReceptionistsPage />
          </RoleRoute>
        }
      />

      <Route
        path="/admin/stats"
        element={
          <RoleRoute allowedRoles={["SUPER_ADMIN"]}>
            <SystemStatsPage />
          </RoleRoute>
        }
      />
      <Route
        path="/doctor"
        element={
          <RoleRoute allowedRoles={["DOCTOR"]}>
            <DoctorDashboard />
          </RoleRoute>
        }
      />
      <Route
        path="/appointments"
        element={
          <RoleRoute allowedRoles={["RECEPTIONIST", "SUPER_ADMIN"]}>
            <ReceptionistDashboard />
          </RoleRoute>
        }
      />
      <Route
        path="/scheduler"
        element={
          <RoleRoute allowedRoles={["RECEPTIONIST", "SUPER_ADMIN"]}>
            <SchedulerPage />
          </RoleRoute>
        }
      />
      <Route
        path="/booking"
        element={
          <RoleRoute allowedRoles={["RECEPTIONIST", "SUPER_ADMIN"]}>
            <BookingPage />
          </RoleRoute>
        }
      />
      <Route
        path="/appointments/list"
        element={
          <RoleRoute allowedRoles={["RECEPTIONIST", "SUPER_ADMIN", "DOCTOR"]}>
            <AppointmentListPage />
          </RoleRoute>
        }
      />
    </Route>

    <Route path="/" element={<Navigate to="/login" replace />} />
    <Route path="*" element={<Navigate to="/login" replace />} />
  </Routes>
);


