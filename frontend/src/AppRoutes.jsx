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
import { AuthProvider, roleRouteMap, useAuth } from './context/AuthContext';

function PreviewEntryPoints() {
  const links = [
    { label: 'Cleaner UI', path: '/preview/cleaner' },
    { label: 'Maintenance UI', path: '/preview/maintenance' },
    { label: 'Cafeteria UI', path: '/preview/cafeteria' },
    { label: 'Reception UI', path: '/preview/reception' },
    { label: 'Customer UI', path: '/preview/customer' },
    { label: 'API Workbench', path: '/preview/api' },
  ];

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10 font-sans">
      <div className="mx-auto w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-6 shadow-lg">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">Temporary QA Entry</p>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Dashboard Preview Links</h1>
        <p className="mt-1 text-sm text-gray-600">
          Use these temporary routes to check role UIs without logging in.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {links.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 transition hover:-translate-y-0.5 hover:bg-blue-100"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="mt-6 border-t border-gray-200 pt-4 text-sm">
          <Link to="/login" className="font-semibold text-orange-500 hover:text-orange-400">
            Back to Login
          </Link>
        </div>
      </div>
    </main>
  );
}

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

          <Route element={<ProtectedRoute allowedRoles={['receptionist']} />}>
            <Route path="/reception" element={<ReceptionDashboard />} />
            <Route path="/reception/api" element={<ApiWorkbench />} />
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