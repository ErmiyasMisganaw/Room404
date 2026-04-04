import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { API_BASE_URL } from '../services/api';

// ─── Constants ────────────────────────────────────────────────────────────────

const POLL_INTERVAL = 45000; // 45 s
const CHART_COLORS = ['#2d7a3a', '#9bc23c', '#c9b44a', '#c4845a', '#d4186e', '#52ae5e', '#6366f1'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n) {
  if (n == null) return '—';
  return Number(n).toLocaleString();
}

function tsLabel(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// ─── API ──────────────────────────────────────────────────────────────────────

async function fetchSummary(key) {
  const res = await fetch(`${API_BASE_URL}/api/analytics/summary-30d`, {
    headers: { 'x-manager-key': key },
  });
  if (res.status === 403) throw Object.assign(new Error('forbidden'), { status: 403 });
  if (!res.ok) throw Object.assign(new Error('server_error'), { status: res.status });
  return res.json();
}

async function fetchLegacy(key) {
  const res = await fetch(`${API_BASE_URL}/api/analytics`, {
    headers: { 'x-manager-key': key },
  });
  if (!res.ok) return null;
  return res.json();
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded bg-gray-200 ${className}`} />;
}

function KpiSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {[1, 2, 3, 4].map((n) => (
        <div key={n} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <Skeleton className="h-8 w-16 mb-2" />
          <Skeleton className="h-3 w-28" />
        </div>
      ))}
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <Skeleton className="h-4 w-40 mb-4" />
      <Skeleton className="h-52 w-full" />
    </div>
  );
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────

function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-gray-100 bg-white px-3 py-2 text-xs shadow-lg">
      {label && <p className="font-bold text-[#0d2414] mb-1 capitalize">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="text-gray-600 flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: p.color || p.fill }} />
          {p.name}: <span className="font-bold text-[#0d2414]">{fmt(p.value)}</span>
        </p>
      ))}
    </div>
  );
}

// ─── KPI Cards ────────────────────────────────────────────────────────────────

function KpiCard({ label, value, icon, color, textColor }) {
  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${color}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-2xl font-extrabold ${textColor}`}>{fmt(value)}</p>
          <p className="mt-1 text-xs font-semibold text-gray-500">{label}</p>
        </div>
        <span className="text-2xl opacity-70">{icon}</span>
      </div>
    </div>
  );
}

// ─── Key Input Modal ──────────────────────────────────────────────────────────

