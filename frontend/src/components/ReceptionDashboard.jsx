import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar, { Icon } from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../hooks/useWebSocket';
import { apiGet, apiPost, API_BASE_URL } from '../services/api';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const API = `${API_BASE_URL}/api`;

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ toasts, onDismiss }) {
  return (
    <div className="fixed right-4 top-4 z-50 flex max-w-sm flex-col gap-2">
      {toasts.map((t) => (
        <div key={t.id} className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm shadow-xl ${
          t.type === 'success' ? 'border-[#9bc23c]/40 bg-[#9bc23c]/10 text-[#2d5c10]' : 'border-[#d4186e]/40 bg-[#d4186e]/10 text-[#8a0040]'
        }`}>
          <p className="font-medium">{t.message}</p>
          <button type="button" onClick={() => onDismiss(t.id)} className="text-xs opacity-60 hover:opacity-100">✕</button>
        </div>
      ))}
    </div>
  );
}

function PageHeader({ title, subtitle, icon, actions, wsConnected }) {
  return (
    <div className="flex items-center justify-between border-b border-[#9bc23c]/20 bg-white/80 px-6 py-4 backdrop-blur-sm sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1d5c28]/10 text-[#1d5c28]">
          {icon}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-[#0d2414]">{title}</h1>
            {wsConnected !== undefined && (
              <span className={`flex h-2 w-2 rounded-full ${wsConnected ? 'bg-[#9bc23c] animate-pulse-glow' : 'bg-gray-300'}`} title={wsConnected ? 'Live' : 'Offline'} />
            )}
          </div>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

// ── Room data ─────────────────────────────────────────────────────────────────

const initialRooms = [
  { roomNumber: '101', type: 'Single', status: 'Available',       assignedCustomer: '-' },
  { roomNumber: '102', type: 'Single', status: 'Occupied',        assignedCustomer: 'Marta B.' },
  { roomNumber: '103', type: 'Single', status: 'Cleaning Needed', assignedCustomer: '-' },
  { roomNumber: '201', type: 'Double', status: 'Available',       assignedCustomer: '-' },
  { roomNumber: '202', type: 'Double', status: 'Occupied',        assignedCustomer: 'Daniel K.' },
  { roomNumber: '203', type: 'Double', status: 'Available',       assignedCustomer: '-' },
  { roomNumber: '210', type: 'Double', status: 'Occupied',        assignedCustomer: 'Mikal D.' },
  { roomNumber: '212', type: 'Double', status: 'Occupied',        assignedCustomer: 'Ruth G.' },
  { roomNumber: '301', type: 'Suite',  status: 'Cleaning Needed', assignedCustomer: '-' },
  { roomNumber: '302', type: 'Suite',  status: 'Available',       assignedCustomer: '-' },
  { roomNumber: '303', type: 'Suite',  status: 'Occupied',        assignedCustomer: 'Aster M.' },
  { roomNumber: '401', type: 'Suite',  status: 'Available',       assignedCustomer: '-' },
];

function useRooms() {
  const [rooms, setRooms] = useState(initialRooms);

  const assignRoom = ({ roomNumber, customerName }) => {
    setRooms((prev) =>
      prev.map((r) => r.roomNumber !== roomNumber ? r : { ...r, status: 'Occupied', assignedCustomer: customerName })
    );
  };

  const updateRoomStatus = useCallback((roomNumber, newStatus) => {
    setRooms((prev) =>
      prev.map((r) =>
        r.roomNumber !== roomNumber ? r : {
          ...r,
          status: newStatus,
          assignedCustomer: newStatus === 'Cleaning Needed' ? '-' : r.assignedCustomer,
        }
      )
    );
  }, []);

  return { rooms, assignRoom, updateRoomStatus };
}

// ── Status configs ────────────────────────────────────────────────────────────

const statusCfg = {
  Available:       { bg: 'bg-[#9bc23c]/15', border: 'border-[#9bc23c]/40', text: 'text-[#3a6e10]', dot: 'bg-[#9bc23c]', badge: 'bg-[#9bc23c]/10 border-[#9bc23c]/30 text-[#3a6e10]' },
  Occupied:        { bg: 'bg-[#c4845a]/10', border: 'border-[#c4845a]/40', text: 'text-[#8a4a20]', dot: 'bg-[#c4845a]', badge: 'bg-[#c4845a]/10 border-[#c4845a]/30 text-[#8a4a20]' },
  'Cleaning Needed':{ bg: 'bg-amber-50',    border: 'border-amber-200',     text: 'text-amber-700', dot: 'bg-amber-400', badge: 'bg-amber-50 border-amber-200 text-amber-700' },
  Maintenance:     { bg: 'bg-[#d4186e]/5',  border: 'border-[#d4186e]/30',  text: 'text-[#d4186e]', dot: 'bg-[#d4186e]', badge: 'bg-[#d4186e]/5 border-[#d4186e]/25 text-[#d4186e]' },
};

function StatusBadge({ status }) {
  const c = statusCfg[status] || { badge: 'bg-gray-100 border-gray-200 text-gray-600', dot: 'bg-gray-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${c.badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
      {status}
    </span>
  );
}

// ── Room Heatmap Section ──────────────────────────────────────────────────────

function HeatmapSection({ rooms, wsConnected, pushToast, onCheckout }) {
  const [checkoutLoading, setCheckoutLoading] = useState('');

  const handleCheckout = async (roomNumber) => {
    try {
      setCheckoutLoading(roomNumber);
      await apiPost(`/api/rooms/${roomNumber}/checkout`, {});
      onCheckout?.(roomNumber, 'Cleaning Needed');
      pushToast(`Room ${roomNumber} checked out — cleaning task created.`, 'success');
    } catch (error) {
      const detail = typeof error?.message === 'string' ? error.message : '';
      pushToast(detail || 'Checkout failed.', 'error');
    } finally {
      setCheckoutLoading('');
    }
  };

  const legend = [
    ['Available', '#9bc23c'],
    ['Occupied', '#c4845a'],
    ['Cleaning Needed', '#f59e0b'],
    ['Maintenance', '#d4186e'],
  ];

  return (
    <div>
      <PageHeader
        title="Room Overview"
        subtitle={`${rooms.length} rooms · Live status`}
        icon={Icon.grid}
        wsConnected={wsConnected}
      />
      <div className="p-6">
        {/* Legend */}
        <div className="mb-5 flex flex-wrap gap-3">
          {legend.map(([label, color]) => (
            <span key={label} className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
              {label}
            </span>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6 stagger-children">
          {rooms.map((room) => {
            const c = statusCfg[room.status] || { bg: 'bg-gray-100', border: 'border-gray-200', text: 'text-gray-700' };
            return (
              <div
                key={room.roomNumber}
                className={`rounded-2xl border-2 p-3 text-center transition hover:scale-105 hover:shadow-md ${c.bg} ${c.border}`}
              >
                <p className={`text-sm font-extrabold ${c.text}`}>{room.roomNumber}</p>
                <p className="mt-0.5 text-[10px] text-gray-500">{room.type}</p>
                {room.status === 'Occupied' && room.assignedCustomer !== '-' && (
                  <p className="mt-1 text-[9px] text-gray-500 truncate">{room.assignedCustomer}</p>
                )}
                {room.status === 'Occupied' && (
                  <button
                    type="button"
                    onClick={() => handleCheckout(room.roomNumber)}
                    disabled={checkoutLoading === room.roomNumber}
                    className="mt-2 w-full rounded-lg bg-[#c4845a] px-1 py-1 text-[10px] font-bold text-white transition hover:bg-[#b07248] disabled:opacity-50"
                  >
                    {checkoutLoading === room.roomNumber ? '…' : 'Checkout'}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Summary row */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 stagger-children">
          {[
            { label: 'Total',    value: rooms.length,                                              color: 'bg-[#1d5c28]/5 border-[#1d5c28]/20',    text: 'text-[#1d5c28]' },
            { label: 'Available', value: rooms.filter((r) => r.status === 'Available').length,    color: 'bg-[#9bc23c]/10 border-[#9bc23c]/30',   text: 'text-[#3a6e10]' },
            { label: 'Occupied',  value: rooms.filter((r) => r.status === 'Occupied').length,     color: 'bg-[#c4845a]/10 border-[#c4845a]/30',   text: 'text-[#8a4a20]' },
            { label: 'Cleaning',  value: rooms.filter((r) => r.status === 'Cleaning Needed').length, color: 'bg-amber-50 border-amber-200',       text: 'text-amber-700' },
          ].map((s) => (
            <div key={s.label} className={`rounded-2xl border p-4 text-center ${s.color}`}>
              <p className={`text-2xl font-extrabold ${s.text}`}>{s.value}</p>
              <p className="text-xs font-semibold text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Assign Room Section ───────────────────────────────────────────────────────

function AssignSection({ rooms, onAssign, pushToast }) {
  const [form, setForm] = useState({ customerName: '', checkInDate: '', checkOutDate: '', roomType: 'Single' });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError('');
    setResult(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    if (!form.customerName.trim()) { setError('Guest name is required.'); return; }
    if (!form.checkInDate) { setError('Check-in date is required.'); return; }
    if (!form.checkOutDate) { setError('Check-out date is required.'); return; }
    const available = rooms.find((r) => r.status === 'Available' && r.type === form.roomType);
    if (!available) { setError(`No ${form.roomType} room is currently available.`); return; }
    try {
      setLoading(true);
      await new Promise((r) => setTimeout(r, 900));
      const username = form.customerName.trim().toLowerCase().replace(/\s+/g, '.') + available.roomNumber;
      const password = Math.random().toString(36).slice(-10);
      onAssign({ roomNumber: available.roomNumber, customerName: form.customerName.trim() });
      setResult({ roomNumber: available.roomNumber, username, password, customerName: form.customerName.trim(), checkIn: form.checkInDate, checkOut: form.checkOutDate, type: form.roomType });
      setForm((prev) => ({ ...prev, customerName: '', checkInDate: '', checkOutDate: '' }));
      pushToast(`Room ${available.roomNumber} assigned to ${form.customerName.trim()}.`, 'success');
    } catch {
      pushToast('Assignment failed. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const availableCount = rooms.filter((r) => r.status === 'Available' && r.type === form.roomType).length;

  const fieldCls = (hasError) => `w-full rounded-xl border bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-300 focus:ring-2 ${
    hasError ? 'border-red-300 focus:ring-red-100' : 'border-gray-200 focus:border-[#9bc23c]/60 focus:ring-[#9bc23c]/10'
  }`;

  return (
    <div>
      <PageHeader title="Guest Check-In" subtitle="Assign accommodation & generate access credentials" icon={Icon.userPlus} />
      <div className="p-6" style={{ backgroundColor: '#f9fafb', minHeight: 'calc(100vh - 64px)' }}>
        <div className="mx-auto max-w-3xl">

          {/* Available rooms summary */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {['Single', 'Double', 'Suite'].map((type) => {
              const count = rooms.filter((r) => r.status === 'Available' && r.type === type).length;
              return (
                <div key={type} className="rounded-2xl bg-white border border-gray-100 p-4 shadow-sm text-center">
                  <p className="text-2xl font-bold" style={{ color: count > 0 ? '#1d5c28' : '#d4186e' }}>{count}</p>
                  <p className="text-xs text-gray-400 mt-0.5 uppercase tracking-wider">{type}</p>
                  <p className="text-[10px] mt-1" style={{ color: count > 0 ? '#9bc23c' : '#d4186e' }}>
                    {count > 0 ? 'Available' : 'Full'}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">

            {/* Form — wider */}
            <div className="lg:col-span-3">
              <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-50">
                  <h2 className="font-semibold text-gray-900" style={{ fontFamily: 'Georgia, serif' }}>New Guest Registration</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Fill in guest details to assign a room</p>
                </div>

                <form className="px-6 py-5 space-y-4" onSubmit={handleSubmit}>
                  {/* Guest name */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400 mb-2">
                      Guest Full Name
                    </label>
                    <input type="text" name="customerName" value={form.customerName} onChange={handleChange}
                      placeholder="e.g. Marta Bekele" className={fieldCls(false)} />
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400 mb-2">
                        Check-in
                      </label>
                      <input type="date" name="checkInDate" value={form.checkInDate} onChange={handleChange}
                        className={fieldCls(false)} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400 mb-2">
                        Check-out
                      </label>
                      <input type="date" name="checkOutDate" value={form.checkOutDate} onChange={handleChange}
                        className={fieldCls(false)} />
                    </div>
                  </div>

                  {/* Room type */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400 mb-2">
                      Room Type
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {['Single', 'Double', 'Suite'].map((type) => {
                        const cnt = rooms.filter((r) => r.status === 'Available' && r.type === type).length;
                        return (
                          <button key={type} type="button"
                            onClick={() => { setForm((p) => ({ ...p, roomType: type })); setError(''); }}
                            className={`rounded-xl border py-2.5 text-xs font-semibold transition-all ${
                              form.roomType === type
                                ? 'border-[#1d5c28] bg-[#1d5c28] text-white shadow-sm'
                                : cnt > 0
                                  ? 'border-gray-200 bg-white text-gray-600 hover:border-[#9bc23c]/50'
                                  : 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
                            }`}
                            disabled={cnt === 0}>
                            {type}
                            <span className={`block text-[10px] mt-0.5 font-normal ${form.roomType === type ? 'text-white/70' : 'text-gray-400'}`}>
                              {cnt} free
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-600">
                      {error}
                    </div>
                  )}

                  <button type="submit" disabled={loading || availableCount === 0}
                    className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                    style={{ backgroundColor: '#1d5c28' }}>
                    {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
                    {loading ? 'Assigning…' : 'Assign Room & Generate Credentials'}
                  </button>
                </form>
              </div>
            </div>

            {/* Result / info panel */}
            <div className="lg:col-span-2 space-y-4">
              {result ? (
                <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#9bc23c]/15">
                      <svg className="h-3.5 w-3.5 text-[#1d5c28]" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">Room Assigned</p>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {[
                      { label: 'Guest', value: result.customerName },
                      { label: 'Room', value: `#${result.roomNumber} · ${result.type}` },
                      { label: 'Check-in', value: result.checkIn },
                      { label: 'Check-out', value: result.checkOut },
                    ].map((s) => (
                      <div key={s.label} className="flex items-center justify-between px-5 py-3">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider">{s.label}</p>
                        <p className="text-xs font-semibold text-gray-900">{s.value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="px-5 py-4 bg-[#f9fafb] border-t border-gray-50">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-3">Login Credentials</p>
                    <div className="space-y-2">
                      {[
                        { label: 'Username', value: result.username },
                        { label: 'Password', value: result.password },
                      ].map((c) => (
                        <div key={c.label} className="flex items-center justify-between rounded-lg bg-white border border-gray-100 px-3 py-2.5">
                          <p className="text-[10px] text-gray-400">{c.label}</p>
                          <p className="font-mono text-xs font-bold text-gray-900">{c.value}</p>
                        </div>
                      ))}
                    </div>
                    <p className="mt-3 text-[10px] text-gray-400 leading-relaxed">
                      Share these credentials with the guest. Password should be changed on first login.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-4">Quick Guide</p>
                  <div className="space-y-3">
                    {[
                      { step: '1', text: 'Enter the guest\'s full name' },
                      { step: '2', text: 'Set check-in and check-out dates' },
                      { step: '3', text: 'Select preferred room type' },
                      { step: '4', text: 'Click assign to generate credentials' },
                    ].map((s) => (
                      <div key={s.step} className="flex items-start gap-3">
                        <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white mt-0.5"
                          style={{ backgroundColor: '#9bc23c' }}>{s.step}</div>
                        <p className="text-xs text-gray-500 leading-relaxed">{s.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Room Lookup Section ───────────────────────────────────────────────────────

function LookupSection({ rooms }) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return rooms.filter((r) =>
      r.roomNumber.toLowerCase().includes(s) &&
      (typeFilter === 'All' || r.type === typeFilter) &&
      (statusFilter === 'All' || r.status === statusFilter)
    );
  }, [rooms, search, typeFilter, statusFilter]);

  const inputCls = 'rounded-xl border border-[#9bc23c]/30 bg-white px-3 py-2 text-sm outline-none transition focus:border-[#2d7a3a] focus:ring-4 focus:ring-[#9bc23c]/15';

  return (
    <div>
      <PageHeader title="Room Lookup" subtitle="Search and filter all rooms" icon={Icon.search} />
      <div className="p-6">
        {/* Filters */}
        <div className="mb-5 flex flex-wrap gap-3">
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search room #…" className={`${inputCls} w-36`} />
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className={inputCls}>
            <option value="All">All Types</option>
            <option value="Single">Single</option>
            <option value="Double">Double</option>
            <option value="Suite">Suite</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={inputCls}>
            <option value="All">All Status</option>
            <option value="Available">Available</option>
            <option value="Occupied">Occupied</option>
            <option value="Cleaning Needed">Cleaning Needed</option>
            <option value="Maintenance">Maintenance</option>
          </select>
          <span className="flex items-center text-xs text-gray-500 font-medium">
            {filtered.length} room{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-[#9bc23c]/20 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#9bc23c]/10 text-sm">
              <thead className="bg-[#1d5c28]/5">
                <tr>
                  {['Room', 'Type', 'Status', 'Guest'].map((h) => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wide text-[#1d5c28]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#9bc23c]/10">
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-10 text-center text-sm text-gray-500">No rooms match your filters.</td>
                  </tr>
                )}
                {filtered.map((room) => (
                  <tr key={room.roomNumber} className="transition hover:bg-[#9bc23c]/5">
                    <td className="px-5 py-3.5 font-bold text-[#0d2414]">#{room.roomNumber}</td>
                    <td className="px-5 py-3.5 text-gray-600">{room.type}</td>
                    <td className="px-5 py-3.5"><StatusBadge status={room.status} /></td>
                    <td className="px-5 py-3.5 text-gray-600">{room.assignedCustomer || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Chart helpers ─────────────────────────────────────────────────────────────

const CHART_COLORS = ['#2d7a3a', '#9bc23c', '#c9b44a', '#c4845a', '#d4186e', '#52ae5e'];
const STATUS_COLORS = { pending: '#f59e0b', in_progress: '#9bc23c', completed: '#2d7a3a', cancelled: '#d4186e' };

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[#9bc23c]/20 bg-white px-3 py-2 text-xs shadow-lg">
      {label && <p className="font-semibold text-[#0d2414] capitalize mb-1">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="text-gray-600">
          <span className="inline-block h-2 w-2 rounded-full mr-1.5" style={{ backgroundColor: p.color || p.fill }} />
          {p.name || 'Value'}: <span className="font-bold text-[#0d2414]">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

// ── Analytics Section ─────────────────────────────────────────────────────────

function AnalyticsSection({ rooms }) {
  const [data, setData] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [res, lb] = await Promise.all([
          Promise.resolve(null), // analytics removed — use /manager for analytics
          apiGet('/api/staff/leaderboard').catch(() => []),
        ]);
        setData(res);
        setLeaderboard(Array.isArray(lb) ? lb : lb?.staff || []);
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const id = setInterval(fetchData, 15000);
    return () => clearInterval(id);
  }, []);

  const roomStats = useMemo(() => ({
    total: rooms.length,
    available: rooms.filter((r) => r.status === 'Available').length,
    occupied: rooms.filter((r) => r.status === 'Occupied').length,
    cleaning: rooms.filter((r) => r.status === 'Cleaning Needed').length,
    maintenance: rooms.filter((r) => r.status === 'Maintenance').length,
  }), [rooms]);

  const occupancyPct = roomStats.total > 0 ? Math.round((roomStats.occupied / roomStats.total) * 100) : 0;

  // Chart data
  const roomPieData = [
    { name: 'Available', value: roomStats.available, fill: '#9bc23c' },
    { name: 'Occupied', value: roomStats.occupied, fill: '#c4845a' },
    { name: 'Cleaning', value: roomStats.cleaning, fill: '#f59e0b' },
    { name: 'Maintenance', value: roomStats.maintenance, fill: '#d4186e' },
  ].filter((d) => d.value > 0);

  const categoryData = data?.by_category
    ? Object.entries(data.by_category).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }))
    : [];

  const statusData = data?.by_status
    ? Object.entries(data.by_status).map(([name, value]) => ({ name, value, fill: STATUS_COLORS[name] || '#96d49e' }))
    : [];

  return (
    <div>
      <PageHeader title="Analytics" subtitle="Live hotel performance dashboard" icon={Icon.analytics} />
      <div className="p-6 space-y-6">
        {/* Room stats cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5 stagger-children">
          {[
            { label: 'Total', value: roomStats.total, color: 'bg-[#1d5c28]/5 border-[#1d5c28]/20', text: 'text-[#1d5c28]' },
            { label: 'Available', value: roomStats.available, color: 'bg-[#9bc23c]/10 border-[#9bc23c]/30', text: 'text-[#3a6e10]' },
            { label: 'Occupied', value: roomStats.occupied, color: 'bg-[#c4845a]/10 border-[#c4845a]/30', text: 'text-[#8a4a20]' },
            { label: 'Cleaning', value: roomStats.cleaning, color: 'bg-amber-50 border-amber-200', text: 'text-amber-700' },
            { label: 'Occupancy', value: `${occupancyPct}%`, color: 'bg-[#d4186e]/5 border-[#d4186e]/20', text: 'text-[#d4186e]' },
          ].map((s) => (
            <div key={s.label} className={`rounded-2xl border p-4 ${s.color}`}>
              <p className={`text-2xl font-extrabold ${s.text}`}>{s.value}</p>
              <p className="mt-1 text-xs font-semibold text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Room status donut + Occupancy gauge */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-[#9bc23c]/20 bg-white p-5 animate-fade-in-up">
            <h3 className="mb-2 text-sm font-bold text-[#0d2414]">Room Distribution</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={roomPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value" strokeWidth={0}>
                  {roomPieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend verticalAlign="bottom" iconType="circle" iconSize={8} formatter={(v) => <span className="text-xs text-gray-600">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-2xl border border-[#9bc23c]/20 bg-white p-5 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-[#0d2414]">Room Occupancy</h3>
              <span className="text-2xl font-extrabold text-[#2d7a3a]">{occupancyPct}%</span>
            </div>
            <div className="h-4 overflow-hidden rounded-full bg-[#f4f6ed]">
              <div className="h-4 rounded-full bg-gradient-to-r from-[#1d5c28] via-[#9bc23c] to-[#b4d655] transition-all duration-1000" style={{ width: `${occupancyPct}%` }} />
            </div>
            <div className="mt-2 flex justify-between text-[10px] text-gray-400 font-medium">
              <span>0%</span><span>50%</span><span>100%</span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-[#f4f6ed] p-3 text-center">
                <p className="text-lg font-bold text-[#3a6e10]">{roomStats.available}</p>
                <p className="text-[10px] text-gray-500 font-medium">Available</p>
              </div>
              <div className="rounded-xl bg-[#f4f6ed] p-3 text-center">
                <p className="text-lg font-bold text-[#8a4a20]">{roomStats.occupied}</p>
                <p className="text-[10px] text-gray-500 font-medium">Occupied</p>
              </div>
              <div className="rounded-xl bg-[#f4f6ed] p-3 text-center">
                <p className="text-lg font-bold text-amber-600">{roomStats.cleaning}</p>
                <p className="text-[10px] text-gray-500 font-medium">Cleaning</p>
              </div>
            </div>
          </div>
        </div>

        {loading && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {[1, 2].map((n) => (
              <div key={n} className="rounded-2xl border border-[#9bc23c]/10 bg-white p-5">
                <div className="skeleton h-4 w-40 mb-4" />
                <div className="skeleton h-48 w-full" />
              </div>
            ))}
          </div>
        )}

        {!loading && !data && (
          <div className="animate-fade-in-up rounded-2xl border border-dashed border-[#9bc23c]/40 bg-white py-10 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#9bc23c]/10">
              <svg className="h-7 w-7 text-[#9bc23c]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-gray-600">Start the backend to see live analytics</p>
          </div>
        )}

        {!loading && data && (
          <>
            {/* Task stats */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 stagger-children">
              {[
                { label: 'Total Tasks', value: data.total_tasks, color: 'bg-[#1d5c28]/5 border-[#1d5c28]/20', text: 'text-[#1d5c28]' },
                { label: 'Occupancy Rate', value: `${data.occupancy_rate}%`, color: 'bg-[#9bc23c]/10 border-[#9bc23c]/30', text: 'text-[#3a6e10]' },
                { label: 'Need Cleaning', value: data.cleaning_needed || 0, color: 'bg-amber-50 border-amber-200', text: 'text-amber-700' },
                { label: 'Top Request', value: data.most_requested || '—', color: 'bg-[#d4186e]/5 border-[#d4186e]/20', text: 'text-[#d4186e] text-sm' },
              ].map((s) => (
                <div key={s.label} className={`rounded-2xl border p-4 ${s.color}`}>
                  <p className={`text-2xl font-extrabold truncate ${s.text}`}>{s.value}</p>
                  <p className="mt-1 text-xs font-semibold text-gray-500">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {categoryData.length > 0 && (
                <div className="rounded-2xl border border-[#9bc23c]/20 bg-white p-5 animate-fade-in-up">
                  <h3 className="mb-4 text-sm font-bold text-[#0d2414]">Requests by Category</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={categoryData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e8edd8" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip content={<ChartTooltip />} cursor={{ fill: '#9bc23c', fillOpacity: 0.08 }} />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={40}>
                        {categoryData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {statusData.length > 0 && (
                <div className="rounded-2xl border border-[#9bc23c]/20 bg-white p-5 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                  <h3 className="mb-4 text-sm font-bold text-[#0d2414]">Task Status</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value" strokeWidth={0}>
                        {statusData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                      </Pie>
                      <Tooltip content={<ChartTooltip />} />
                      <Legend verticalAlign="bottom" iconType="circle" iconSize={8} formatter={(v) => <span className="text-xs text-gray-600 capitalize">{v}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </>
        )}

        {/* Staff leaderboard */}
        {leaderboard.length > 0 && (
          <div className="rounded-2xl border border-[#9bc23c]/20 bg-white p-5 animate-fade-in-up">
            <h3 className="mb-4 text-sm font-bold text-[#0d2414]">Staff Leaderboard</h3>
            <div className="space-y-2">
              {leaderboard.slice(0, 8).map((staff, i) => (
                <div key={staff.id || i} className="flex items-center gap-3 rounded-xl bg-[#f4f6ed] px-4 py-3">
                  <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold flex-shrink-0 ${
                    i === 0 ? 'bg-[#c9b44a] text-white' : i === 1 ? 'bg-gray-400 text-white' : i === 2 ? 'bg-[#c4845a] text-white' : 'bg-gray-200 text-gray-600'
                  }`}>{i + 1}</span>
                  <p className="flex-1 text-sm font-semibold text-gray-800">{staff.name}</p>
                  <span className="rounded-full bg-white border border-[#9bc23c]/20 px-2.5 py-1 text-[10px] font-semibold text-gray-500">{staff.pool}</span>
                  <p className="text-xs font-bold text-[#1d5c28] w-16 text-right">{staff.completed_task_count ?? staff.completed ?? 0} done</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

const NAV = [
  { key: 'heatmap',   label: 'Room Overview', icon: Icon.grid },
  { key: 'assign',    label: 'Assign Room',   icon: Icon.userPlus },
  { key: 'lookup',    label: 'Room Lookup',   icon: Icon.search },
  { key: 'analytics', label: 'Analytics',     icon: Icon.analytics },
];

export default function ReceptionDashboard() {
  const navigate = useNavigate();
  const { user: authUser, logout } = useAuth();
  const user = authUser || { id: 'RC-001', name: 'Front Desk', role: 'receptionist' };
  const [activeSection, setActiveSection] = useState('heatmap');
  const [toasts, setToasts] = useState([]);

  const { rooms, assignRoom, updateRoomStatus } = useRooms();

  const pushToast = (message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  };

  // WebSocket: listen for room checkout events
  const { connected: wsConnected } = useWebSocket(
    useCallback((event) => {
      if (event.type === 'room_checkout') {
        updateRoomStatus(event.data.room_number, 'Cleaning Needed');
        pushToast(`Room ${event.data.room_number} checked out — cleaning task created.`, 'success');
      }
    }, [updateRoomStatus])
  );

  const handleLogout = async () => {
    try {
      await logout?.();
    } finally {
      navigate('/login', { replace: true });
    }
  };

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#f4f6ed' }}>
      <Sidebar
        navItems={NAV}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        user={user}
        onLogout={handleLogout}
      />
      <main className="flex-1 lg:ml-64 min-h-screen" key={activeSection}>
        <div className="animate-fade-in">
          {activeSection === 'heatmap'   && <HeatmapSection rooms={rooms} wsConnected={wsConnected} pushToast={pushToast} onCheckout={updateRoomStatus} />}
          {activeSection === 'assign'    && <AssignSection rooms={rooms} onAssign={assignRoom} pushToast={pushToast} />}
          {activeSection === 'lookup'    && <LookupSection rooms={rooms} />}
          {activeSection === 'analytics' && <AnalyticsSection rooms={rooms} />}
        </div>
      </main>

      <Toast toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
    </div>
  );
}
