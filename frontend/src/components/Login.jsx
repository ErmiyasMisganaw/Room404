import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// ── Toast ─────────────────────────────────────────────────────────────────────

function ToastContainer({ toasts, onDismiss }) {
  return (
    <div className="fixed right-4 top-4 z-50 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm shadow-xl backdrop-blur-sm ${
            toast.type === 'success'
              ? 'border-[#9bc23c]/40 bg-[#9bc23c]/10 text-[#3a6e10]'
              : 'border-[#d4186e]/40 bg-[#d4186e]/10 text-[#8a0040]'
          }`}
        >
          <p className="font-medium">{toast.message}</p>
          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            className="flex-shrink-0 text-xs font-bold opacity-60 hover:opacity-100 transition"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

// ── Role Option Card ──────────────────────────────────────────────────────────

const roles = [
  { value: 'customer',     label: 'Guest',        emoji: '🛎️',  desc: 'Make requests & track service' },
  { value: 'receptionist', label: 'Receptionist',  emoji: '🏨',  desc: 'Manage rooms & check-ins' },
  { value: 'cleaner',      label: 'Housekeeping',  emoji: '🧹',  desc: 'View & complete cleaning tasks' },
  { value: 'maintenance',  label: 'Maintenance',   emoji: '🔧',  desc: 'Handle maintenance issues' },
  { value: 'cafeteria',    label: 'Cafeteria',     emoji: '🍽️',  desc: 'Manage food orders & menu' },
];

// ── Login Form ─────────────────────────────────────────────────────────────────

function LoginForm({ values, onChange, onRoleSelect, onSubmit, errors, loading }) {
  return (
    <form className="space-y-5" onSubmit={onSubmit} noValidate>
      {/* Email / Username */}
      <div>
        <label htmlFor="identifier" className="mb-1.5 block text-sm font-semibold text-[#1d5c28]">
          Email / Username
        </label>
        <input
          id="identifier"
          name="identifier"
          type="text"
          autoComplete="username"
          value={values.identifier}
          onChange={onChange}
          placeholder="Enter your email or username"
          className="w-full rounded-xl border border-[#9bc23c]/40 bg-white/80 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-[#2d7a3a] focus:ring-4 focus:ring-[#9bc23c]/20 placeholder:text-gray-400"
        />
        {errors.identifier && (
          <p className="mt-1 text-xs font-medium text-[#d4186e]">{errors.identifier}</p>
        )}
      </div>

      {/* Password */}
      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-[#1d5c28]">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={values.password}
          onChange={onChange}
          placeholder="Enter your password"
          className="w-full rounded-xl border border-[#9bc23c]/40 bg-white/80 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-[#2d7a3a] focus:ring-4 focus:ring-[#9bc23c]/20 placeholder:text-gray-400"
        />
        {errors.password && (
          <p className="mt-1 text-xs font-medium text-[#d4186e]">{errors.password}</p>
        )}
      </div>

      {/* Role selection grid */}
      <div>
        <label className="mb-2 block text-sm font-semibold text-[#1d5c28]">Select Your Role</label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {roles.map((role) => {
            const isSelected = values.role === role.value;
            return (
              <button
                key={role.value}
                type="button"
                onClick={() => onRoleSelect(role.value)}
                className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all duration-150 ${
                  isSelected
                    ? 'border-[#2d7a3a] bg-[#1d5c28]/8 ring-2 ring-[#9bc23c]/40 shadow-sm'
                    : 'border-gray-200 bg-white/60 hover:border-[#9bc23c]/60 hover:bg-[#9bc23c]/5'
                }`}
              >
                <span className="text-xl">{role.emoji}</span>
                <div>
                  <p className={`text-xs font-bold leading-tight ${isSelected ? 'text-[#1d5c28]' : 'text-gray-700'}`}>
                    {role.label}
                  </p>
                  <p className="text-[10px] text-gray-500 leading-tight mt-0.5">{role.desc}</p>
                </div>
                {isSelected && (
                  <span className="ml-auto flex-shrink-0 h-4 w-4 rounded-full bg-[#2d7a3a] flex items-center justify-center">
                    <svg className="h-2.5 w-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {errors.role && (
          <p className="mt-1.5 text-xs font-medium text-[#d4186e]">{errors.role}</p>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-[#1d5c28] via-[#2d7a3a] to-[#3d9648] px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#1d5c28]/30 transition hover:-translate-y-0.5 hover:shadow-[#1d5c28]/40 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
      >
        {loading && (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
        )}
        {loading ? 'Signing in…' : 'Sign In to Dashboard'}
      </button>
    </form>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formValues, setFormValues] = useState({ identifier: '', password: '', role: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);

  const pushToast = (message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  };

  const dismissToast = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleRoleSelect = (value) => {
    setFormValues((prev) => ({ ...prev, role: value }));
    setErrors((prev) => ({ ...prev, role: '' }));
  };

  const validate = () => {
    const next = {};
    if (!formValues.identifier.trim()) next.identifier = 'Email or username is required.';
    if (!formValues.password.trim()) next.password = 'Password is required.';
    if (!formValues.role) next.role = 'Please select a role to continue.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) { pushToast('Please fix the highlighted fields.', 'error'); return; }
    try {
      setLoading(true);
      const result = await login({ identifier: formValues.identifier, password: formValues.password, role: formValues.role });
      if (!result.success) { pushToast(result.message || 'Login failed. Please try again.', 'error'); return; }
      pushToast('Welcome back! Redirecting…', 'success');
      navigate(result.redirectTo, { replace: true });
    } catch {
      pushToast('An unexpected error occurred. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden font-sans" style={{ backgroundColor: '#0d2414' }}>
      {/* Background pattern */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0d2414] via-[#163620] to-[#1d5c28]" />
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[#9bc23c]/10 blur-3xl" />
        <div className="absolute -right-32 -bottom-32 h-96 w-96 rounded-full bg-[#d4186e]/10 blur-3xl" />
        <div className="absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-[#9bc23c]/5 blur-3xl" />
        {/* Decorative dots grid */}
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'radial-gradient(#9bc23c 1px, transparent 1px)', backgroundSize: '28px 28px' }}
        />
      </div>

      <main className="relative flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          {/* Logo & heading */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center rounded-2xl bg-white/10 p-2 backdrop-blur-sm ring-1 ring-white/20 shadow-2xl mb-4">
              <img
                src="/kuriftulogo.jpg"
                alt="Kuriftu Resort"
                className="h-20 w-20 rounded-xl object-cover"
              />
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Kuriftu Resort</h1>
            <p className="mt-1 text-[#9bc23c] font-semibold tracking-widest text-xs uppercase">Hotel Service Portal</p>
          </div>

          {/* Card */}
          <div className="rounded-3xl border border-white/10 bg-white/95 p-6 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-[#0d2414]">Welcome Back</h2>
              <p className="mt-0.5 text-sm text-gray-500">Sign in to access your operations dashboard.</p>
            </div>

            <LoginForm
              values={formValues}
              onChange={handleChange}
              onRoleSelect={handleRoleSelect}
              onSubmit={handleSubmit}
              errors={errors}
              loading={loading}
            />

            <p className="mt-5 text-center text-xs text-gray-400">
              Secure access · Kuriftu Resort Management System
            </p>
          </div>

          {/* Footer note */}
          <p className="mt-4 text-center text-xs text-white/40">
            © {new Date().getFullYear()} Kuriftu Resort · All rights reserved
          </p>
        </div>
      </main>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
