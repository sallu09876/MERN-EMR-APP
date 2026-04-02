import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "../components/ProtectedRoute.jsx";
import { RoleRoute } from "../components/RoleRoute.jsx";
import { PatientRoute } from "../components/PatientRoute.jsx";
import { LoginPage } from "../pages/LoginPage.jsx";
import { AdminDashboard } from "../pages/AdminDashboard.jsx";
import { DoctorDashboard } from "../pages/DoctorDashboard.jsx";
import { ReceptionistDashboard } from "../pages/ReceptionistDashboard.jsx";
import { SchedulerPage } from "../pages/SchedulerPage.jsx";
import { BookingPage } from "../pages/BookingPage.jsx";
import { AppointmentListPage } from "../pages/AppointmentListPage.jsx";
import { ReceptionistsPage } from "../pages/admin/ReceptionistsPage.jsx";
import { SystemStatsPage } from "../pages/admin/SystemStatsPage.jsx";
import { DoctorsPage } from "../pages/admin/DoctorsPage.jsx";
import { PatientsPage } from "../pages/admin/PatientsPage.jsx";

import { PatientLoginPage } from "../pages/patient/PatientLoginPage.jsx";
import { PatientRegisterPage } from "../pages/patient/PatientRegisterPage.jsx";
import { PatientOTPPage } from "../pages/patient/PatientOTPPage.jsx";
import { PatientForgotPasswordPage } from "../pages/patient/PatientForgotPasswordPage.jsx";
import { PatientDashboardPage } from "../pages/patient/PatientDashboardPage.jsx";
import { PatientProfilePage } from "../pages/patient/PatientProfilePage.jsx";
import { PatientBookPage } from "../pages/patient/PatientBookPage.jsx";
import { PatientAppointmentsPage } from "../pages/patient/PatientAppointmentsPage.jsx";

export const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />

    {/* Patient Portal public routes */}
    <Route path="/patient/login" element={<PatientLoginPage />} />
    <Route path="/patient/register" element={<PatientRegisterPage />} />
    <Route path="/patient/verify-otp" element={<PatientOTPPage />} />
    <Route path="/patient/verify-otp/*" element={<PatientOTPPage />} />
    <Route path="/patient/forgot-password" element={<PatientForgotPasswordPage />} />
    <Route path="/patient/forgot-password/*" element={<PatientForgotPasswordPage />} />

    {/* Backward/alternate aliases (avoid blank pages on wrong URL) */}
    <Route path="/verify-otp" element={<Navigate to="/patient/verify-otp" replace />} />
    <Route path="/forgot-password" element={<Navigate to="/patient/forgot-password" replace />} />

    <Route element={<PatientRoute />}>
      <Route path="/patient/dashboard" element={<PatientDashboardPage />} />
      <Route path="/patient/profile" element={<PatientProfilePage />} />
      <Route path="/patient/book" element={<PatientBookPage />} />
      <Route path="/patient/appointments" element={<PatientAppointmentsPage />} />
    </Route>

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
        path="/admin/patients"
        element={
          <RoleRoute allowedRoles={["SUPER_ADMIN"]}>
            <PatientsPage />
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


