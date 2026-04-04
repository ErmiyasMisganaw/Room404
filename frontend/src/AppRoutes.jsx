import React from 'react';
import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom';
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';
import CleanerDashboard from './components/CleanerDashboard';
import MaintenanceDashboard from './components/MaintenanceDashboard';
import CafeteriaDashboard from './components/CafeteriaDashboard';
import ReceptionDashboard from './components/ReceptionDashboard';
import CustomerDashboard from './components/CustomerDashboard';
import ApiWorkbench from './components/ApiWorkbench';
import ManagerDashboard from './components/ManagerDashboard';
import { AuthProvider, roleRouteMap, useAuth } from './context/AuthContext';

function PreviewEntryPoints() {
  const links = [
    { label: 'Reception', path: '/preview/reception', color: '#1d5c28' },
    { label: 'Cleaner', path: '/preview/cleaner', color: '#2d7a3a' },
    { label: 'Maintenance', path: '/preview/maintenance', color: '#8a6a10' },
    { label: 'Cafeteria', path: '/preview/cafeteria', color: '#8a4a20' },
    { label: 'Customer', path: '/preview/customer', color: '#d4186e' },
    { label: 'Manager Analytics', path: '/manager/preview', color: '#6366f1' },
    { label: 'API Workbench', path: '/preview/api', color: '#374151' },
  ];

  return (
    <main className="min-h-screen px-4 py-12 font-sans" style={{ backgroundColor: '#f4f6ed' }}>
      <div className="mx-auto w-full max-w-lg">
        <div className="mb-8 text-center">
          <img src="/kuriftulogo.jpg" alt="Kuriftu" className="h-12 w-12 rounded-xl object-cover mx-auto mb-4 shadow-md" />
          <h1 className="text-xl font-semibold text-gray-900" style={{ fontFamily: 'Georgia, serif' }}>
            Kuriftu Resort
          </h1>
          <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest">Staff Portal · Demo</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {links.map((link) => (
            <Link key={link.path} to={link.path}
              className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-3.5 text-sm font-medium text-gray-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: link.color }} />
              {link.label}
            </Link>
          ))}
        </div>
        <div className="mt-6 text-center">
          <Link to="/login" className="text-xs text-gray-400 hover:text-gray-600 transition">
            ← Back to Login
          </Link>
        </div>
      </div>
    </main>
  );
}

function LoginRouteGate() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a1f0e] text-sm text-white/70">
        Checking your session...
      </div>
    );
  }

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

          <Route path="/preview" element={<PreviewEntryPoints />} />
          <Route path="/preview/cleaner" element={<CleanerDashboard />} />
          <Route path="/preview/maintenance" element={<MaintenanceDashboard />} />
          <Route path="/preview/cafeteria" element={<CafeteriaDashboard />} />
          <Route path="/preview/reception" element={<ReceptionDashboard />} />
          <Route path="/preview/customer" element={<CustomerDashboard />} />
          <Route path="/preview/api" element={<ApiWorkbench />} />

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

          <Route element={<ProtectedRoute allowedRoles={['receptionist', 'manager']} />}>
            <Route path="/reception" element={<ReceptionDashboard />} />
            <Route path="/reception/api" element={<ApiWorkbench />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['customer']} />}>
            <Route path="/customer" element={<CustomerDashboard />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['manager', 'receptionist']} />}>
            <Route path="/manager" element={<ManagerDashboard />} />
          </Route>

          {/* Unprotected preview route for manager UI */}
          <Route path="/manager/preview" element={<ManagerDashboard />} />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}