function KeyModal({ onSubmit }) {
  const [val, setVal] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-7 shadow-2xl">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0d2414] text-xl">🔐</div>
          <div>
            <p className="font-bold text-[#0d2414]">Manager Access</p>
            <p className="text-xs text-gray-400">Enter your manager key to continue</p>
          </div>
        </div>
        <input
          type="password"
          autoFocus
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && val.trim() && onSubmit(val.trim())}
          placeholder="x-manager-key"
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-[#9bc23c] focus:ring-2 focus:ring-[#9bc23c]/20"
        />
        <button
          type="button"
          onClick={() => val.trim() && onSubmit(val.trim())}
          disabled={!val.trim()}
          className="mt-4 w-full rounded-xl bg-[#9bc23c] py-3 text-sm font-bold text-[#0d2414] transition hover:bg-[#b4d655] disabled:opacity-40"
        >
          Unlock Dashboard
        </button>
        <p className="mt-3 text-center text-xs text-gray-400">Default dev key: <code className="font-mono">manager-dev-key</code></p>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function ManagerDashboard() {
  const [key, setKey] = useState(() => sessionStorage.getItem('mgr_key') || '');
  const [showKeyModal, setShowKeyModal] = useState(!sessionStorage.getItem('mgr_key'));
  const [summary, setSummary] = useState(null);
  const [legacy, setLegacy] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | loading | forbidden | error | ok
  const [lastRefresh, setLastRefresh] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const pollRef = useRef(null);

  const load = useCallback(async (k) => {
    if (!k) return;
    setStatus('loading');
    try {
      const [s, l] = await Promise.all([
        fetchSummary(k),
        fetchLegacy(k).catch(() => null),
      ]);
      setSummary(s);
      setLegacy(l);
      setLastRefresh(new Date().toISOString());
      setStatus('ok');
    } catch (err) {
      if (err.status === 403) {
        setStatus('forbidden');
        sessionStorage.removeItem('mgr_key');
      } else {
        setStatus('error');
      }
    }
  }, []);

  // Initial load when key is set
  useEffect(() => {
    if (key && !showKeyModal) load(key);
  }, [key, showKeyModal, load]);

  // Polling
  useEffect(() => {
    if (!autoRefresh || !key || showKeyModal) return;
    pollRef.current = setInterval(() => load(key), POLL_INTERVAL);
    return () => clearInterval(pollRef.current);
  }, [autoRefresh, key, showKeyModal, load]);

  const handleKeySubmit = (k) => {
    sessionStorage.setItem('mgr_key', k);
    setKey(k);
    setShowKeyModal(false);
  };

  const handleRefresh = () => load(key);

  const handleChangeKey = () => {
    sessionStorage.removeItem('mgr_key');
    setKey('');
    setSummary(null);
    setLegacy(null);
    setStatus('idle');
    setShowKeyModal(true);
  };

  // ── Derived chart data ──
  const topFood = (summary?.top_food || []).map((d) => ({ name: d.name, Orders: d.orders }));
  const topStaff = (summary?.top_staff || []).map((d) => ({ name: d.name, Completed: d.completed_tasks }));
  const topMaint = (summary?.top_maintenance_types || []).map((d) => ({ name: d.type, Count: d.count }));
  const byStatus = legacy?.by_status
    ? Object.entries(legacy.by_status).map(([name, value]) => ({ name, value }))
    : [];
  const byCategory = legacy?.by_category
    ? Object.entries(legacy.by_category).map(([name, value]) => ({ name, value }))
    : [];

  const isEmpty = summary &&
    summary.total_tasks === 0 &&
    summary.total_food_orders === 0 &&
    summary.total_maintenance_tasks === 0 &&
    summary.total_cleaner_tasks === 0 &&
    topFood.length === 0 &&
    topStaff.length === 0 &&
    topMaint.length === 0;

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: '#f4f6ed' }}>
      {showKeyModal && <KeyModal onSubmit={handleKeySubmit} />}

      {/* Header */}
      <div className="border-b border-[#9bc23c]/20 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <img src="/kuriftulogo.jpg" alt="Kuriftu" className="h-9 w-9 rounded-xl object-cover" />
            <div>
              <p className="font-bold text-[#0d2414] text-sm leading-tight">Kuriftu Resort</p>
              <p className="text-[10px] text-[#9bc23c] font-semibold uppercase tracking-wider">Manager Analytics</p>
            </div>
            {status === 'ok' && (
              <span className="ml-2 flex items-center gap-1 rounded-full bg-[#9bc23c]/15 px-2.5 py-0.5 text-[10px] font-bold text-[#2d5c10]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#9bc23c]" />
                Secure Mode
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {lastRefresh && (
              <p className="hidden sm:block text-xs text-gray-400">
                Refreshed {tsLabel(lastRefresh)}
              </p>
            )}
            <button
              type="button"
              onClick={() => setAutoRefresh((p) => !p)}
              className={`hidden sm:flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                autoRefresh ? 'border-[#9bc23c]/40 bg-[#9bc23c]/10 text-[#2d5c10]' : 'border-gray-200 text-gray-400'
              }`}
            >
              {autoRefresh ? '⏱ Auto-refresh on' : '⏱ Auto-refresh off'}
            </button>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={status === 'loading'}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:border-[#9bc23c]/40 hover:text-[#0d2414] disabled:opacity-40"
            >
              {status === 'loading'
                ? <span className="h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-[#9bc23c]" />
                : '↻'
              }
              Refresh
            </button>
            <button
              type="button"
              onClick={handleChangeKey}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-500 transition hover:border-red-200 hover:text-red-500"
            >
              🔑 Change Key
            </button>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-6 py-8 space-y-8">

        {/* ── Forbidden ── */}
        {status === 'forbidden' && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-3xl">🚫</div>
            <h2 className="text-lg font-bold text-gray-800">Manager Access Required</h2>
            <p className="mt-2 text-sm text-gray-500 max-w-sm">
              The key you entered was rejected. Please check your manager key and try again.
            </p>
            <button
              type="button"
              onClick={handleChangeKey}
              className="mt-5 rounded-xl bg-[#0d2414] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1a4a22]"
            >
              Enter Key Again
            </button>
          </div>
        )}

        {/* ── Network error ── */}
        {status === 'error' && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-3xl">⚠️</div>
            <h2 className="text-lg font-bold text-gray-800">Backend Unavailable</h2>
            <p className="mt-2 text-sm text-gray-500 max-w-sm">
              Could not reach the server. Make sure the backend is running and try again.
            </p>
            <button
              type="button"
              onClick={handleRefresh}
              className="mt-5 rounded-xl bg-[#0d2414] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1a4a22]"
            >
              Retry
            </button>
          </div>
        )}

        {/* ── Loading skeletons ── */}
        {status === 'loading' && (
          <>
            <KpiSkeleton />
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <ChartSkeleton /><ChartSkeleton /><ChartSkeleton /><ChartSkeleton />
            </div>
          </>
        )}

        {/* ── Empty state ── */}
        {status === 'ok' && isEmpty && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-4 text-4xl">📊</div>
            <h2 className="text-lg font-bold text-gray-700">No Activity in Last 30 Days</h2>
            <p className="mt-2 text-sm text-gray-400">Tasks and orders will appear here once the system is in use.</p>
          </div>
        )}

        {/* ── Data ── */}
        {status === 'ok' && summary && !isEmpty && (
          <>
            {/* Timestamps */}
            {summary.generated_at && (
              <p className="text-xs text-gray-400">
                Data generated at {tsLabel(summary.generated_at)} · Window: last {summary.window_days} days
              </p>
            )}

            {/* KPI cards */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <KpiCard label="Total Tasks (30d)" value={summary.total_tasks} icon="📋" color="bg-[#1d5c28]/5 border-[#1d5c28]/20" textColor="text-[#1d5c28]" />
              <KpiCard label="Food Orders (30d)" value={summary.total_food_orders} icon="🍽️" color="bg-amber-50 border-amber-200" textColor="text-amber-700" />
              <KpiCard label="Maintenance (30d)" value={summary.total_maintenance_tasks} icon="🔧" color="bg-blue-50 border-blue-200" textColor="text-blue-700" />
              <KpiCard label="Cleaner Tasks (30d)" value={summary.total_cleaner_tasks} icon="🧹" color="bg-[#9bc23c]/10 border-[#9bc23c]/30" textColor="text-[#3a6e10]" />
            </div>

            {/* Charts row 1 */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

              {/* Top Food */}
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <h3 className="mb-1 text-sm font-bold text-[#0d2414]">Top Food Orders</h3>
                <p className="mb-4 text-xs text-gray-400">Most ordered items in last 30 days</p>
                {topFood.length === 0 ? (
                  <div className="flex h-48 items-center justify-center text-sm text-gray-400">No food orders yet</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={topFood} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip content={<ChartTip />} cursor={{ fill: '#9bc23c', fillOpacity: 0.08 }} />
                      <Bar dataKey="Orders" radius={[6, 6, 0, 0]} maxBarSize={44}>
                        {topFood.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Top Staff */}
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <h3 className="mb-1 text-sm font-bold text-[#0d2414]">Top Staff Performance</h3>
                <p className="mb-4 text-xs text-gray-400">Completed tasks per staff member</p>
                {topStaff.length === 0 ? (
                  <div className="flex h-48 items-center justify-center text-sm text-gray-400">No staff data yet</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={topStaff} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip content={<ChartTip />} cursor={{ fill: '#9bc23c', fillOpacity: 0.08 }} />
                      <Bar dataKey="Completed" radius={[6, 6, 0, 0]} maxBarSize={44}>
                        {topStaff.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Charts row 2 */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

              {/* Top Maintenance Types */}
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <h3 className="mb-1 text-sm font-bold text-[#0d2414]">Top Maintenance Types</h3>
                <p className="mb-4 text-xs text-gray-400">Most common issue categories</p>
                {topMaint.length === 0 ? (
                  <div className="flex h-48 items-center justify-center text-sm text-gray-400">No maintenance data yet</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={topMaint} dataKey="Count" nameKey="name" cx="50%" cy="50%"
                        innerRadius={50} outerRadius={85} paddingAngle={3} strokeWidth={0}>
                        {topMaint.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Pie>
                      <Tooltip content={<ChartTip />} />
                      <Legend verticalAlign="bottom" iconType="circle" iconSize={8}
                        formatter={(v) => <span className="text-xs text-gray-600">{v}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Legacy: by_status */}
              {byStatus.length > 0 && (
                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                  <h3 className="mb-1 text-sm font-bold text-[#0d2414]">Task Status Breakdown</h3>
                  <p className="mb-4 text-xs text-gray-400">All-time status distribution</p>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={byStatus} dataKey="value" nameKey="name" cx="50%" cy="50%"
                        innerRadius={50} outerRadius={85} paddingAngle={3} strokeWidth={0}>
                        {byStatus.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Pie>
                      <Tooltip content={<ChartTip />} />
                      <Legend verticalAlign="bottom" iconType="circle" iconSize={8}
                        formatter={(v) => <span className="text-xs text-gray-600 capitalize">{v}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Legacy: occupancy + by_category */}
            {legacy && (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Occupancy */}
                {legacy.occupancy_rate != null && (
                  <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold text-[#0d2414]">Hotel Occupancy</h3>
                      <span className="text-2xl font-extrabold text-[#2d7a3a]">{legacy.occupancy_rate}%</span>
                    </div>
                    <div className="h-4 overflow-hidden rounded-full bg-gray-100">
                      <div className="h-4 rounded-full bg-gradient-to-r from-[#2d7a3a] via-[#9bc23c] to-[#b4d655] transition-all duration-1000"
                        style={{ width: `${legacy.occupancy_rate}%` }} />
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                      {[
                        { label: 'Total Rooms', value: legacy.total_rooms },
                        { label: 'Occupied', value: legacy.occupied_rooms },
                        { label: 'Need Cleaning', value: legacy.cleaning_needed },
                      ].map((s) => (
                        <div key={s.label} className="rounded-xl bg-gray-50 p-3">
                          <p className="text-lg font-bold text-[#0d2414]">{fmt(s.value)}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{s.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* By category */}
                {byCategory.length > 0 && (
                  <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <h3 className="mb-1 text-sm font-bold text-[#0d2414]">Requests by Category</h3>
                    <p className="mb-4 text-xs text-gray-400">All-time breakdown</p>
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={byCategory} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip content={<ChartTip />} cursor={{ fill: '#9bc23c', fillOpacity: 0.08 }} />
                        <Bar dataKey="value" name="Tasks" radius={[6, 6, 0, 0]} maxBarSize={44}>
                          {byCategory.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )}

            {/* Top lists table */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {[
                { title: 'Top Food Items', rows: summary.top_food, cols: ['name', 'orders'], labels: ['Item', 'Orders'] },
                { title: 'Top Staff', rows: summary.top_staff, cols: ['name', 'completed_tasks'], labels: ['Staff', 'Completed'] },
                { title: 'Maintenance Types', rows: summary.top_maintenance_types, cols: ['type', 'count'], labels: ['Type', 'Count'] },
              ].map((tbl) => (
                <div key={tbl.title} className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                  <div className="border-b border-gray-50 px-5 py-3">
                    <h3 className="text-sm font-bold text-[#0d2414]">{tbl.title}</h3>
                  </div>
                  {!tbl.rows?.length ? (
                    <div className="px-5 py-8 text-center text-xs text-gray-400">No data</div>
                  ) : (
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-gray-50">
                          {tbl.labels.map((l) => (
                            <th key={l} className="px-5 py-2 text-left font-semibold text-gray-400 uppercase tracking-wider">{l}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {tbl.rows.map((row, i) => (
                          <tr key={i} className="hover:bg-gray-50 transition">
                            {tbl.cols.map((col) => (
                              <td key={col} className="px-5 py-3 font-medium text-[#0d2414]">{fmt(row[col])}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
