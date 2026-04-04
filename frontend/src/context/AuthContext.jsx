import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../utils/supabase';

export const AUTH_HEADER_STORAGE_KEY = 'room404.auth-context';

const AuthContext = createContext({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  authError: '',
  login: async () => ({ success: false }),
  logout: async () => {},
});

const roleRouteMap = {
  manager: '/reception',
  cleaner: '/cleaner',
  maintenance: '/maintenance',
  cafeteria: '/cafeteria',
  receptionist: '/reception',
  customer: '/customer',
};

const normalizedRoleMap = {
  manager: 'manager',
  cleaner: 'cleaner',
  housekeeping: 'cleaner',
  maintenance: 'maintenance',
  cafeteria: 'cafeteria',
  kitchen: 'cafeteria',
  receptionist: 'receptionist',
  reception: 'receptionist',
  customer: 'customer',
  guest: 'customer',
};

function normalizeRole(rawRole) {
  const nextRole = `${rawRole || ''}`.trim().toLowerCase();
  return normalizedRoleMap[nextRole] || null;
}

async function getProfileForUser(userId) {
  if (!supabase || !userId) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('role, full_name, room_number, check_in_date, email')
    .eq('id', userId)
    .maybeSingle();

  if (error) return null;

  return data || null;
}

async function toAppUser(authUser) {
  if (!authUser) return { user: null, message: '' };

  const profile = await getProfileForUser(authUser.id);

  const userMeta = authUser.user_metadata || {};
  const appMeta = authUser.app_metadata || {};
  const role = normalizeRole(profile?.role || userMeta.role || userMeta.user_role || appMeta.role);

  if (!role) {
    return {
      user: null,
      message: 'Your account has no valid role assigned. Contact admin to set your role in profiles.',
    };
  }

  const fallbackName = authUser.email ? authUser.email.split('@')[0] : 'User';

  return {
    user: {
      id: authUser.id,
      email: profile?.email || authUser.email || '',
      name: profile?.full_name || userMeta.full_name || userMeta.name || fallbackName,
      role,
      roomNumber: profile?.room_number || userMeta.room_number || userMeta.roomNumber || null,
      checkInDate: profile?.check_in_date || userMeta.check_in_date || userMeta.checkInDate || null,
    },
    message: '',
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const hydrateFromAuthUser = async (authUser) => {
      if (!authUser) {
        setAuthError('');
        localStorage.removeItem(AUTH_HEADER_STORAGE_KEY);
        setUser(null);
        return;
      }

      const { user: nextUser, message } = await toAppUser(authUser);
      if (!nextUser) {
        setAuthError(message || 'Unable to load your user profile.');
        localStorage.removeItem(AUTH_HEADER_STORAGE_KEY);
        setUser(null);
        return;
      }

      setAuthError('');
      localStorage.setItem(
        AUTH_HEADER_STORAGE_KEY,
        JSON.stringify({ email: nextUser.email, role: nextUser.role })
      );
      setUser(nextUser);
    };

    supabase.auth.getSession().then(async ({ data }) => {
      if (!isMounted) return;
      await hydrateFromAuthUser(data.session?.user || null);
      setIsLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      void (async () => {
        await hydrateFromAuthUser(session?.user || null);
        setIsLoading(false);
      })();
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const login = async ({ identifier, password }) => {
    if (!isSupabaseConfigured || !supabase) {
      return {
        success: false,
        message: 'Supabase credentials are missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY.',
      };
    }

    const email = identifier?.trim();

    if (!email || !password?.trim()) {
      return { success: false, message: 'Invalid login input.' };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { success: false, message: error.message || 'Invalid credentials.' };
    }

    const { user: nextUser, message } = await toAppUser(data.user);

    if (!nextUser) {
      await supabase.auth.signOut();
      setAuthError(message);
      return { success: false, message };
    }

    setAuthError('');
    localStorage.setItem(
      AUTH_HEADER_STORAGE_KEY,
      JSON.stringify({ email: nextUser.email, role: nextUser.role })
    );
    setUser(nextUser);

    return {
      success: true,
      user: nextUser,
      redirectTo: roleRouteMap[nextUser.role] || '/login',
    };
  };

  const logout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setAuthError('');
    localStorage.removeItem(AUTH_HEADER_STORAGE_KEY);
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      authError,
      login,
      logout,
    }),
    [authError, isLoading, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

export { roleRouteMap };