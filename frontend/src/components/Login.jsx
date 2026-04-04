import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Toast({ toasts, onDismiss }) {
  return (
    <div className="fixed right-4 top-4 z-50 flex w-80 flex-col gap-2">
      {toasts.map((t) => (
        <div key={t.id} className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm shadow-xl backdrop-blur-sm ${
          t.type === 'success'
            ? 'border-[#9bc23c]/40 bg-[#9bc23c]/10 text-[#3a6e10]'
            : 'border-red-400/40 bg-red-50 text-red-700'
        }`}>
          <p className="font-medium">{t.message}</p>
          <button type="button" onClick={() => onDismiss(t.id)} className="text-xs opacity-60 hover:opacity-100">✕</button>
        </div>
      ))}
    </div>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const { login, isLoading, authError } = useAuth();
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);

  const pushToast = (message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((p) => [...p, { id, message, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3500);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    setErrors((p) => ({ ...p, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    const next = {};
    if (!form.identifier.trim()) next.identifier = 'Email is required';
    if (!form.password.trim()) next.password = 'Password is required';
    if (Object.keys(next).length) { setErrors(next); return; }

    const normalizedEmail = form.identifier.trim();

    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      setErrors((prev) => ({ ...prev, identifier: 'Enter a valid email address' }));
      return;
    }

    try {
      setLoading(true);
      const result = await login({ identifier: normalizedEmail, password: form.password });
      if (!result.success) { pushToast(result.message || 'Invalid credentials.', 'error'); return; }
      pushToast(`Welcome back, ${normalizedEmail}!`, 'success');
      setTimeout(() => navigate(result.redirectTo, { replace: true }), 600);
    } catch {
      pushToast('Something went wrong. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden font-sans" style={{ backgroundColor: '#0a1f0e' }}>
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a1f0e] via-[#122b16] to-[#0a1f0e]" />
        <div className="absolute -left-60 -top-60 h-[600px] w-[600px] rounded-full bg-[#9bc23c]/6 blur-[120px]" />
        <div className="absolute -right-60 bottom-0 h-[500px] w-[500px] rounded-full bg-[#4a8c1c]/8 blur-[100px]" />
        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: 'radial-gradient(#9bc23c 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      <main className="relative flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">

          {/* Logo + branding */}
          <div className="mb-10 text-center">
            <div className="inline-flex items-center justify-center rounded-2xl bg-white/8 p-3 ring-1 ring-white/10 shadow-2xl mb-5">
              <img src="/kuriftulogo.jpg" alt="Kuriftu Resort" className="h-20 w-20 rounded-xl object-cover" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Kuriftu Resort</h1>
            <p className="mt-2 text-sm text-white/40">Your luxury escape awaits</p>
          </div>

          {/* Card */}
          <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-7 backdrop-blur-md shadow-2xl">
            <h2 className="mb-1 text-lg font-semibold text-white">Sign in</h2>
            <p className="mb-6 text-xs text-white/40">Enter your credentials to access your account</p>

            {authError && (
              <div className="mb-4 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                {authError}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div>
                <label htmlFor="identifier" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/40">
                  Email
                </label>
                <input
                  id="identifier"
                  name="identifier"
                  type="email"
                  autoComplete="email"
                  autoFocus
                  value={form.identifier}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  className={`w-full rounded-xl border bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/20 focus:bg-white/8 focus:ring-2 ${
                    errors.identifier
                      ? 'border-red-400/50 focus:ring-red-400/20'
                      : 'border-white/10 focus:border-[#9bc23c]/50 focus:ring-[#9bc23c]/15'
                  }`}
                />
                {errors.identifier && <p className="mt-1 text-xs text-red-400">{errors.identifier}</p>}
              </div>

              <div>
                <label htmlFor="password" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/40">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className={`w-full rounded-xl border bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/20 focus:bg-white/8 focus:ring-2 ${
                    errors.password
                      ? 'border-red-400/50 focus:ring-red-400/20'
                      : 'border-white/10 focus:border-[#9bc23c]/50 focus:ring-[#9bc23c]/15'
                  }`}
                />
                {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password}</p>}
              </div>

              <button
                type="submit"
                disabled={loading || isLoading}
                className="mt-2 flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#9bc23c] px-4 py-3.5 text-sm font-bold text-[#0a1f0e] shadow-lg shadow-[#9bc23c]/25 transition-all hover:bg-[#b4d655] hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#0a1f0e]/20 border-t-[#0a1f0e]" />}
                {loading ? 'Signing in...' : isLoading ? 'Checking session...' : 'Sign In'}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-white/20">
            Kuriftu Resort · Secure Access
          </p>
        </div>
      </main>

      <Toast toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((t) => t.id !== id))} />
    </div>
  );
}
