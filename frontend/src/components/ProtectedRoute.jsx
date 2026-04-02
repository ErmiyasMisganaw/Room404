import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth, roleRouteMap } from '../context/AuthContext';

export default function ProtectedRoute({ allowedRoles = [] }) {
  const { user, isAuthenticated } = useAuth();

  // Backend integration later: validate auth with server session/JWT before allowing route access.
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    const safeRedirect = roleRouteMap[user.role] || '/login';
    return <Navigate to={safeRedirect} replace />;
  }

  return <Outlet />;
}