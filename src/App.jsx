import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import Dashboard from "./pages/Dashboard";
import ActivePatients from "./pages/ActivePatients";
import PatientHistory from "./pages/PatientHistory";
import UserPage from "./pages/UserPage";

import ProtectedRoute from "./components/ProtectedRoute";
function App() {
  return (
    <Router>
      <Routes>

        {/* ---------------- PUBLIC ROUTES ---------------- */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* ---------------- PROTECTED ROUTES ---------------- */}

        {/* Dashboard - any logged in user */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Active Patients - Doctor & Admin */}
        <Route
          path="/active-patients"
          element={
            <ProtectedRoute allowedRoles={["doctor", "admin"]}>
              <ActivePatients />
            </ProtectedRoute>
          }
        />

        {/* Patient History - Doctor, Admin, Nurse */}
        <Route
          path="/patient-history"
          element={
            <ProtectedRoute allowedRoles={["doctor", "admin", "nurse"]}>
              <PatientHistory />
            </ProtectedRoute>
          }
        />

        {/* User Profile */}
        <Route
          path="/user"
          element={
            <ProtectedRoute>
              <UserPage />
            </ProtectedRoute>
          }
        />

        {/* Admin Only Registration */}
        <Route
          path="/register-admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <RegisterPage />
            </ProtectedRoute>
          }
        />

        {/* ---------------- DEFAULT REDIRECT ---------------- */}
        <Route path="*" element={<Navigate to="/login" replace />} />

      </Routes>
    </Router>
  );
}

export default App;
