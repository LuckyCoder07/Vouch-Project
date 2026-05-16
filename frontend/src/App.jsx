import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AuthProvider, { useAuth } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import { ToastProvider } from "./components/ui/Toast";
import DashboardLayout from "./components/layout/DashboardLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Verification from "./pages/Verification";
import HowItWorks from "./pages/HowItWorks";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Certificates from "./pages/Certificates";
import KnowAboutVouch from "./pages/KnowAboutVouch";
import TechnicalDocs from "./pages/TechnicalDocs";
import VScoreDocs from "./pages/VScoreDocs";
import VScore from "./pages/VScore";
import PublicVerify from "./pages/PublicVerify";
import History from "./pages/History";
import BatchUpload from "./pages/BatchUpload";
import OrgDashboard from "./pages/OrgDashboard";
import OrgReport from "./pages/OrgReport";

function AppRoutes() {
  const { isAuthenticated, logout } = useAuth();

  return (
    <Routes>
      {/* Public Unprotected Verification Route */}
      <Route path="/verify/:code?" element={<PublicVerify />} />

      {/* Public Route */}
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" />
          ) : (
            <Login />
          )
        }
      />

      {/* Protected Dashboard Routes */}
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <DashboardLayout />
          ) : (
            <Navigate to="/login" />
          )
        }
      >
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="org" element={<OrgDashboard />} />
        <Route path="org/:orgId/report" element={<OrgReport />} />
        <Route path="batch" element={<BatchUpload />} />
        <Route path="history" element={<History />} />
        <Route path="verification" element={<Verification />} />
        <Route path="how-it-works" element={<HowItWorks />} />
        <Route path="profile" element={<Profile />} />
        <Route path="settings" element={<Settings />} />
        <Route path="certificates" element={<Certificates />} />
        <Route path="know-about-vouch" element={<KnowAboutVouch />} />
        <Route path="docs/code-normalization" element={<TechnicalDocs />} />
        <Route path="docs/cryptographic-hashing" element={<TechnicalDocs />} />
        <Route path="docs/immutable-ledger" element={<TechnicalDocs />} />
        <Route path="docs/vscore" element={<VScoreDocs />} />
        <Route path="vscore" element={<VScore />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <ToastProvider>
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <AppRoutes />
          </BrowserRouter>
        </ToastProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}
