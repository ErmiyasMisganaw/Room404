import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';
import CleanerDashboard from './components/CleanerDashboard';
import MaintenanceDashboard from './components/MaintenanceDashboard';
import CafeteriaDashboard from './components/CafeteriaDashboard';
import ReceptionDashboard from './components/ReceptionDashboard';
import CustomerDashboard from './components/CustomerDashboard';
import { AuthProvider, roleRouteMap, useAuth } from './context/AuthContext';

function LoginRouteGate() {
  const { user, isAuthenticated } = useAuth();

  if (isAuthenticated && user) {
    const redirectPath = roleRouteMap[user.role] || '/login';
    return <Navigate to={redirectPath} replace />;
  }

  return <Login />;
}

export default function AppRoutes() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginRouteGate />} />

          {/* Backend integration later: replace simulated auth in context with token/session checks. */}
          <Route element={<ProtectedRoute allowedRoles={['cleaner']} />}>
            <Route path="/cleaner" element={<CleanerDashboard />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['maintenance']} />}>
            <Route path="/maintenance" element={<MaintenanceDashboard />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['cafeteria']} />}>
            <Route path="/cafeteria" element={<CafeteriaDashboard />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['receptionist']} />}>
            <Route path="/reception" element={<ReceptionDashboard />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['customer']} />}>
            <Route path="/customer" element={<CustomerDashboard />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}