import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AuthContext = createContext({
  user: {
    id: 'CF-501',
    name: 'Liya B.',
    role: 'Cafeteria Staff',
  },
  logout: () => {},
});

const initialOrders = [
  {
    id: 'order-1',
    roomNumber: '210',
    customerName: 'Mikal D.',
    items: [
      { name: 'Pasta', quantity: 2 },
      { name: 'Orange Juice', quantity: 2 },
    ],
    status: 'Pending',
    timestamp: '2026-04-03T08:30:00.000Z',
  },
  {
    id: 'order-2',
    roomNumber: '118',
    customerName: 'Sara H.',
    items: [
      { name: 'Club Sandwich', quantity: 1 },
      { name: 'Coffee', quantity: 1 },
    ],
    status: 'Rejected',
    timestamp: '2026-04-03T09:10:00.000Z',
  },
  {
    id: 'order-3',
    roomNumber: '403',
    customerName: 'Henok T.',
    items: [
      { name: 'Grilled Chicken', quantity: 1 },
      { name: 'Sparkling Water', quantity: 3 },
    ],
    status: 'Approved',
    timestamp: '2026-04-03T10:00:00.000Z',
  },
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

function useAuth() {
  return useContext(AuthContext);
}

function useOrders() {
  const [orders, setOrders] = useState(initialOrders);

  useEffect(() => {
    const feedId = window.setInterval(() => {
      setOrders((previousOrders) => {
        if (previousOrders.length > 12 || Math.random() < 0.6) {
          return previousOrders;
        }

        const roomNumber = String(100 + Math.floor(Math.random() * 350));
        const guestNames = ['New Guest', 'Ava R.', 'Nati M.', 'Lucas K.'];
        const randomGuest = guestNames[Math.floor(Math.random() * guestNames.length)];
        const menuCandidates = ['Pasta', 'Coffee', 'Salad Bowl', 'Sparkling Water', 'Burger'];
        const first = menuCandidates[Math.floor(Math.random() * menuCandidates.length)];
        const second = menuCandidates[Math.floor(Math.random() * menuCandidates.length)];

        const nextOrder = {
          id: `order-${Date.now()}-${Math.floor(Math.random() * 99)}`,
          roomNumber,
          customerName: randomGuest,
          items: [
            { name: first, quantity: 1 + Math.floor(Math.random() * 2) },
            { name: second, quantity: 1 + Math.floor(Math.random() * 3) },
          ],
          status: 'Pending',
          timestamp: new Date().toISOString(),
        };

        return [nextOrder, ...previousOrders];
      });
    }, 20000);

    return () => {
      window.clearInterval(feedId);
    };
  }, []);

  return { orders, setOrders };
}

function useMenu() {
  const [menu] = useState(initialMenu);

  return { menu };
}

function ToastContainer({ toasts, onDismiss }) {
  return (
    <div className="fixed right-4 top-4 z-50 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`rounded-lg border px-4 py-3 text-sm shadow-lg ${
            toast.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-800'
              : 'border-red-200 bg-red-50 text-red-800'
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <p className="font-medium">{toast.message}</p>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="text-xs font-semibold opacity-75 transition hover:opacity-100"
            >
              Dismiss
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function Navbar({ user, stats, onLogout }) {
  return (
    <header className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Cafeteria Dashboard</h1>
          <p className="text-sm text-slate-600">
            {user.name} • {user.role}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <StatCard label="Total Orders Received" value={stats.totalOrders} />
          <StatCard label="Orders Completed Today" value={stats.completedToday} />
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Logout
        </button>
      </div>
    </header>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-md bg-slate-100 px-3 py-2 text-center">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-lg font-bold text-slate-900">{value}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  const statusClass = {
    Pending: 'border-red-200 bg-red-100 text-red-800',
    Rejected: 'border-yellow-200 bg-yellow-100 text-yellow-800',
    Approved: 'border-green-200 bg-green-100 text-green-800',
  };

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
        statusClass[status] || 'border-slate-200 bg-slate-100 text-slate-700'
      }`}
    >
      {status}
    </span>
  );
}

function OrderCard({ order, selected, onSelect, onApprove, onReject, loadingOrderId }) {
  const isLoading = loadingOrderId === order.id;

  return (
    <article
      className={`rounded-lg border p-4 shadow-sm transition ${
        selected ? 'border-blue-300 bg-blue-50' : 'border-slate-200 bg-white hover:border-slate-300'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Room #{order.roomNumber}</p>
          <p className="text-base font-semibold text-slate-900">{order.customerName}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="mt-3 space-y-1 text-sm text-slate-700">
        <p>
          <span className="font-semibold">Items:</span>{' '}
          {order.items.map((item) => `${item.name} x${item.quantity}`).join(', ')}
        </p>
        <p>
          <span className="font-semibold">Timestamp:</span>{' '}
          {new Date(order.timestamp).toLocaleString()}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => onSelect(order)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          {selected ? 'Selected' : 'Details'}
        </button>
        <button
          type="button"
          onClick={() => onApprove(order)}
          disabled={order.status === 'Approved' || isLoading}
          className="flex items-center justify-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
          Approve
        </button>
        <button
          type="button"
          onClick={() => onReject(order)}
          disabled={order.status === 'Rejected' || isLoading}
          className="flex items-center justify-center gap-2 rounded-md bg-amber-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
          Reject
        </button>
      </div>
    </article>
  );
}

function MenuVerification({ order, menu }) {
  if (!order) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Menu Verification</h2>
        <p className="mt-2 text-sm text-slate-600">Select an order to validate item availability.</p>
      </section>
    );
  }

  const verification = order.items.map((item) => {
    const menuItem = menu.find((entry) => entry.name.toLowerCase() === item.name.toLowerCase());

    if (!menuItem) {
      return {
        itemName: item.name,
        ok: false,
        message: 'Item is not present in the menu.',
      };
    }

    if (menuItem.availableQuantity < item.quantity) {
      return {
        itemName: item.name,
        ok: false,
        message: `Insufficient quantity. Available: ${menuItem.availableQuantity}, Requested: ${item.quantity}`,
      };
    }

    return {
      itemName: item.name,
      ok: true,
      message: `Available (${menuItem.availableQuantity} in stock).`,
    };
  });

  const hasWarnings = verification.some((entry) => !entry.ok);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Menu Verification</h2>

      <div className="mt-3 space-y-2">
        {verification.map((entry) => (
          <div
            key={entry.itemName}
            className={`rounded-md border px-3 py-2 text-sm ${
              entry.ok
                ? 'border-green-200 bg-green-50 text-green-800'
                : 'border-red-200 bg-red-50 text-red-800'
            }`}
          >
            <p className="font-semibold">{entry.itemName}</p>
            <p>{entry.message}</p>
          </div>
        ))}
      </div>

      {hasWarnings && (
        <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          Warning: One or more items cannot be fulfilled exactly as requested.
        </p>
      )}
    </section>
  );
}

