import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { apiGet, apiPost } from '../services/api';

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

  const refreshOrders = async () => {
    try {
      const [inbox, feedback] = await Promise.all([
        apiGet('/api/inbox/food'),
        apiGet('/api/feedback/task-state/queue/food'),
      ]);

      const feedbackMap = new Map((feedback.items || []).map((item) => [item.instruction_id, item]));

      const mappedOrders = (inbox.items || []).map((item) => {
        const matchedRoom = item.staff_instruction.match(/\b\d{2,4}\b/);
        const feedbackState = feedbackMap.get(item.instruction_id)?.state || 'Pending';
        const status = feedbackState === 'Completed' ? 'Approved' : feedbackState;

        return {
          id: item.instruction_id,
          roomNumber: matchedRoom ? matchedRoom[0] : item.instruction_id.slice(-3),
          customerName: 'Guest',
          items: [{ name: item.staff_instruction, quantity: 1 }],
          status,
          timestamp: item.created_at || new Date().toISOString(),
        };
      });

      setOrders(mappedOrders.length > 0 ? mappedOrders : initialOrders);
    } catch {
      setOrders(initialOrders);
    }
  };

  useEffect(() => {
    refreshOrders();
    const pollId = window.setInterval(refreshOrders, 15000);
    return () => window.clearInterval(pollId);
  }, []);

  return { orders, setOrders, refreshOrders };
}

function useMenu() {
  const [menu, setMenu] = useState(initialMenu);

  const refreshMenu = async () => {
    try {
      const response = await apiGet('/api/cafeteria/availability');
      const mappedMenu = (response.items || []).map((item) => ({
        name: item.item_name,
        availableQuantity: item.available_quantity,
      }));
      setMenu(mappedMenu.length > 0 ? mappedMenu : initialMenu);
    } catch {
      setMenu(initialMenu);
    }
  };

  useEffect(() => {
    refreshMenu();
  }, []);

  return { menu, refreshMenu };
}

