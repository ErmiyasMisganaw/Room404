import React, { createContext, useContext, useMemo, useState } from 'react';

const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
  login: async () => ({ success: false }),
  logout: () => {},
});

const roleRouteMap = {
  cleaner: '/cleaner',
  maintenance: '/maintenance',
  cafeteria: '/cafeteria',
  receptionist: '/reception',
  customer: '/customer',
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const login = async ({ identifier, password }) => {
    // Backend integration later: replace with real API call that returns role.
    await new Promise((resolve) => setTimeout(resolve, 900));

    const normalizedIdentifier = identifier?.trim();

    if (!normalizedIdentifier || !password?.trim()) {
      return { success: false, message: 'Invalid login input.' };
    }

    if (password.trim().length < 4) {
      return { success: false, message: 'Password must be at least 4 characters.' };
    }

    // Simulate role detection from backend based on username prefix
    let detectedRole = 'customer';
    const lower = normalizedIdentifier.toLowerCase();
    if (lower.startsWith('cleaner')) detectedRole = 'cleaner';
    else if (lower.startsWith('maintenance')) detectedRole = 'maintenance';
    else if (lower.startsWith('cafeteria') || lower.startsWith('kitchen')) detectedRole = 'cafeteria';
    else if (lower.startsWith('reception') || lower.startsWith('admin')) detectedRole = 'receptionist';

    const nextUser = {
      id: `user-${Date.now()}`,
      name: normalizedIdentifier,
      role: detectedRole,
      roomNumber: detectedRole === 'customer' ? '212' : null,
      checkInDate: detectedRole === 'customer' ? new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() : null,
    };

    setUser(nextUser);

    return {
      success: true,
      user: nextUser,
      redirectTo: roleRouteMap[detectedRole],
    };
  };

  const logout = () => {
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      login,
      logout,
    }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

export { roleRouteMap };