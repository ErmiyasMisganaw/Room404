import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar, { Icon } from './Sidebar';
import { useAuth } from '../context/AuthContext';
import {
  apiGet,
  addMenuItem,
  completeCafeteriaTask,
  deleteMenuItem,
  getCafeteriaAnalytics,
  getCafeteriaAvailability,
  getInbox,
  updateCafeteriaAvailability,
} from '../services/api';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ toasts, onDismiss }) {
  return (
    <div className="fixed right-4 top-4 z-50 flex max-w-sm flex-col gap-2">
      {toasts.map((t) => (
        <div key={t.id} className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm shadow-xl ${
          t.type === 'success' ? 'border-[#9bc23c]/40 bg-[#9bc23c]/10 text-[#2d5c10]' : 'border-[#d4186e]/40 bg-[#d4186e]/10 text-[#8a0040]'
        }`}>
          <p className="font-medium">{t.msg || t.message}</p>
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
      const inbox = await getInbox('food');
      setOrders((inbox.items || []).map((o) => {
        const status = `${o?.status || ''}`.trim().toLowerCase();
        const isCompleted = status === 'completed' || status === 'done';
        return { ...o, _done: isCompleted };
      }));
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
      await completeCafeteriaTask({
        instruction_id: String(order.instruction_id),
        note: 'Food order prepared',
      });
      setOrders((prev) => prev.map((o) => o.instruction_id === order.instruction_id ? { ...o, _done: true, status: 'completed' } : o));
      pushToast(`Order #${String(order.instruction_id).slice(-6)} marked as prepared.`, 'success');
    } catch {
      pushToast('Could not complete order. Try again.', 'error');
    } finally {
      setLoadingId('');
    }
  };

  const isDoneOrder = (order) => {
    const status = `${order?.status || ''}`.trim().toLowerCase();
    return order?._done || status === 'completed' || status === 'done';
  };

  const pending = orders.filter((o) => !isDoneOrder(o));
  const done = orders.filter((o) => isDoneOrder(o));

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
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="rounded-2xl border border-[#c4845a]/10 bg-white p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="space-y-2">
                    <div className="skeleton h-3 w-16" />
                    <div className="skeleton h-5 w-24" />
                  </div>
                  <div className="skeleton h-6 w-16 rounded-full" />
                </div>
                <div className="skeleton h-12 w-full mb-4" />
                <div className="skeleton h-10 w-full rounded-xl" />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="animate-fade-in-up rounded-2xl border border-dashed border-[#c4845a]/30 bg-white py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#c4845a]/10">
              <svg className="h-8 w-8 text-[#c4845a]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.87c1.355 0 2.697.055 4.024.165C17.155 8.51 18 9.473 18 10.608v2.513m-3-4.87v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 16.5m15-3.38a48.474 48.474 0 00-6-.37c-2.032 0-4.034.126-6 .37m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.17c0 .62-.504 1.124-1.125 1.124H4.125A1.125 1.125 0 013 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 016 13.12M16.5 8.625V4.875c0-.621-.504-1.125-1.125-1.125h-6.75c-.621 0-1.125.504-1.125 1.125v3.75" />
              </svg>
            </div>
            <p className="font-semibold text-gray-700">No orders right now</p>
            <p className="mt-1 text-sm text-gray-500">New orders will appear here automatically.</p>
          </div>
        ) : (
          <>
            {pending.length > 0 && (
              <div className="mb-6">
                <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-400">Pending Orders</h2>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 stagger-children">
                  {pending.map((order) => (
                    <OrderCard key={order.instruction_id} order={order} onComplete={handleComplete} loadingId={loadingId} />
                  ))}
                </div>
              </div>
            )}
            {done.length > 0 && (
              <div>
                <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-400">Prepared</h2>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 stagger-children">
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

function MenuSection({ userEmail }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);
  const [updating, setUpdating] = useState('');
  const [deleting, setDeleting] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({ item_name: '', available_quantity: 10, price: 0, note: '' });
  const [adding, setAdding] = useState(false);

  const pushToast = (msg, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((p) => [...p, { id, msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000);
  };

  const refresh = async () => {
    setLoading(true);
    try {
      const data = await getCafeteriaAvailability();
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
      await updateCafeteriaAvailability({
        item_name: item.item_name,
        available_quantity: item.available_quantity ?? 0,
        price: Number(item.price) || 0,
        is_available: !item.is_available,
        updated_by: userEmail || 'cafeteria',
        note: item.note || '',
      });
      setItems((prev) => prev.map((i) => i.item_name === item.item_name ? { ...i, is_available: !i.is_available } : i));
      pushToast(`${item.item_name} marked as ${!item.is_available ? 'available' : 'unavailable'}.`, 'success');
    } catch {
      pushToast('Could not update menu item.', 'error');
    } finally {
      setUpdating('');
    }
  };

  const handleDelete = async (itemName) => {
    if (!window.confirm(`Remove "${itemName}" from the menu?`)) return;
    setDeleting(itemName);
    try {
      await deleteMenuItem(itemName);
      setItems((prev) => prev.filter((i) => i.item_name !== itemName));
      pushToast(`${itemName} removed from menu.`, 'success');
    } catch {
      pushToast('Could not remove menu item.', 'error');
    } finally {
      setDeleting('');
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    const name = newItem.item_name.trim();
    if (!name) return;
    setAdding(true);
    try {
      await addMenuItem({
        item_name: name,
        available_quantity: Number(newItem.available_quantity) || 0,
        price: Number(newItem.price) || 0,
        is_available: true,
        note: newItem.note.trim(),
        updated_by: userEmail || 'cafeteria',
        updated_by_role: 'cafeteria',
      });
      setNewItem({ item_name: '', available_quantity: 10, price: 0, note: '' });
      setShowAddForm(false);
      pushToast(`${name} added to menu.`, 'success');
      await refresh();
    } catch {
      pushToast('Could not add menu item.', 'error');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Menu & Availability"
        subtitle="Manage what's available in the cafeteria"
        icon={Icon.menu}
        actions={
          <div className="flex items-center gap-2">
            <button onClick={() => setShowAddForm((v) => !v)}
              className="rounded-lg bg-[#1d5c28] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#2d7a3a] transition">
              {showAddForm ? 'Cancel' : '+ Add Item'}
            </button>
            <button onClick={refresh} className="rounded-lg border border-[#c4845a]/40 px-3 py-1.5 text-xs font-medium text-[#8a4a20] hover:bg-[#c4845a]/10 transition">
              Refresh
            </button>
          </div>
        }
      />
      <div className="p-6">
        {/* Add item form */}
        {showAddForm && (
          <form onSubmit={handleAdd} className="mb-6 animate-fade-in-up rounded-2xl border border-[#9bc23c]/30 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-bold text-[#0d2414] mb-4">Add New Menu Item</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Item Name</label>
                <input type="text" value={newItem.item_name}
                  onChange={(e) => setNewItem((p) => ({ ...p, item_name: e.target.value }))}
                  placeholder="e.g. Grilled Chicken"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#9bc23c]/60 focus:ring-2 focus:ring-[#9bc23c]/10" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Quantity</label>
                <input type="number" value={newItem.available_quantity} min={0}
                  onChange={(e) => setNewItem((p) => ({ ...p, available_quantity: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#9bc23c]/60 focus:ring-2 focus:ring-[#9bc23c]/10" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Price (ETB)</label>
                <input type="number" value={newItem.price} min={0} step="0.01"
                  onChange={(e) => setNewItem((p) => ({ ...p, price: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#9bc23c]/60 focus:ring-2 focus:ring-[#9bc23c]/10" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Note (optional)</label>
                <input type="text" value={newItem.note}
                  onChange={(e) => setNewItem((p) => ({ ...p, note: e.target.value }))}
                  placeholder="e.g. Lunch special"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#9bc23c]/60 focus:ring-2 focus:ring-[#9bc23c]/10" />
              </div>
            </div>
            <button type="submit" disabled={adding || !newItem.item_name.trim()}
              className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-[#1d5c28] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2d7a3a] disabled:opacity-50 disabled:cursor-not-allowed">
              {adding && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
              {adding ? 'Adding…' : 'Add to Menu'}
            </button>
          </form>
        )}

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="rounded-2xl border border-[#c4845a]/10 bg-white p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="space-y-2">
                    <div className="skeleton h-4 w-28" />
                    <div className="skeleton h-3 w-16" />
                  </div>
                  <div className="skeleton h-6 w-20 rounded-full" />
                </div>
                <div className="skeleton h-9 w-full rounded-xl" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="animate-fade-in-up rounded-2xl border border-dashed border-[#c4845a]/30 bg-white py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#c4845a]/10">
              <svg className="h-8 w-8 text-[#c4845a]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
              </svg>
            </div>
            <p className="font-semibold text-gray-700">No menu items found</p>
            <p className="mt-1 text-sm text-gray-500">Click "+ Add Item" above to create your first menu item.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 stagger-children">
            {items.map((item) => (
              <div key={item.item_name} className={`rounded-2xl border p-5 shadow-sm transition hover:shadow-md ${
                item.is_available ? 'border-[#9bc23c]/30 bg-white' : 'border-gray-200 bg-gray-50 opacity-70'
              }`}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="font-bold text-[#0d2414]">{item.item_name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Qty: {item.available_quantity ?? '—'}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Price: ETB {Number(item.price || 0).toLocaleString()}</p>
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

                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={updating === item.item_name}
                    onClick={() => toggleItem(item)}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2 text-sm font-semibold transition ${
                      item.is_available
                        ? 'border border-[#d4186e]/30 bg-[#d4186e]/5 text-[#d4186e] hover:bg-[#d4186e]/10'
                        : 'border border-[#9bc23c]/40 bg-[#9bc23c]/10 text-[#3a6e10] hover:bg-[#9bc23c]/20'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {updating === item.item_name && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current/40 border-t-current" />}
                    {item.is_available ? 'Mark Unavailable' : 'Mark Available'}
                  </button>
                  <button
                    type="button"
                    disabled={deleting === item.item_name}
                    onClick={() => handleDelete(item.item_name)}
                    className="flex items-center justify-center rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-red-500 transition hover:bg-red-100 hover:border-red-300 disabled:opacity-50"
                    title="Remove item"
                  >
                    {deleting === item.item_name
                      ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-red-300 border-t-red-500" />
                      : <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                    }
                  </button>
                </div>
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
          getInbox('food').catch(() => ({ items: [] })),
          getCafeteriaAvailability().catch(() => []),
          getCafeteriaAnalytics().catch(() => null),
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

  const totalOrders = orders.filter((o) => {
    const status = `${o?.status || ''}`.trim().toLowerCase();
    return !(status === 'completed' || status === 'done');
  }).length;
  const availableItems = menuItems.filter((i) => i.is_available).length;
  const totalItems = menuItems.length;
  const stockPct = totalItems > 0 ? Math.round((availableItems / totalItems) * 100) : 0;

  return (
    <div>
      <PageHeader title="Analytics" subtitle="Cafeteria performance & stock overview" icon={Icon.analytics} />
      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 stagger-children">
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
            <h3 className="mb-4 text-sm font-bold text-[#0d2414]">Cafeteria Overview</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-[#f4f6ed] p-3 text-center">
                <p className="text-xl font-bold text-[#1d5c28]">{analyticsData.total_orders_30d ?? '—'}</p>
                <p className="text-xs text-gray-500">Orders (30d)</p>
              </div>
              <div className="rounded-xl bg-[#f4f6ed] p-3 text-center">
                <p className="text-xl font-bold text-[#3a6e10]">{analyticsData.pending_orders ?? '—'}</p>
                <p className="text-xs text-gray-500">Pending Orders</p>
              </div>
              <div className="rounded-xl bg-[#f4f6ed] p-3 text-center">
                <p className="text-xl font-bold text-[#c4845a] truncate">{analyticsData.top_item ?? '—'}</p>
                <p className="text-xs text-gray-500">Top Item</p>
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
  const navigate = useNavigate();
  const { user: authUser, logout } = useAuth();
  const user = authUser || { id: 'CF-001', name: 'Cafeteria Staff', role: 'cafeteria' };
  const userEmail = authUser?.email || '';
  const [activeSection, setActiveSection] = useState('orders');

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
          {activeSection === 'orders'    && <OrdersSection />}
          {activeSection === 'menu'      && <MenuSection userEmail={userEmail} />}
          {activeSection === 'analytics' && <AnalyticsSection />}
        </div>
      </main>
    </div>
  );
}
