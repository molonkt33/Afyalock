
import React from "react";
import "./App.css";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import RoleGuard from "./components/RoleGuard";
import ProtectedRoute from "./components/ProtectedRoute";

import LoginPage from "./pages/LoginPage";
import ForgotPassword from "./pages/ForgotPassword";
import GoogleCallback from "./pages/GoogleCallback";
import Dashboard from "./pages/Dashboard";
import ActivePatients from "./pages/ActivePatients";
import PatientHistory from "./pages/PatientHistory";
import OutPatients from "./pages/OutPatients";
import Emergency from "./pages/Emergency";
import Lab from "./pages/Lab";
import Radiology from "./pages/Radiology";
import Records from "./pages/Records";
import CalendarPage from "./pages/CalendarPage";
import StaffOverview from "./pages/StaffOverview";
import ProfilePage from "./pages/ProfilePage";
import UserPage from "./pages/UserPage";
import GroupChat from "./pages/GroupChat";
import Prescriptions from "./pages/Prescriptions";
import Finance from "./pages/Finance";

// ================= LAYOUT COMPONENT =================
function Layout() {
  const location = useLocation();

  // Hide Navbar/Footer on login/forgot-password pages
  const hideLayout =
    location.pathname === "/login" ||
    location.pathname === "/forgot-password" ||
    location.pathname === "/auth/google/callback";

  return (
    <>
      {!hideLayout && <Navbar />}
      <Routes>

        {/* ================= AUTH ROUTES ================= */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/auth/google/callback" element={<GoogleCallback />} />

        {/* ================= ROOT REDIRECT ================= */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* ================= DASHBOARD ================= */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* ================= PATIENT MODULES ================= */}
        <Route
          path="/active-patients"
          element={
            <ProtectedRoute>
              <ActivePatients />
            </ProtectedRoute>
          }
        />

        <Route
          path="/patient-history"
          element={
            <ProtectedRoute>
              <PatientHistory />
            </ProtectedRoute>
          }
        />

        <Route
          path="/outpatients"
          element={
            <ProtectedRoute>
              <OutPatients />
            </ProtectedRoute>
          }
        />

        <Route
          path="/emergency"
          element={
            <ProtectedRoute>
              <Emergency />
            </ProtectedRoute>
          }
        />

        <Route
          path="/lab"
          element={
            <ProtectedRoute>
              <Lab />
            </ProtectedRoute>
          }
        />

        <Route
          path="/radiology"
          element={
            <ProtectedRoute>
              <Radiology />
            </ProtectedRoute>
          }
        />

        <Route
          path="/records"
          element={
            <ProtectedRoute>
              <Records />
            </ProtectedRoute>
          }
        />

        <Route
          path="/calendar"
          element={
            <ProtectedRoute>
              <CalendarPage />
            </ProtectedRoute>
          }
        />

        {/* ================= USER MANAGEMENT (admin only) ================= */}
        <Route
          path="/user"
          element={
            <RoleGuard allowedRoles={["admin"]}>
              <UserPage />
            </RoleGuard>
          }
        />

{/* ================= PROFILE PAGE FOR LOGGED-IN USER ================= */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        {/* ================= GROUP CHAT (all authenticated users) ================= */}
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <GroupChat />
            </ProtectedRoute>
          }
        />

        {/* ================= PRESCRIPTIONS ================= */}
        <Route
          path="/prescriptions"
          element={
            <ProtectedRoute>
              <Prescriptions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/finance"
          element={
            <RoleGuard allowedRoles={["reception", "admin"]}>
              <Finance />
            </RoleGuard>
          }
        />

        {/* ================= FALLBACK ================= */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />

      </Routes>

      {!hideLayout && <Footer />}
    </>
  );
}

// ================= APP COMPONENT =================
function App() {
  return (
    <Router>
      <Layout />
    </Router>
  );
}

export default App;
