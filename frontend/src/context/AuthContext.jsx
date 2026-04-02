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

  const login = async ({ identifier, password, role }) => {
    // Backend integration later: replace timeout + local checks with real API authentication.
    await new Promise((resolve) => {
      setTimeout(resolve, 900);
    });

    const normalizedIdentifier = identifier?.trim();
    const normalizedRole = role?.toLowerCase();

    if (!normalizedIdentifier || !password?.trim() || !roleRouteMap[normalizedRole]) {
      return {
        success: false,
        message: 'Invalid login input.',
      };
    }

    if (password.trim().length < 4) {
      return {
        success: false,
        message: 'Password must be at least 4 characters.',
      };
    }

    const nextUser = {
      id: `user-${Date.now()}`,
      name: normalizedIdentifier,
      role: normalizedRole,
      roomNumber: normalizedRole === 'customer' ? '212' : null,
    };

    setUser(nextUser);

    return {
      success: true,
      user: nextUser,
      redirectTo: roleRouteMap[normalizedRole],
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