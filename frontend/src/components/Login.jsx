import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ToastContainer({ toasts, onDismiss }) {
  return (
    <div className="fixed right-4 top-20 z-50 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`rounded-xl border px-4 py-3 text-sm shadow-lg ${
            toast.type === 'success'
              ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
              : 'border-rose-300 bg-rose-50 text-rose-700'
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <p className="font-medium">{toast.message}</p>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="text-xs font-semibold text-gray-600 transition hover:text-gray-900"
            >
              Dismiss
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-blue-200/60 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-r from-blue-600 to-purple-600" />
          <span className="bg-gradient-to-r from-blue-700 to-purple-700 bg-clip-text text-sm font-extrabold tracking-wide text-transparent">
            Hotel Service Portal
          </span>
        </div>
        <span className="hidden text-xs font-semibold text-blue-700/80 sm:block">Secure Staff & Guest Access</span>
      </div>
    </header>
  );
}

function LoginForm({ values, onChange, onSubmit, errors, loading }) {
  return (
    <form className="space-y-5" onSubmit={onSubmit} noValidate>
      <div>
        <label htmlFor="identifier" className="mb-1.5 block text-sm font-semibold text-gray-700">
          Email / Username
        </label>
        <input
          id="identifier"
          name="identifier"
          type="text"
          autoComplete="username"
          value={values.identifier}
          onChange={onChange}
          className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          aria-invalid={Boolean(errors.identifier)}
          aria-describedby={errors.identifier ? 'identifier-error' : undefined}
          placeholder="Enter email or username"
        />
        {errors.identifier && (
          <p id="identifier-error" className="mt-1 text-xs text-rose-600">
            {errors.identifier}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-gray-700">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={values.password}
          onChange={onChange}
          className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          aria-invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? 'password-error' : undefined}
          placeholder="Enter password"
        />
        {errors.password && (
          <p id="password-error" className="mt-1 text-xs text-rose-600">
            {errors.password}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="role" className="mb-1.5 block text-sm font-semibold text-gray-700">
          Role
        </label>
        <select
          id="role"
          name="role"
          value={values.role}
          onChange={onChange}
          className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          aria-invalid={Boolean(errors.role)}
          aria-describedby={errors.role ? 'role-error' : undefined}
        >
          <option value="">Select role</option>
          <option value="cleaner">Cleaner</option>
          <option value="maintenance">Maintenance</option>
          <option value="cafeteria">Cafeteria</option>
          <option value="receptionist">Receptionist</option>
          <option value="customer">Customer</option>
        </select>
        {errors.role && (
          <p id="role-error" className="mt-1 text-xs text-rose-600">
            {errors.role}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 hover:shadow-indigo-300 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:from-gray-300 disabled:via-gray-300 disabled:to-gray-300 disabled:shadow-none"
      >
        {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-blue-200" />}
        {loading ? 'Logging in...' : 'Login'}
      </button>

      <div className="text-right">
        <a href="#" className="text-xs font-semibold text-indigo-600 hover:text-purple-600">
          Forgot Password?
        </a>
      </div>
    </form>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formValues, setFormValues] = useState({
    identifier: '',
    password: '',
    role: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);

  const pushToast = (message, type = 'success') => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((previous) => [...previous, { id, message, type }]);
    window.setTimeout(() => {
      setToasts((previous) => previous.filter((toast) => toast.id !== id));
    }, 3500);
  };

  const dismissToast = (id) => {
    setToasts((previous) => previous.filter((toast) => toast.id !== id));
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormValues((previous) => ({
      ...previous,
      [name]: value,
    }));
    setErrors((previous) => ({
      ...previous,
      [name]: '',
    }));
  };

  const validate = () => {
    const nextErrors = {};

    if (!formValues.identifier.trim()) {
      nextErrors.identifier = 'Email or username is required.';
    }

    if (!formValues.password.trim()) {
      nextErrors.password = 'Password is required.';
    }

    if (!formValues.role.trim()) {
      nextErrors.role = 'Please choose a role.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validate()) {
      pushToast('Please correct the highlighted errors.', 'error');
      return;
    }

    try {
      setLoading(true);
      const result = await login({
        identifier: formValues.identifier,
        password: formValues.password,
        role: formValues.role,
      });

      if (!result.success) {
        pushToast(result.message || 'Login failed.', 'error');
        return;
      }

      pushToast('Login successful. Redirecting...', 'success');
      navigate(result.redirectTo, { replace: true });
    } catch {
      pushToast('Unexpected login error. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Navbar />

      <main className="relative mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-4 py-24 sm:px-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.24),_transparent_38%),radial-gradient(circle_at_top_right,_rgba(139,92,246,0.2),_transparent_35%),radial-gradient(circle_at_bottom_left,_rgba(249,115,22,0.18),_transparent_42%),linear-gradient(120deg,_rgba(239,246,255,0.9),_rgba(250,245,255,0.85),_rgba(255,247,237,0.9))]" />

        <section className="relative w-full max-w-md rounded-3xl border border-white/70 bg-white/85 p-6 shadow-2xl shadow-blue-200/60 backdrop-blur-md sm:p-8">
          <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br from-blue-200/60 to-purple-200/60 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-gradient-to-br from-orange-200/60 to-pink-200/50 blur-2xl" />

          <div className="mb-6 text-center">
            <p className="mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-xs font-extrabold uppercase tracking-[0.25em] text-transparent">
              Welcome Back
            </p>
            <h1 className="bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-3xl font-extrabold text-transparent">
              Sign in
            </h1>
            <p className="mt-1 text-sm text-gray-600">Access your hotel operations dashboard.</p>
          </div>

          <LoginForm
            values={formValues}
            onChange={handleChange}
            onSubmit={handleSubmit}
            errors={errors}
            loading={loading}
          />
        </section>
      </main>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}