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
          className={`animate-fade-in-up flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm shadow-xl backdrop-blur-sm ${
            toast.type === 'success'
              ? 'border-[#9bc23c]/40 bg-[#9bc23c]/10 text-[#3a6e10]'
              : 'border-[#d4186e]/40 bg-[#d4186e]/10 text-[#8a0040]'
          }`}
        >
          <p className="font-medium">{toast.message}</p>
          <button type="button" onClick={() => onDismiss(toast.id)} className="flex-shrink-0 text-xs font-bold opacity-60 hover:opacity-100 transition">
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

// ── Role config ──────────────────────────────────────────────────────────────

const roles = [
  {
    value: 'customer', label: 'Guest',
    desc: 'Request services & chat with AI concierge',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
  },
  {
    value: 'receptionist', label: 'Reception',
    desc: 'Room management & guest check-in',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 0h.008v.008h-.008V7.5z" />
      </svg>
    ),
  },
  {
    value: 'cleaner', label: 'Housekeeping',
    desc: 'Cleaning tasks & room queue',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
      </svg>
    ),
  },
  {
    value: 'maintenance', label: 'Maintenance',
    desc: 'Facility issues & repairs',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.384-3.19m0 0a2.019 2.019 0 01-.424-2.89l4.88-6.344a2.019 2.019 0 013.067.084l4.589 5.99a2.019 2.019 0 01-.453 2.85l-5.31 3.37m-2.965.13l.243 3.1a1.01 1.01 0 001.517.742l2.498-1.587m-4.258 1.105l-1.395 1.181A1.01 1.01 0 005.4 19.31l.097-3.14" />
      </svg>
    ),
  },
  {
    value: 'cafeteria', label: 'Cafeteria',
    desc: 'Food orders & menu management',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.87c1.355 0 2.697.055 4.024.165C17.155 8.51 18 9.473 18 10.608v2.513m-3-4.87v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 16.5m15-3.38a48.474 48.474 0 00-6-.37c-2.032 0-4.034.126-6 .37m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.17c0 .62-.504 1.124-1.125 1.124H4.125A1.125 1.125 0 013 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 016 13.12M16.5 8.625V4.875c0-.621-.504-1.125-1.125-1.125h-6.75c-.621 0-1.125.504-1.125 1.125v3.75" />
      </svg>
    ),
  },
];

