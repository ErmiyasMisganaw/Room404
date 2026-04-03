import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';

const API = 'http://localhost:8000/api';

const AuthContext = createContext({
  user: { id: 'CF-501', name: 'Liya B.', role: 'Cafeteria Staff' },
  logout: () => {},
});

const initialOrders = [
  { id: 'order-1', roomNumber: '210', customerName: 'Mikal D.', items: [{ name: 'Pasta', quantity: 2 }, { name: 'Orange Juice', quantity: 2 }], status: 'Pending', timestamp: '2026-04-03T08:30:00.000Z', backendId: null },
  { id: 'order-2', roomNumber: '118', customerName: 'Sara H.',  items: [{ name: 'Club Sandwich', quantity: 1 }, { name: 'Coffee', quantity: 1 }], status: 'Rejected', timestamp: '2026-04-03T09:10:00.000Z', backendId: null },
  { id: 'order-3', roomNumber: '403', customerName: 'Henok T.', items: [{ name: 'Grilled Chicken', quantity: 1 }, { name: 'Sparkling Water', quantity: 3 }], status: 'Approved', timestamp: '2026-04-03T10:00:00.000Z', backendId: null },
];

const initialMenu = [
  { name: 'Pasta', availableQuantity: 6 },
  { name: 'Orange Juice', availableQuantity: 12 },
  { name: 'Club Sandwich', availableQuantity: 4 },
  { name: 'Coffee', availableQuantity: 20 },
  { name: 'Grilled Chicken', availableQuantity: 2 },
  { name: 'Sparkling Water', availableQuantity: 10 },
  { name: 'Salad Bowl', availableQuantity: 5 },
];

function useAuth() { return useContext(AuthContext); }

function useOrders() {
  const [orders, setOrders] = useState(initialOrders);

  useEffect(() => {
    const id = window.setInterval(() => {
      setOrders((prev) => {
        if (prev.length > 12 || Math.random() < 0.6) return prev;
        const names = ['New Guest', 'Ava R.', 'Nati M.', 'Lucas K.'];
        const menu = ['Pasta', 'Coffee', 'Salad Bowl', 'Sparkling Water', 'Burger'];
        const a = menu[Math.floor(Math.random() * menu.length)];
        const b = menu[Math.floor(Math.random() * menu.length)];
        return [{
          id: `order-${Date.now()}`,
          roomNumber: String(100 + Math.floor(Math.random() * 350)),
          customerName: names[Math.floor(Math.random() * names.length)],
          items: [{ name: a, quantity: 1 + Math.floor(Math.random() * 2) }, { name: b, quantity: 1 + Math.floor(Math.random() * 3) }],
          status: 'Pending',
          timestamp: new Date().toISOString(),
          backendId: null,
        }, ...prev];
      });
    }, 20000);
    return () => window.clearInterval(id);
  }, []);

  const addOrderFromBackend = useCallback((backendTask) => {
    setOrders((prev) => {
      if (prev.some((o) => o.backendId === backendTask.id)) return prev;
      // Parse items from staff instruction if present
      const rawItems = backendTask.staff_instruction || backendTask.description;
      return [{
        id: `ws-${backendTask.id}`,
        backendId: backendTask.id,
        roomNumber: backendTask.room_number,
        customerName: `Room ${backendTask.room_number} Guest`,
        items: [{ name: rawItems, quantity: 1 }],
        status: 'Pending',
        timestamp: new Date().toISOString(),
        priority: backendTask.priority,
      }, ...prev];
    });
  }, []);

  return { orders, setOrders, addOrderFromBackend };
}

