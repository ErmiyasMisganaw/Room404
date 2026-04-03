import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';

const API = 'http://localhost:8000/api';

const AuthContext = createContext({
  user: { name: 'Front Desk Agent', role: 'Receptionist' },
  logout: () => {},
});

const initialRooms = [
  { roomNumber: '101', type: 'Single', status: 'Available',        assignedCustomer: '-' },
  { roomNumber: '102', type: 'Single', status: 'Occupied',         assignedCustomer: 'Marta B.' },
  { roomNumber: '103', type: 'Single', status: 'Cleaning Needed',  assignedCustomer: '-' },
  { roomNumber: '201', type: 'Double', status: 'Available',        assignedCustomer: '-' },
  { roomNumber: '202', type: 'Double', status: 'Occupied',         assignedCustomer: 'Daniel K.' },
  { roomNumber: '203', type: 'Double', status: 'Available',        assignedCustomer: '-' },
  { roomNumber: '210', type: 'Double', status: 'Occupied',         assignedCustomer: 'Mikal D.' },
  { roomNumber: '212', type: 'Double', status: 'Occupied',         assignedCustomer: 'Ruth G.' },
  { roomNumber: '301', type: 'Suite',  status: 'Cleaning Needed',  assignedCustomer: '-' },
  { roomNumber: '302', type: 'Suite',  status: 'Available',        assignedCustomer: '-' },
  { roomNumber: '303', type: 'Suite',  status: 'Occupied',         assignedCustomer: 'Aster M.' },
  { roomNumber: '401', type: 'Suite',  status: 'Available',        assignedCustomer: '-' },
];

function useAuth() { return useContext(AuthContext); }

function useRooms() {
  const [rooms, setRooms] = useState(initialRooms);

  const assignRoom = ({ roomNumber, customerName }) => {
    setRooms((prev) => prev.map((r) => r.roomNumber !== roomNumber ? r : { ...r, status: 'Occupied', assignedCustomer: customerName }));
  };

  const updateRoomStatus = useCallback((roomNumber, newStatus) => {
    setRooms((prev) => prev.map((r) => r.roomNumber !== roomNumber ? r : { ...r, status: newStatus, assignedCustomer: newStatus === 'Cleaning Needed' ? '-' : r.assignedCustomer }));
  }, []);

  return { rooms, assignRoom, updateRoomStatus };
}