// ── Main ──────────────────────────────────────────────────────────────────────

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [step, setStep] = useState('role'); // 'role' | 'credentials'
  const [selectedRole, setSelectedRole] = useState('');
  const [formValues, setFormValues] = useState({ identifier: '', password: '' });
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

  const handleRoleClick = (value) => {
    setSelectedRole(value);
    setStep('credentials');
  };

  const handleBack = () => {
    setStep('role');
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!formValues.identifier.trim()) next.identifier = 'Required';
    if (!formValues.password.trim()) next.password = 'Required';
    if (Object.keys(next).length) { setErrors(next); return; }

    try {
      setLoading(true);
      const result = await login({ identifier: formValues.identifier, password: formValues.password, role: selectedRole });
      if (!result.success) { pushToast(result.message || 'Login failed.', 'error'); return; }
      pushToast('Welcome! Redirecting...', 'success');
      navigate(result.redirectTo, { replace: true });
    } catch {
      pushToast('Something went wrong. Try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const selectedRoleData = roles.find((r) => r.value === selectedRole);

  return (
    <div className="relative min-h-screen overflow-hidden font-sans" style={{ backgroundColor: '#0d2414' }}>
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0d2414] via-[#163620] to-[#0d2414]" />
        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-[#9bc23c]/8 blur-[100px]" />
        <div className="absolute -right-40 -bottom-40 h-[500px] w-[500px] rounded-full bg-[#9bc23c]/5 blur-[100px]" />
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'radial-gradient(#9bc23c 1px, transparent 1px)', backgroundSize: '32px 32px' }}
        />
      </div>

      <main className="relative flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">

          {/* Logo */}
          <div className="mb-10 text-center animate-fade-in-up">
            <div className="inline-flex items-center justify-center rounded-2xl bg-white/10 p-2.5 backdrop-blur-sm ring-1 ring-white/10 shadow-2xl mb-5">
              <img src="/kuriftulogo.jpg" alt="Kuriftu Resort" className="h-16 w-16 rounded-xl object-cover" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Kuriftu Resort</h1>
            <p className="mt-1.5 text-sm text-white/50">AI-Powered Hotel Operations</p>
          </div>

          {/* Step 1: Role selection */}
          {step === 'role' && (
            <div className="animate-fade-in-up">
              <p className="mb-4 text-center text-sm font-medium text-white/70">Select your role to continue</p>
              <div className="space-y-2.5">
                {roles.map((role, i) => (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => handleRoleClick(role.value)}
                    className="group flex w-full items-center gap-4 rounded-2xl border border-white/8 bg-white/5 px-5 py-4 text-left backdrop-blur-sm transition-all duration-200 hover:border-[#9bc23c]/40 hover:bg-[#9bc23c]/8 hover:scale-[1.02] active:scale-[0.99]"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/10 text-white/70 transition-colors group-hover:bg-[#9bc23c]/20 group-hover:text-[#9bc23c]">
                      {role.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white">{role.label}</p>
                      <p className="text-xs text-white/40 leading-tight mt-0.5">{role.desc}</p>
                    </div>
                    <svg className="h-4 w-4 text-white/20 transition-all group-hover:text-[#9bc23c] group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </button>
                ))}
              </div>
              <p className="mt-6 text-center text-xs text-white/25">
                Kuriftu Resort Management System
              </p>
            </div>
          )}

          {/* Step 2: Credentials */}
          {step === 'credentials' && (
            <div className="animate-fade-in-up">
              {/* Back + role indicator */}
              <div className="mb-6 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-white/50 transition hover:border-white/20 hover:text-white"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                </button>
                {selectedRoleData && (
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#9bc23c]/15 text-[#9bc23c]">
                      {selectedRoleData.icon}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{selectedRoleData.label}</p>
                      <p className="text-[11px] text-white/40">Sign in to continue</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Credentials card */}
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-6 backdrop-blur-sm">
                <form className="space-y-4" onSubmit={handleSubmit} noValidate>
                  <div>
                    <label htmlFor="identifier" className="mb-1.5 block text-xs font-semibold text-white/50 uppercase tracking-wider">
                      Username
                    </label>
                    <input
                      id="identifier"
                      name="identifier"
                      type="text"
                      autoComplete="username"
                      autoFocus
                      value={formValues.identifier}
                      onChange={handleChange}
                      placeholder="Enter username or email"
                      className={`w-full rounded-xl border bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:bg-white/8 focus:ring-2 ${
                        errors.identifier ? 'border-[#d4186e]/50 focus:ring-[#d4186e]/20' : 'border-white/10 focus:border-[#9bc23c]/40 focus:ring-[#9bc23c]/15'
                      }`}
                    />
                    {errors.identifier && <p className="mt-1 text-xs text-[#d4186e]">{errors.identifier}</p>}
                  </div>

                  <div>
                    <label htmlFor="password" className="mb-1.5 block text-xs font-semibold text-white/50 uppercase tracking-wider">
                      Password
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      value={formValues.password}
                      onChange={handleChange}
                      placeholder="Enter password"
                      className={`w-full rounded-xl border bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:bg-white/8 focus:ring-2 ${
                        errors.password ? 'border-[#d4186e]/50 focus:ring-[#d4186e]/20' : 'border-white/10 focus:border-[#9bc23c]/40 focus:ring-[#9bc23c]/15'
                      }`}
                    />
                    {errors.password && <p className="mt-1 text-xs text-[#d4186e]">{errors.password}</p>}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#9bc23c] px-4 py-3.5 text-sm font-bold text-[#0d2414] shadow-lg shadow-[#9bc23c]/20 transition-all hover:bg-[#b4d655] hover:shadow-[#9bc23c]/30 hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                  >
                    {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#0d2414]/20 border-t-[#0d2414]" />}
                    {loading ? 'Signing in...' : 'Continue'}
                  </button>
                </form>
              </div>

              <p className="mt-5 text-center text-xs text-white/25">
                Secure access · Kuriftu Resort
              </p>
            </div>
          )}

        </div>
      </main>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