function OrderDetails({ order, onApprove, onReject, loadingOrderId }) {
  if (!order) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Order Details</h2>
        <p className="mt-2 text-sm text-slate-600">Select an order from the queue to view details.</p>
      </section>
    );
  }

  const isLoading = loadingOrderId === order.id;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Order Details</h2>

      <div className="mt-3 space-y-2 text-sm text-slate-700">
        <p>
          <span className="font-semibold">Room Number:</span> #{order.roomNumber}
        </p>
        <p>
          <span className="font-semibold">Customer Name:</span> {order.customerName}
        </p>
        <p>
          <span className="font-semibold">Timestamp:</span> {new Date(order.timestamp).toLocaleString()}
        </p>
        <p>
          <span className="font-semibold">Status:</span> <StatusBadge status={order.status} />
        </p>
      </div>

      <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3">
        <p className="text-sm font-semibold text-slate-800">Ordered Items</p>
        <ul className="mt-2 space-y-1 text-sm text-slate-700">
          {order.items.map((item) => (
            <li key={`${order.id}-${item.name}`}>{item.name} x{item.quantity}</li>
          ))}
        </ul>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onApprove(order)}
          disabled={order.status === 'Approved' || isLoading}
          className="flex items-center justify-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
          Approve Order
        </button>
        <button
          type="button"
          onClick={() => onReject(order)}
          disabled={order.status === 'Rejected' || isLoading}
          className="flex items-center justify-center gap-2 rounded-md bg-amber-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
          Reject Order
        </button>
      </div>
    </section>
  );
}

