import React, { useEffect, useMemo, useState } from 'react';
import Sidebar, { Icon } from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { apiGet, apiPost } from '../services/api';

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

function PageHeader({ title, subtitle, icon, actions }) {
  return (
    <div className="flex items-center justify-between border-b border-[#9bc23c]/20 bg-white/80 px-6 py-4 backdrop-blur-sm sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#c4845a]/15 text-[#8a4a20]">
          {icon}
        </div>
        <div>
          <h1 className="text-lg font-bold text-[#0d2414]">{title}</h1>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

// ── Orders Section ─────────────────────────────────────────────────────────────

function OrderCard({ order, onComplete, loadingId }) {
  const isLoading = loadingId === order.instruction_id;
  const isDone = order._done;

  return (
    <div className={`rounded-2xl border p-5 shadow-sm transition hover:shadow-md ${
      isDone ? 'border-[#1d5c28]/15 bg-[#1d5c28]/3 opacity-70' : 'border-[#c4845a]/25 bg-white'
    }`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Order</p>
          <p className="text-lg font-bold text-[#0d2414]">#{String(order.instruction_id).slice(-6)}</p>
        </div>
        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${
          isDone
            ? 'bg-[#1d5c28]/5 border-[#1d5c28]/20 text-[#1d5c28]'
            : 'bg-amber-50 border-amber-200 text-amber-700'
        }`}>
          {isDone ? '✓ Prepared' : '⏳ Pending'}
        </span>
      </div>

      {order.staff_instruction && (
        <p className="mb-4 rounded-lg bg-[#f4f6ed] px-3 py-2.5 text-sm text-gray-700 leading-relaxed">
          {order.staff_instruction}
        </p>
      )}

      {order.room && (
        <div className="mb-4 flex items-center gap-2 text-xs text-gray-500">
          <span className="rounded-full bg-[#c4845a]/10 px-2.5 py-1 font-semibold text-[#8a4a20]">
            Room {order.room}
          </span>
          {order.priority && (
            <span className={`rounded-full px-2.5 py-1 font-semibold ${
              order.priority === 'High' ? 'bg-[#d4186e]/10 text-[#d4186e]' :
              order.priority === 'Medium' ? 'bg-amber-50 text-amber-700' :
              'bg-gray-100 text-gray-600'
            }`}>
              {order.priority}
            </span>
          )}
        </div>
      )}

      <button
        type="button"
        disabled={isDone || isLoading}
        onClick={() => onComplete(order)}
        className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition ${
          isDone
            ? 'bg-[#1d5c28]/5 text-[#1d5c28] cursor-default'
            : 'bg-[#c4845a] text-white shadow-lg shadow-[#c4845a]/25 hover:bg-[#b07248] hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed'
        }`}
      >
        {isLoading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
        {isDone ? 'Order Prepared' : isLoading ? 'Marking…' : 'Mark as Prepared'}
      </button>
    </div>
  );
}

function OrdersSection() {
  const [orders, setOrders] = useState([]);
  const [loadingId, setLoadingId] = useState('');
  const [toasts, setToasts] = useState([]);
  const [loading, setLoading] = useState(true);

  const pushToast = (msg, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((p) => [...p, { id, msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000);
  };

  const refresh = async () => {
    setLoading(true);
    try {
      const inbox = await apiGet('/api/inbox/food');
      setOrders((inbox.items || []).map((o) => ({ ...o, _done: false })));
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 15000);
    return () => clearInterval(id);
  }, []);

  const handleComplete = async (order) => {
    setLoadingId(order.instruction_id);
    try {
      await Promise.all([
        apiPost('/api/cafeteria/complete-task', {
          instruction_id: String(order.instruction_id),
          note: 'Food order prepared',
        }),
        apiPost('/api/feedback/task-state', {
          instruction_id: String(order.instruction_id),
          queue_name: 'food',
          state: 'completed',
          note: 'Cafeteria completed order',
        }),
      ]);
      setOrders((prev) => prev.map((o) => o.instruction_id === order.instruction_id ? { ...o, _done: true } : o));
      pushToast(`Order #${String(order.instruction_id).slice(-6)} marked as prepared.`, 'success');
    } catch {
      pushToast('Could not complete order. Try again.', 'error');
    } finally {
      setLoadingId('');
    }
  };

  const pending = orders.filter((o) => !o._done);
  const done = orders.filter((o) => o._done);

  return (
    <div>
      <PageHeader
        title="Food Orders"
        subtitle={`${pending.length} pending · ${done.length} prepared`}
        icon={Icon.orders}
        actions={
          <button onClick={refresh} className="rounded-lg border border-[#c4845a]/40 px-3 py-1.5 text-xs font-medium text-[#8a4a20] hover:bg-[#c4845a]/10 transition">
            Refresh
          </button>
        }
      />
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#c4845a]/30 border-t-[#c4845a]" />
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#9bc23c]/40 bg-white py-16 text-center">
            <p className="text-4xl mb-3">🍽️</p>
            <p className="font-semibold text-gray-700">No orders right now</p>
            <p className="mt-1 text-sm text-gray-500">New orders will appear here automatically.</p>
          </div>
        ) : (
          <>
            {pending.length > 0 && (
              <div className="mb-6">
                <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-400">Pending Orders</h2>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {pending.map((order) => (
                    <OrderCard key={order.instruction_id} order={order} onComplete={handleComplete} loadingId={loadingId} />
                  ))}
                </div>
              </div>
            )}
            {done.length > 0 && (
              <div>
                <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-400">Prepared</h2>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {done.map((order) => (
                    <OrderCard key={order.instruction_id} order={order} onComplete={handleComplete} loadingId={loadingId} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <Toast toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((t) => t.id !== id))} />
    </div>
  );
}

// ── Menu Section ──────────────────────────────────────────────────────────────

function MenuSection() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);
  const [updating, setUpdating] = useState('');

  const pushToast = (msg, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((p) => [...p, { id, msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000);
  };

  const refresh = async () => {
    setLoading(true);
    try {
      const data = await apiGet('/api/cafeteria/availability');
      setItems(Array.isArray(data) ? data : data?.items || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const toggleItem = async (item) => {
    setUpdating(item.item_name);
    try {
      await apiPost('/api/cafeteria/availability', {
        item_name: item.item_name,
        is_available: !item.is_available,
      });
      setItems((prev) => prev.map((i) => i.item_name === item.item_name ? { ...i, is_available: !i.is_available } : i));
      pushToast(`${item.item_name} marked as ${!item.is_available ? 'available' : 'unavailable'}.`, 'success');
    } catch {
      pushToast('Could not update menu item.', 'error');
    } finally {
      setUpdating('');
    }
  };

  return (
    <div>
      <PageHeader
        title="Menu & Availability"
        subtitle="Manage what's available in the cafeteria"
        icon={Icon.menu}
        actions={
          <button onClick={refresh} className="rounded-lg border border-[#c4845a]/40 px-3 py-1.5 text-xs font-medium text-[#8a4a20] hover:bg-[#c4845a]/10 transition">
            Refresh
          </button>
        }
      />
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#c4845a]/30 border-t-[#c4845a]" />
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#9bc23c]/40 bg-white py-16 text-center">
            <p className="text-4xl mb-3">📋</p>
            <p className="font-semibold text-gray-700">No menu items found</p>
            <p className="mt-1 text-sm text-gray-500">Menu items will appear here from the backend.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <div key={item.item_name} className={`rounded-2xl border p-5 shadow-sm transition hover:shadow-md ${
                item.is_available ? 'border-[#9bc23c]/30 bg-white' : 'border-gray-200 bg-gray-50 opacity-70'
              }`}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="font-bold text-[#0d2414]">{item.item_name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Qty: {item.available_quantity ?? '—'}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${
                    item.is_available
                      ? 'bg-[#9bc23c]/10 border-[#9bc23c]/30 text-[#3a6e10]'
                      : 'bg-gray-100 border-gray-200 text-gray-500'
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${item.is_available ? 'bg-[#9bc23c]' : 'bg-gray-400'}`} />
                    {item.is_available ? 'Available' : 'Unavailable'}
                  </span>
                </div>

                {item.note && (
                  <p className="mb-4 text-xs text-gray-500 italic">{item.note}</p>
                )}

                <button
                  type="button"
                  disabled={updating === item.item_name}
                  onClick={() => toggleItem(item)}
                  className={`flex w-full items-center justify-center gap-2 rounded-xl py-2 text-sm font-semibold transition ${
                    item.is_available
                      ? 'border border-[#d4186e]/30 bg-[#d4186e]/5 text-[#d4186e] hover:bg-[#d4186e]/10'
                      : 'border border-[#9bc23c]/40 bg-[#9bc23c]/10 text-[#3a6e10] hover:bg-[#9bc23c]/20'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {updating === item.item_name && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current/40 border-t-current" />}
                  {item.is_available ? 'Mark Unavailable' : 'Mark Available'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <Toast toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((t) => t.id !== id))} />
    </div>
  );
}

// ── Analytics Section ─────────────────────────────────────────────────────────

function AnalyticsSection() {
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [analyticsData, setAnalyticsData] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [inbox, avail, analytics] = await Promise.all([
          apiGet('/api/inbox/food').catch(() => ({ items: [] })),
          apiGet('/api/cafeteria/availability').catch(() => []),
          apiGet('/api/analytics').catch(() => null),
        ]);
        setOrders(inbox.items || []);
        setMenuItems(Array.isArray(avail) ? avail : avail?.items || []);
        setAnalyticsData(analytics);
      } catch { /* silent */ }
    };
    fetch();
    const id = setInterval(fetch, 30000);
    return () => clearInterval(id);
  }, []);

  const totalOrders = orders.length;
  const availableItems = menuItems.filter((i) => i.is_available).length;
  const totalItems = menuItems.length;
  const stockPct = totalItems > 0 ? Math.round((availableItems / totalItems) * 100) : 0;

  return (
    <div>
      <PageHeader title="Analytics" subtitle="Cafeteria performance & stock overview" icon={Icon.analytics} />
      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label: 'Active Orders', value: totalOrders, color: 'bg-[#c4845a]/10 border-[#c4845a]/30', text: 'text-[#8a4a20]' },
            { label: 'Available Items', value: availableItems, color: 'bg-[#9bc23c]/10 border-[#9bc23c]/30', text: 'text-[#3a6e10]' },
            { label: 'Total Menu Items', value: totalItems, color: 'bg-[#1d5c28]/5 border-[#1d5c28]/20', text: 'text-[#1d5c28]' },
            { label: 'Stock Availability', value: `${stockPct}%`, color: 'bg-amber-50 border-amber-200', text: 'text-amber-700' },
          ].map((card) => (
            <div key={card.label} className={`rounded-2xl border p-5 ${card.color}`}>
              <p className={`text-2xl font-extrabold ${card.text}`}>{card.value}</p>
              <p className="mt-1 text-xs font-semibold text-gray-500">{card.label}</p>
            </div>
          ))}
        </div>

        {/* Menu item availability */}
        {menuItems.length > 0 && (
          <div className="rounded-2xl border border-[#c4845a]/25 bg-white p-5">
            <h3 className="mb-4 text-sm font-bold text-[#0d2414]">Menu Availability</h3>
            <div className="space-y-3">
              {menuItems.map((item) => (
                <div key={item.item_name} className="flex items-center gap-3">
                  <p className="w-36 text-xs font-semibold text-gray-700 truncate">{item.item_name}</p>
                  <div className="flex-1 overflow-hidden rounded-full bg-[#f4f6ed] h-2.5">
                    <div className={`h-2.5 rounded-full transition-all ${item.is_available ? 'bg-[#9bc23c]' : 'bg-gray-300'}`}
                      style={{ width: item.is_available ? '100%' : '20%' }} />
                  </div>
                  <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    item.is_available ? 'bg-[#9bc23c]/15 text-[#3a6e10]' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {item.is_available ? `${item.available_quantity ?? '?'} left` : 'Out'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hotel stats */}
        {analyticsData && (
          <div className="rounded-2xl border border-[#c4845a]/25 bg-white p-5">
            <h3 className="mb-4 text-sm font-bold text-[#0d2414]">Hotel Overview</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-[#f4f6ed] p-3 text-center">
                <p className="text-xl font-bold text-[#1d5c28]">{analyticsData.total_tasks ?? '—'}</p>
                <p className="text-xs text-gray-500">Total Tasks</p>
              </div>
              <div className="rounded-xl bg-[#f4f6ed] p-3 text-center">
                <p className="text-xl font-bold text-[#3a6e10]">{analyticsData.occupancy_rate != null ? `${analyticsData.occupancy_rate}%` : '—'}</p>
                <p className="text-xs text-gray-500">Occupancy</p>
              </div>
              <div className="rounded-xl bg-[#f4f6ed] p-3 text-center">
                <p className="text-xl font-bold text-[#c4845a] truncate">{analyticsData.most_requested ?? '—'}</p>
                <p className="text-xs text-gray-500">Top Request</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

const NAV = [
  { key: 'orders',    label: 'Orders',     icon: Icon.orders },
  { key: 'menu',      label: 'Menu',       icon: Icon.menu },
  { key: 'analytics', label: 'Analytics',  icon: Icon.analytics },
];

export default function CafeteriaDashboard() {
  const { user: authUser, logout } = useAuth();
  const user = authUser || { id: 'CF-001', name: 'Cafeteria Staff', role: 'cafeteria' };
  const [activeSection, setActiveSection] = useState('orders');

  const handleLogout = () => { logout?.(); window.location.href = '/login'; };

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#f4f6ed' }}>
      <Sidebar
        navItems={NAV}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        user={user}
        onLogout={handleLogout}
      />
      <main className="flex-1 lg:ml-64 min-h-screen">
        {activeSection === 'orders'    && <OrdersSection />}
        {activeSection === 'menu'      && <MenuSection />}
        {activeSection === 'analytics' && <AnalyticsSection />}
      </main>
    </div>
  );
}
