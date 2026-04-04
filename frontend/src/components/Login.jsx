import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { RiEyeLine, RiEyeOffLine } from 'react-icons/ri';

function Toast({ toasts, onDismiss }) {
  return (
    <div className="fixed right-5 top-5 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur-md"
          style={{
            background: t.type === 'success'
              ? 'linear-gradient(135deg,#0d2414,#1a3a1e)'
              : 'linear-gradient(135deg,#3b0a0a,#5c1a1a)',
            borderColor: t.type === 'success' ? 'rgba(155,194,60,0.3)' : 'rgba(220,38,38,0.3)',
            minWidth: 240,
            animation: 'slideInRight 0.3s cubic-bezier(0.34,1.56,0.64,1)',
          }}
        >
          <p className="flex-1 text-xs font-medium text-white/85">{t.message}</p>
          <button type="button" onClick={() => onDismiss(t.id)} className="text-white/30 hover:text-white/70 text-xs">✕</button>
        </div>
      ))}
    </div>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [showPw, setShowPw] = useState(false);
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
    const next = {};
    if (!form.identifier.trim()) next.identifier = 'Username is required';
    if (!form.password.trim()) next.password = 'Password is required';
    if (Object.keys(next).length) { setErrors(next); return; }
    try {
      setLoading(true);
      const result = await login({ identifier: form.identifier, password: form.password });
      if (!result.success) { pushToast(result.message || 'Invalid credentials.', 'error'); return; }
      pushToast(`Welcome, ${form.identifier}`, 'success');
      setTimeout(() => navigate(result.redirectTo, { replace: true }), 500);
    } catch {
      pushToast('Something went wrong. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex font-sans overflow-hidden">

      {/* Left — room photo (hidden on mobile) */}
      <div className="hidden lg:block lg:w-[58%] relative">
        <img
          src="/login.gif"
          alt="Kuriftu Resort"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(to right, rgba(8,20,10,0.15) 0%, rgba(8,20,10,0.05) 60%, rgba(8,20,10,0.55) 100%)'
        }} />
        {/* Bottom text */}
        <div className="absolute bottom-10 left-10 right-10">
          <p className="text-white/30 text-[10px] uppercase tracking-[0.3em] mb-2">Kuriftu Resort & Spa</p>
          <p className="text-white text-2xl font-light leading-snug" style={{ fontFamily: 'Georgia, serif' }}>
            Where luxury meets<br />the Ethiopian highlands.
          </p>
        </div>
      </div>

      {/* Right — login panel */}
      <div className="flex-1 flex flex-col justify-center relative"
        style={{ background: 'linear-gradient(160deg, #0a1f0e 0%, #0d2414 50%, #0a1a0c 100%)' }}>

        {/* Subtle texture */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: 'radial-gradient(#9bc23c 1px, transparent 1px)', backgroundSize: '36px 36px' }} />
        <div className="pointer-events-none absolute -top-40 -right-40 h-80 w-80 rounded-full bg-[#9bc23c]/6 blur-[100px]" />
        <div className="pointer-events-none absolute -bottom-40 -left-20 h-60 w-60 rounded-full bg-[#4a8c1c]/8 blur-[80px]" />

        {/* Mobile background image */}
        <div className="lg:hidden absolute inset-0">
          <img src="/login.gif" alt="" className="h-full w-full object-cover opacity-20" />
        </div>

        <div className="relative mx-auto w-full max-w-sm px-8 py-12">

          {/* Logo + brand */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-8">
              <img src="/kuriftulogo.jpg" alt="Kuriftu" className="h-10 w-10 rounded-xl object-cover shadow-lg ring-1 ring-white/10" />
              <div>
                <p className="text-white text-sm font-semibold tracking-[0.12em] uppercase" style={{ fontFamily: 'Georgia, serif' }}>
                  Kuriftu
                </p>
                <p className="text-[#9bc23c] text-[9px] uppercase tracking-[0.3em] font-medium">Resort & Spa</p>
              </div>
            </div>

            <div className="h-px w-8 bg-[#9bc23c] mb-6" />
            <h1 className="text-2xl font-light text-white leading-snug" style={{ fontFamily: 'Georgia, serif' }}>
              Welcome back
            </h1>
            <p className="text-white/35 text-sm mt-1.5 tracking-wide">Sign in to access your stay</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-5">

            {/* Username */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35 mb-2">
                Username
              </label>
              <input
                name="identifier"
                type="text"
                autoComplete="username"
                autoFocus
                value={form.identifier}
                onChange={handleChange}
                placeholder="Enter your username"
                className={`w-full rounded-xl border bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/15 focus:bg-white/8 focus:ring-2 ${
                  errors.identifier
                    ? 'border-red-400/40 focus:ring-red-400/15'
                    : 'border-white/8 focus:border-[#9bc23c]/40 focus:ring-[#9bc23c]/10'
                }`}
              />
              {errors.identifier && <p className="mt-1.5 text-[11px] text-red-400">{errors.identifier}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  name="password"
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className={`w-full rounded-xl border bg-white/5 px-4 py-3 pr-11 text-sm text-white outline-none transition placeholder:text-white/15 focus:bg-white/8 focus:ring-2 ${
                    errors.password
                      ? 'border-red-400/40 focus:ring-red-400/15'
                      : 'border-white/8 focus:border-[#9bc23c]/40 focus:ring-[#9bc23c]/10'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 transition hover:text-white/60"
                >
                  {showPw ? <RiEyeOffLine className="text-base" /> : <RiEyeLine className="text-base" />}
                </button>
              </div>
              {errors.password && <p className="mt-1.5 text-[11px] text-red-400">{errors.password}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#9bc23c] px-4 py-3.5 text-sm font-semibold text-[#0a1f0e] tracking-wide shadow-lg shadow-[#9bc23c]/20 transition hover:bg-[#b4d655] hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#0a1f0e]/20 border-t-[#0a1f0e]" />}
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="mt-10 text-center text-[10px] text-white/15 tracking-widest uppercase">
            Kuriftu Resort · Secure Access
          </p>
        </div>
      </div>

      <Toast toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((t) => t.id !== id))} />
    </div>
  );
}