export default function CafeteriaDashboard() {
  const { user, logout } = useAuth();
  const { orders, setOrders } = useOrders();
  const { menu } = useMenu();

  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [loadingOrderId, setLoadingOrderId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [toasts, setToasts] = useState([]);

  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === selectedOrderId) || null,
    [orders, selectedOrderId]
  );

  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const completedToday = orders.filter((order) => order.status === 'Approved').length;
    return { totalOrders, completedToday };
  }, [orders]);

  const verificationWarnings = useMemo(() => {
    if (!selectedOrder) {
      return [];
    }

    return selectedOrder.items
      .map((item) => {
        const menuItem = menu.find((entry) => entry.name.toLowerCase() === item.name.toLowerCase());

        if (!menuItem) {
          return `${item.name} is not available in menu.`;
        }

        if (menuItem.availableQuantity < item.quantity) {
          return `${item.name} quantity is insufficient (${menuItem.availableQuantity} available).`;
        }

        return null;
      })
      .filter(Boolean);
  }, [selectedOrder, menu]);

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

  const updateOrderStatus = (orderId, nextStatus) => {
    setOrders((previousOrders) =>
      previousOrders.map((order) => {
        if (order.id !== orderId) {
          return order;
        }

        return {
          ...order,
          status: nextStatus,
        };
      })
    );
  };

  const handleApprove = async (order) => {
    setErrorMessage('');

    if (verificationWarnings.length > 0 && selectedOrderId === order.id) {
      const message = 'Cannot approve: menu verification has warnings.';
      setErrorMessage(message);
      pushToast(message, 'error');
      return;
    }

    try {
      setLoadingOrderId(order.id);
      await new Promise((resolve) => {
        setTimeout(resolve, 850);
      });
      updateOrderStatus(order.id, 'Approved');
      pushToast(`Order for room ${order.roomNumber} approved.`, 'success');
    } catch {
      const message = 'Failed to approve order.';
      setErrorMessage(message);
      pushToast(message, 'error');
    } finally {
      setLoadingOrderId('');
    }
  };

  const handleReject = async (order) => {
    setErrorMessage('');

    try {
      setLoadingOrderId(order.id);
      await new Promise((resolve) => {
        setTimeout(resolve, 850);
      });
      updateOrderStatus(order.id, 'Rejected');
      pushToast(`Order for room ${order.roomNumber} rejected.`, 'error');
    } catch {
      const message = 'Failed to reject order.';
      setErrorMessage(message);
      pushToast(message, 'error');
    } finally {
      setLoadingOrderId('');
    }
  };

  const handleLogout = () => {
    logout?.();
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-6">
      <Navbar user={user} stats={stats} onLogout={handleLogout} />

      {errorMessage && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      <main className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Orders Queue</h2>

          <div className="space-y-3">
            {orders.length === 0 && (
              <div className="rounded-md border border-dashed border-slate-300 px-3 py-5 text-center text-sm text-slate-500">
                No customer orders in queue.
              </div>
            )}

            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                selected={selectedOrderId === order.id}
                onSelect={(currentOrder) => setSelectedOrderId(currentOrder.id)}
                onApprove={handleApprove}
                onReject={handleReject}
                loadingOrderId={loadingOrderId}
              />
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <OrderDetails
            order={selectedOrder}
            onApprove={handleApprove}
            onReject={handleReject}
            loadingOrderId={loadingOrderId}
          />

          <MenuVerification order={selectedOrder} menu={menu} />
        </section>
      </main>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}