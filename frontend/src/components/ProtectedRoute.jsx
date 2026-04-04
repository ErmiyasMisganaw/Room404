import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth, roleRouteMap } from '../context/AuthContext';

export default function ProtectedRoute({ allowedRoles = [] }) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a1f0e] text-sm text-white/70">
        Checking your session...
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    const safeRedirect = roleRouteMap[user.role] || '/login';
    return <Navigate to={safeRedirect} replace />;
  }

  return <Outlet />;
}