function useMenu() { return { menu: initialMenu }; }

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ToastContainer({ toasts, onDismiss }) {
  return (
    <div className="fixed right-4 top-20 z-50 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
      {toasts.map((t) => (
        <div key={t.id} className={`rounded-xl border px-4 py-3 text-sm shadow-lg ${t.type === 'success' ? 'border-green-200 bg-green-50 text-green-700' : 'border-orange-200 bg-orange-50 text-orange-700'}`}>
          <div className="flex items-center justify-between gap-3">
            <p className="font-medium">{t.message}</p>
            <button type="button" onClick={() => onDismiss(t.id)} className="text-xs font-semibold text-gray-600 transition hover:text-gray-900">Dismiss</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function Navbar({ user, stats, onLogout, wsConnected }) {
  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Cafeteria Dashboard</h1>
          <p className="text-sm text-gray-600 flex items-center gap-2">
            {user.name} • {user.role}
            <span className={`h-2 w-2 rounded-full ${wsConnected ? 'bg-green-400' : 'bg-gray-300'}`} />
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <StatCard label="Total Orders" value={stats.totalOrders} />
          <StatCard label="Completed Today" value={stats.completedToday} />
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
  const cls = { Pending: 'border-orange-200 bg-orange-100 text-orange-700', Rejected: 'border-yellow-200 bg-yellow-100 text-yellow-700', Approved: 'border-green-200 bg-green-100 text-green-700', Done: 'border-green-200 bg-green-100 text-green-700' };
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${cls[status] || 'border-gray-200 bg-gray-100 text-gray-700'}`}>{status}</span>;
}

function OrderCard({ order, selected, onSelect, onApprove, onReject, onBackendApprove, loadingOrderId }) {
  const isLoading = loadingOrderId === order.id;
  const isAI = Boolean(order.backendId);
  const isDone = order.status === 'Approved' || order.status === 'Done';
  const isRejected = order.status === 'Rejected';

  return (
    <article className={`rounded-xl border p-4 shadow-sm transition ${selected ? 'border-blue-300 bg-blue-50 shadow-md' : `hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md ${isAI ? 'border-violet-200 bg-violet-50' : 'border-gray-200 bg-white'}`}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500 flex items-center gap-1">
            Room #{order.roomNumber}
            {isAI && <span className="rounded-full bg-violet-200 px-1.5 py-0.5 text-xs font-bold text-violet-700">AI</span>}
            {order.priority && <span className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${order.priority === 'High' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{order.priority}</span>}
          </p>
          <p className="text-base font-semibold text-gray-900">{order.customerName}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>
      <div className="mt-3 space-y-1 text-sm text-gray-700">
        <p><span className="font-semibold">Items:</span> {order.items.map((i) => `${i.name} x${i.quantity}`).join(', ')}</p>
        <p><span className="font-semibold">Time:</span> {new Date(order.timestamp).toLocaleString()}</p>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <button type="button" onClick={() => onSelect(order)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50">{selected ? 'Selected' : 'Details'}</button>
        <button type="button" onClick={() => isAI ? onBackendApprove(order) : onApprove(order)} disabled={isDone || isLoading} className="flex items-center justify-center gap-2 rounded-lg bg-green-500 px-3 py-2.5 text-sm font-semibold text-white shadow-lg shadow-green-100 transition hover:-translate-y-0.5 hover:bg-green-400 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none">
          {isLoading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-green-200" />}
          Approve
        </button>
        <button type="button" onClick={() => onReject(order)} disabled={isRejected || isDone || isLoading} className="flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-3 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-100 transition hover:-translate-y-0.5 hover:bg-orange-400 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none">
          Reject
        </button>
      </div>
    </article>
  );
}

function MenuVerification({ order, menu }) {
  if (!order) return <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-lg"><h2 className="text-lg font-bold text-gray-900">Menu Verification</h2><p className="mt-2 text-sm text-gray-600">Select an order to validate item availability.</p></section>;
  const verification = order.items.map((item) => {
    const menuItem = menu.find((m) => m.name.toLowerCase() === item.name.toLowerCase());
    if (!menuItem) return { itemName: item.name, ok: false, message: 'Not in menu.' };
    if (menuItem.availableQuantity < item.quantity) return { itemName: item.name, ok: false, message: `Insufficient stock (${menuItem.availableQuantity} available).` };
    return { itemName: item.name, ok: true, message: `In stock (${menuItem.availableQuantity}).` };
  });
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-lg">
      <h2 className="text-lg font-bold text-gray-900">Menu Verification</h2>
      <div className="mt-3 space-y-2">
        {verification.map((v) => (
          <div key={v.itemName} className={`rounded-md border px-3 py-2 text-sm ${v.ok ? 'border-green-200 bg-green-50 text-green-700' : 'border-orange-200 bg-orange-50 text-orange-700'}`}>
            <p className="font-semibold">{v.itemName}</p>
            <p>{v.message}</p>
          </div>
        ))}
      </div>
      {verification.some((v) => !v.ok) && <p className="mt-3 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-orange-700">Warning: some items cannot be fulfilled.</p>}
    </section>
  );
}

function OrderDetails({ order, onApprove, onReject, onBackendApprove, loadingOrderId }) {
  if (!order) return <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-lg"><h2 className="text-lg font-bold text-gray-900">Order Details</h2><p className="mt-2 text-sm text-gray-600">Select an order to view details.</p></section>;
  const isLoading = loadingOrderId === order.id;
  const isDone = order.status === 'Approved' || order.status === 'Done';
  const isRejected = order.status === 'Rejected';
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-lg">
      <h2 className="text-xl font-bold text-gray-900">Order Details</h2>
      <div className="mt-3 space-y-2 text-sm text-gray-700">
        <p><span className="font-semibold">Room:</span> #{order.roomNumber}</p>
        <p><span className="font-semibold">Customer:</span> {order.customerName}</p>
        <p><span className="font-semibold">Time:</span> {new Date(order.timestamp).toLocaleString()}</p>
        <p><span className="font-semibold">Status:</span> <StatusBadge status={order.status} /></p>
      </div>
      <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
        <p className="text-sm font-semibold text-gray-800">Items</p>
        <ul className="mt-2 space-y-1 text-sm text-gray-700">{order.items.map((i) => <li key={`${order.id}-${i.name}`}>{i.name} x{i.quantity}</li>)}</ul>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button type="button" onClick={() => order.backendId ? onBackendApprove(order) : onApprove(order)} disabled={isDone || isLoading} className="flex items-center justify-center gap-2 rounded-lg bg-green-500 px-3 py-2.5 text-sm font-semibold text-white shadow-lg shadow-green-100 transition hover:-translate-y-0.5 hover:bg-green-400 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none">
          {isLoading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-green-200" />}
          Approve
        </button>
        <button type="button" onClick={() => onReject(order)} disabled={isRejected || isDone || isLoading} className="flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-3 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-100 transition hover:-translate-y-0.5 hover:bg-orange-400 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none">
          Reject
        </button>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function CafeteriaDashboard() {
  const { user, logout } = useAuth();
  const { orders, setOrders, addOrderFromBackend } = useOrders();
  const { menu } = useMenu();

  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [loadingOrderId, setLoadingOrderId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [toasts, setToasts] = useState([]);

  const selectedOrder = useMemo(() => orders.find((o) => o.id === selectedOrderId) || null, [orders, selectedOrderId]);
  const stats = useMemo(() => ({ totalOrders: orders.length, completedToday: orders.filter((o) => o.status === 'Approved' || o.status === 'Done').length }), [orders]);

  const verificationWarnings = useMemo(() => {
    if (!selectedOrder) return [];
    return selectedOrder.items.map((item) => {
      const mi = menu.find((m) => m.name.toLowerCase() === item.name.toLowerCase());
      if (!mi) return `${item.name} not in menu.`;
      if (mi.availableQuantity < item.quantity) return `${item.name} insufficient stock.`;
      return null;
    }).filter(Boolean);
  }, [selectedOrder, menu]);

  // WebSocket: receive Food orders
  const { connected: wsConnected } = useWebSocket(useCallback((event) => {
    if (event.type === 'new_task' && event.data.category === 'Food') {
      addOrderFromBackend(event.data);
      pushToast(`New food order from Room ${event.data.room_number}!`, 'success');
    }
  }, [addOrderFromBackend]));

  const pushToast = (message, type = 'success') => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((prev) => [...prev, { id, message, type }]);
    window.setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  };
  const dismissToast = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const updateOrderStatus = (orderId, nextStatus) => setOrders((prev) => prev.map((o) => o.id !== orderId ? o : { ...o, status: nextStatus }));

  const handleApprove = async (order) => {
    if (verificationWarnings.length > 0 && selectedOrderId === order.id) { pushToast('Warnings — cannot approve.', 'error'); return; }
    try {
      setLoadingOrderId(order.id);
      await new Promise((r) => setTimeout(r, 850));
      updateOrderStatus(order.id, 'Approved');
      pushToast(`Order for room ${order.roomNumber} approved.`, 'success');
    } catch { pushToast('Failed to approve.', 'error'); }
    finally { setLoadingOrderId(''); }
  };

  const handleBackendApprove = async (order) => {
    try {
      setLoadingOrderId(order.id);
      await fetch(`${API}/tasks/${order.backendId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Done' }),
      });
      updateOrderStatus(order.id, 'Done');
      pushToast(`Room ${order.roomNumber} order done.`, 'success');
    } catch { pushToast('Failed.', 'error'); }
    finally { setLoadingOrderId(''); }
  };

  const handleReject = async (order) => {
    try {
      setLoadingOrderId(order.id);
      await new Promise((r) => setTimeout(r, 850));
      updateOrderStatus(order.id, 'Rejected');
      pushToast(`Order for room ${order.roomNumber} rejected.`, 'error');
    } catch { pushToast('Failed.', 'error'); }
    finally { setLoadingOrderId(''); }
  };

  const handleLogout = () => { logout?.(); window.location.href = '/login'; };

  return (
    <div className="min-h-screen bg-gray-50 px-4 pb-6 pt-28 font-sans md:px-6">
      <Navbar user={user} stats={stats} onLogout={handleLogout} wsConnected={wsConnected} />
      {errorMessage && <div className="mb-4 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">{errorMessage}</div>}

      <main className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-lg">
          <h2 className="mb-4 text-xl font-bold text-gray-900">Orders Queue</h2>
          <div className="space-y-3">
            {orders.length === 0 && <div className="rounded-lg border border-dashed border-gray-300 px-3 py-5 text-center text-sm text-gray-500">No orders in queue.</div>}
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} selected={selectedOrderId === order.id} onSelect={(o) => setSelectedOrderId(o.id)} onApprove={handleApprove} onReject={handleReject} onBackendApprove={handleBackendApprove} loadingOrderId={loadingOrderId} />
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <OrderDetails order={selectedOrder} onApprove={handleApprove} onReject={handleReject} onBackendApprove={handleBackendApprove} loadingOrderId={loadingOrderId} />
          <MenuVerification order={selectedOrder} menu={menu} />
        </section>
      </main>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