function ToastContainer({ toasts, onDismiss }) {
  return (
    <div className="fixed right-4 top-20 z-50 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`rounded-xl border px-4 py-3 text-sm shadow-lg ${
            toast.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-700'
              : 'border-orange-200 bg-orange-50 text-orange-700'
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

function Navbar({ user, stats, onLogout }) {
  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Cafeteria Dashboard</h1>
          <p className="text-sm text-gray-600">
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
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-blue-500"
        >
          Logout
        </button>
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
  const statusClass = {
    Pending: 'border-orange-200 bg-orange-100 text-orange-700',
    Rejected: 'border-yellow-200 bg-yellow-100 text-yellow-700',
    Approved: 'border-green-200 bg-green-100 text-green-700',
  };

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
        statusClass[status] || 'border-gray-200 bg-gray-100 text-gray-700'
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
      className={`rounded-xl border p-4 shadow-sm transition ${
        selected
          ? 'border-blue-300 bg-blue-50 shadow-md'
          : 'border-gray-200 bg-white hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">Room #{order.roomNumber}</p>
          <p className="text-base font-semibold text-gray-900">{order.customerName}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="mt-3 space-y-1 text-sm text-gray-700">
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
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          {selected ? 'Selected' : 'Details'}
        </button>
        <button
          type="button"
          onClick={() => onApprove(order)}
          disabled={order.status === 'Approved' || isLoading}
          className="flex items-center justify-center gap-2 rounded-lg bg-green-500 px-3 py-2.5 text-sm font-semibold text-white shadow-lg shadow-green-100 transition hover:-translate-y-0.5 hover:bg-green-400 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none"
        >
          {isLoading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-green-200" />}
          Approve
        </button>
        <button
          type="button"
          onClick={() => onReject(order)}
          disabled={order.status === 'Rejected' || isLoading}
          className="flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-3 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-100 transition hover:-translate-y-0.5 hover:bg-orange-400 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none"
        >
          {isLoading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-orange-200" />}
          Reject
        </button>
      </div>
    </article>
  );
}

function MenuVerification({ order, menu }) {
  if (!order) {
    return (
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-lg">
        <h2 className="text-lg font-bold text-gray-900">Menu Verification</h2>
        <p className="mt-2 text-sm text-gray-600">Select an order to validate item availability.</p>
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
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-lg">
      <h2 className="text-lg font-bold text-gray-900">Menu Verification</h2>

      <div className="mt-3 space-y-2">
        {verification.map((entry) => (
          <div
            key={entry.itemName}
            className={`rounded-md border px-3 py-2 text-sm ${
              entry.ok
                ? 'border-green-200 bg-green-50 text-green-700'
                : 'border-orange-200 bg-orange-50 text-orange-700'
            }`}
          >
            <p className="font-semibold">{entry.itemName}</p>
            <p>{entry.message}</p>
          </div>
        ))}
      </div>

      {hasWarnings && (
        <p className="mt-3 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-orange-700">
          Warning: One or more items cannot be fulfilled exactly as requested.
        </p>
      )}
    </section>
  );
}

function OrderDetails({ order, onApprove, onReject, loadingOrderId }) {
  if (!order) {
    return (
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-lg">
        <h2 className="text-lg font-bold text-gray-900">Order Details</h2>
        <p className="mt-2 text-sm text-gray-600">Select an order from the queue to view details.</p>
      </section>
    );
  }

  const isLoading = loadingOrderId === order.id;

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-lg">
      <h2 className="text-xl font-bold text-gray-900">Order Details</h2>

      <div className="mt-3 space-y-2 text-sm text-gray-700">
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

      <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
        <p className="text-sm font-semibold text-gray-800">Ordered Items</p>
        <ul className="mt-2 space-y-1 text-sm text-gray-700">
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
          className="flex items-center justify-center gap-2 rounded-lg bg-green-500 px-3 py-2.5 text-sm font-semibold text-white shadow-lg shadow-green-100 transition hover:-translate-y-0.5 hover:bg-green-400 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none"
        >
          {isLoading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-green-200" />}
          Approve Order
        </button>
        <button
          type="button"
          onClick={() => onReject(order)}
          disabled={order.status === 'Rejected' || isLoading}
          className="flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-3 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-100 transition hover:-translate-y-0.5 hover:bg-orange-400 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none"
        >
          {isLoading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-orange-200" />}
          Reject Order
        </button>
      </div>
    </section>
  );
}

export default function CafeteriaDashboard() {
  const { user, logout } = useAuth();
  const { orders, setOrders, refreshOrders } = useOrders();
  const { menu, refreshMenu } = useMenu();

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
      await apiPost('/api/cafeteria/complete-task', {
        instruction_id: order.id,
        is_complete: true,
        staff_note: 'Order completed by cafeteria.',
        updated_by: user.name,
      });

      for (const item of order.items) {
        const matched = menu.find((menuItem) => menuItem.name.toLowerCase() === item.name.toLowerCase());
        if (matched) {
          await apiPost('/api/cafeteria/availability', {
            item_name: matched.name,
            available_quantity: Math.max(matched.availableQuantity - item.quantity, 0),
            note: 'Auto-updated after order completion.',
          });
        }
      }

      updateOrderStatus(order.id, 'Approved');
      await Promise.all([refreshOrders(), refreshMenu()]);
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
      await apiPost('/api/feedback/task-state', {
        instruction_id: order.id,
        queue: 'food',
        state: 'Rejected',
        is_complete: false,
        staff_note: 'Order rejected by cafeteria.',
        updated_by: user.name,
      });
      updateOrderStatus(order.id, 'Rejected');
      await refreshOrders();
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
    <div className="min-h-screen bg-gray-50 px-4 pb-6 pt-28 font-sans md:px-6">
      <Navbar user={user} stats={stats} onLogout={handleLogout} />

      {errorMessage && (
        <div className="mb-4 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
          {errorMessage}
        </div>
      )}

      <main className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-lg">
          <h2 className="mb-4 text-xl font-bold text-gray-900">Orders Queue</h2>

          <div className="space-y-3">
            {orders.length === 0 && (
              <div className="rounded-lg border border-dashed border-gray-300 px-3 py-5 text-center text-sm text-gray-500">
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