function useCustomerRegistration() {
  const registerCustomer = async ({ customerName, checkInDate, checkOutDate, roomNumber }) => {
    await new Promise((r) => setTimeout(r, 900));
    const username = customerName.trim().toLowerCase().replace(/\s+/g, '.') + roomNumber;
    const password = Math.random().toString(36).slice(-10);
    return { username, password, customerName, checkInDate, checkOutDate, roomNumber };
  };
  return { registerCustomer };
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ToastContainer({ toasts, onDismiss }) {
  return (
    <div className="fixed right-4 top-20 z-50 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
      {toasts.map((t) => (
        <div key={t.id} className={`rounded-xl border px-4 py-3 text-sm shadow-lg ${t.type === 'success' ? 'border-green-200 bg-green-50 text-green-700' : 'border-orange-200 bg-orange-50 text-orange-700'}`}>
          <div className="flex items-start justify-between gap-2">
            <p className="font-medium">{t.message}</p>
            <button type="button" className="text-xs font-semibold text-gray-600 transition hover:text-gray-900" onClick={() => onDismiss(t.id)}>Dismiss</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function Navbar({ receptionist, roomStats, onLogout, wsConnected }) {
  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Reception Dashboard</h1>
          <p className="text-sm text-gray-600 flex items-center gap-2">
            {receptionist?.name} • {receptionist?.role}
            <span className={`h-2 w-2 rounded-full ${wsConnected ? 'bg-green-400' : 'bg-gray-300'}`} />
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <StatCard label="Total" value={roomStats.totalRooms} />
          <StatCard label="Available" value={roomStats.availableRooms} />
          <StatCard label="Occupied" value={roomStats.occupiedRooms} />
        </div>
        <button type="button" onClick={onLogout} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-blue-500">Logout</button>
      </div>
    </header>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-center shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="text-lg font-bold text-gray-900">{value}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  const cls = { Available: 'bg-green-100 text-green-700 border-green-200', Occupied: 'bg-orange-100 text-orange-700 border-orange-200', 'Cleaning Needed': 'bg-yellow-100 text-yellow-700 border-yellow-200', Maintenance: 'bg-red-100 text-red-700 border-red-200' };
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${cls[status] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>{status}</span>;
}

// Room heatmap grid
function RoomHeatmap({ rooms, onCheckout, checkoutLoading }) {
  const statusColor = {
    Available:       'bg-green-100 border-green-300 text-green-800 hover:bg-green-200',
    Occupied:        'bg-orange-100 border-orange-300 text-orange-800 hover:bg-orange-200',
    'Cleaning Needed': 'bg-yellow-100 border-yellow-300 text-yellow-800 hover:bg-yellow-200',
    Maintenance:     'bg-red-100 border-red-300 text-red-800 hover:bg-red-200',
  };

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-lg">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Room Heatmap</h2>
        <div className="flex flex-wrap gap-3 text-xs">
          {[['Available', 'bg-green-400'], ['Occupied', 'bg-orange-400'], ['Cleaning Needed', 'bg-yellow-400'], ['Maintenance', 'bg-red-400']].map(([label, dot]) => (
            <span key={label} className="flex items-center gap-1"><span className={`h-3 w-3 rounded-full ${dot}`} />{label}</span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
        {rooms.map((room) => (
          <div key={room.roomNumber} className={`group relative cursor-default rounded-xl border-2 p-2 text-center transition ${statusColor[room.status] || 'bg-gray-100 border-gray-200'}`}>
            <p className="text-xs font-bold">{room.roomNumber}</p>
            <p className="text-[10px] mt-0.5 opacity-70">{room.type}</p>
            {room.status === 'Occupied' && (
              <button
                type="button"
                onClick={() => onCheckout(room.roomNumber)}
                disabled={checkoutLoading === room.roomNumber}
                className="mt-1.5 w-full rounded-md bg-orange-500 px-1.5 py-0.5 text-[10px] font-bold text-white transition hover:bg-orange-600 disabled:bg-gray-300"
              >
                {checkoutLoading === room.roomNumber ? '…' : 'Checkout'}
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function RoomAssignmentForm({ formState, onChange, onSubmit, loading, errorMessage, assignmentResult }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-lg">
      <h2 className="mb-4 text-xl font-bold text-gray-900">Room Assignment</h2>
      <form className="space-y-4" onSubmit={onSubmit}>
        <div>
          <label className="mb-1 block text-sm font-semibold text-gray-700">Customer Name</label>
          <input type="text" name="customerName" value={formState.customerName} onChange={onChange} required placeholder="Full name" className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">Check-in</label>
            <input type="date" name="checkInDate" value={formState.checkInDate} onChange={onChange} required className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">Check-out</label>
            <input type="date" name="checkOutDate" value={formState.checkOutDate} onChange={onChange} required className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-gray-700">Room Type</label>
          <select name="roomType" value={formState.roomType} onChange={onChange} required className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100">
            <option value="Single">Single</option>
            <option value="Double">Double</option>
            <option value="Suite">Suite</option>
          </select>
        </div>
        {errorMessage && <p className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-orange-700">{errorMessage}</p>}
        <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none">
          {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-blue-200" />}
          {loading ? 'Assigning…' : 'Assign Room & Generate Credentials'}
        </button>
      </form>
      {assignmentResult && (
        <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800 shadow-sm">
          <p className="font-semibold">Room Assigned Successfully</p>
          <p className="mt-1">Room: {assignmentResult.roomNumber}</p>
          <p>Username: {assignmentResult.username}</p>
          <p>Password: {assignmentResult.password}</p>
        </div>
      )}
    </section>
  );
}

function RoomTable({ rooms, searchValue, onSearchChange, selectedRoomType, onTypeFilterChange }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-lg">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="text-xl font-bold text-gray-900">Room Lookup</h2>
        <div className="grid w-full grid-cols-2 gap-3 sm:w-auto">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-600">Search #</label>
            <input type="text" value={searchValue} onChange={(e) => onSearchChange(e.target.value)} placeholder="e.g. 201" className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-600">Filter Type</label>
            <select value={selectedRoomType} onChange={(e) => onTypeFilterChange(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100">
              <option value="All">All</option>
              <option value="Single">Single</option>
              <option value="Double">Double</option>
              <option value="Suite">Suite</option>
            </select>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead>
            <tr className="bg-gray-100 text-left text-xs uppercase tracking-wide text-gray-600">
              <th className="px-3 py-2">Room</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Guest</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rooms.length === 0 && <tr><td colSpan={4} className="px-3 py-4 text-center text-gray-500">No rooms match.</td></tr>}
            {rooms.map((room) => (
              <tr key={room.roomNumber} className="even:bg-gray-50 hover:bg-blue-50/60">
                <td className="px-3 py-2 font-medium text-gray-900">{room.roomNumber}</td>
                <td className="px-3 py-2 text-gray-700">{room.type}</td>
                <td className="px-3 py-2"><StatusBadge status={room.status} /></td>
                <td className="px-3 py-2 text-gray-700">{room.assignedCustomer || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// Analytics panel
function AnalyticsPanel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch(`${API}/analytics`);
        if (res.ok) setData(await res.json());
      } catch { /* backend not running — silent */ }
      finally { setLoading(false); }
    };
    fetchAnalytics();
    const id = setInterval(fetchAnalytics, 15000);
    return () => clearInterval(id);
  }, []);

  if (loading) return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-lg">
      <h2 className="text-xl font-bold text-gray-900">Analytics</h2>
      <div className="mt-4 flex items-center gap-2 text-sm text-gray-600"><span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-blue-200" />Loading…</div>
    </section>
  );

  if (!data) return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-lg">
      <h2 className="text-xl font-bold text-gray-900">Analytics</h2>
      <p className="mt-2 text-sm text-gray-500">Start the backend to see live analytics.</p>
    </section>
  );

  const maxCat = Math.max(...Object.values(data.by_category || { _: 1 }), 1);

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-lg">
      <h2 className="text-xl font-bold text-gray-900">Live Analytics</h2>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl bg-blue-50 p-3 text-center">
          <p className="text-2xl font-bold text-blue-700">{data.total_tasks}</p>
          <p className="text-xs text-blue-600 mt-0.5">Total Tasks</p>
        </div>
        <div className="rounded-xl bg-green-50 p-3 text-center">
          <p className="text-2xl font-bold text-green-700">{data.occupancy_rate}%</p>
          <p className="text-xs text-green-600 mt-0.5">Occupancy Rate</p>
        </div>
        <div className="rounded-xl bg-orange-50 p-3 text-center">
          <p className="text-2xl font-bold text-orange-700">{data.cleaning_needed || 0}</p>
          <p className="text-xs text-orange-600 mt-0.5">Need Cleaning</p>
        </div>
        <div className="rounded-xl bg-violet-50 p-3 text-center">
          <p className="text-lg font-bold text-violet-700 truncate">{data.most_requested}</p>
          <p className="text-xs text-violet-600 mt-0.5">Top Request</p>
        </div>
      </div>

      {Object.keys(data.by_category || {}).length > 0 && (
        <div className="mt-5">
          <p className="text-sm font-semibold text-gray-700 mb-3">Requests by Category</p>
          <div className="space-y-2">
            {Object.entries(data.by_category).map(([cat, count]) => (
              <div key={cat} className="flex items-center gap-3">
                <p className="w-24 text-xs font-medium text-gray-600 truncate">{cat}</p>
                <div className="flex-1 rounded-full bg-gray-100 h-3 overflow-hidden">
                  <div className="h-3 rounded-full bg-blue-500 transition-all" style={{ width: `${(count / maxCat) * 100}%` }} />
                </div>
                <span className="text-xs font-bold text-gray-700 w-4 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.by_status && (
        <div className="mt-4 flex flex-wrap gap-2">
          {Object.entries(data.by_status).map(([s, c]) => (
            <span key={s} className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">{s}: {c}</span>
          ))}
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function ReceptionDashboard() {
  const { user, logout } = useAuth();
  const { rooms, assignRoom, updateRoomStatus } = useRooms();
  const { registerCustomer } = useCustomerRegistration();

  const [formState, setFormState] = useState({ customerName: '', checkInDate: '', checkOutDate: '', roomType: 'Single' });
  const [searchValue, setSearchValue] = useState('');
  const [selectedRoomType, setSelectedRoomType] = useState('All');
  const [loading, setLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [assignmentResult, setAssignmentResult] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [activeTab, setActiveTab] = useState('heatmap'); // 'heatmap' | 'lookup' | 'analytics'

  // WebSocket: room checkout events update heatmap
  const { connected: wsConnected } = useWebSocket(useCallback((event) => {
    if (event.type === 'room_checkout') {
      updateRoomStatus(event.data.room_number, 'Cleaning Needed');
      pushToast(`Room ${event.data.room_number} checked out — cleaning task created.`, 'success');
    }
  }, [updateRoomStatus]));

  const roomStats = useMemo(() => ({
    totalRooms: rooms.length,
    availableRooms: rooms.filter((r) => r.status === 'Available').length,
    occupiedRooms: rooms.filter((r) => r.status === 'Occupied').length,
  }), [rooms]);

  const filteredRooms = useMemo(() => {
    const search = searchValue.trim().toLowerCase();
    return rooms.filter((r) => r.roomNumber.toLowerCase().includes(search) && (selectedRoomType === 'All' || r.type === selectedRoomType));
  }, [rooms, searchValue, selectedRoomType]);

  const pushToast = (message, type = 'success') => {
    const id = Date.now() + Math.floor(Math.random() * 999);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  };
  const dismissToast = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckout = async (roomNumber) => {
    try {
      setCheckoutLoading(roomNumber);
      const res = await fetch(`${API}/rooms/${roomNumber}/checkout`, { method: 'POST' });
      if (!res.ok) {
        const err = await res.json();
        pushToast(err.detail || 'Checkout failed.', 'error');
        return;
      }
      updateRoomStatus(roomNumber, 'Cleaning Needed');
      pushToast(`Room ${roomNumber} checked out. Cleaning task created & staff notified.`, 'success');
    } catch {
      // Backend offline — update locally
      updateRoomStatus(roomNumber, 'Cleaning Needed');
      pushToast(`Room ${roomNumber} checked out (offline mode).`, 'success');
    } finally {
      setCheckoutLoading('');
    }
  };

  const handleAssignRoom = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setAssignmentResult(null);
    if (!formState.customerName.trim()) { setErrorMessage('Customer name required.'); return; }
    const available = rooms.find((r) => r.status === 'Available' && r.type === formState.roomType);
    if (!available) { setErrorMessage(`No ${formState.roomType} room available.`); pushToast(`No ${formState.roomType} room available.`, 'error'); return; }
    try {
      setLoading(true);
      const result = await registerCustomer({ customerName: formState.customerName, checkInDate: formState.checkInDate, checkOutDate: formState.checkOutDate, roomNumber: available.roomNumber });
      assignRoom({ roomNumber: available.roomNumber, customerName: formState.customerName });
      setAssignmentResult({ roomNumber: available.roomNumber, username: result.username, password: result.password });
      setFormState((prev) => ({ ...prev, customerName: '' }));
      pushToast(`Room ${available.roomNumber} assigned.`, 'success');
    } catch { pushToast('Assignment failed.', 'error'); }
    finally { setLoading(false); }
  };

  const handleLogout = () => { logout?.(); window.location.href = '/login'; };

  const tabs = [
    { key: 'heatmap',   label: 'Room Heatmap' },
    { key: 'assign',    label: 'Assign Room' },
    { key: 'lookup',    label: 'Room Lookup' },
    { key: 'analytics', label: 'Analytics' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 px-4 pb-6 pt-28 font-sans md:px-6">
      <Navbar receptionist={user} roomStats={roomStats} onLogout={handleLogout} wsConnected={wsConnected} />

      {/* Tab navigation */}
      <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-lg">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${activeTab === tab.key ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      <main className="space-y-6">
        {activeTab === 'heatmap' && <RoomHeatmap rooms={rooms} onCheckout={handleCheckout} checkoutLoading={checkoutLoading} />}

        {activeTab === 'assign' && (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <RoomAssignmentForm formState={formState} onChange={handleInputChange} onSubmit={handleAssignRoom} loading={loading} errorMessage={errorMessage} assignmentResult={assignmentResult} />
            <RoomTable rooms={filteredRooms} searchValue={searchValue} onSearchChange={setSearchValue} selectedRoomType={selectedRoomType} onTypeFilterChange={setSelectedRoomType} />
          </div>
        )}

        {activeTab === 'lookup' && (
          <RoomTable rooms={filteredRooms} searchValue={searchValue} onSearchChange={setSearchValue} selectedRoomType={selectedRoomType} onTypeFilterChange={setSelectedRoomType} />
        )}

        {activeTab === 'analytics' && <AnalyticsPanel />}
      </main>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
