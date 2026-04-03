import React, { useEffect, useState } from 'react';
import { apiGet, apiPost } from '../services/api';

export default function CafeteriaDashboard() {
  const [orders, setOrders] = useState([]);
  const [availability, setAvailability] = useState({ open: true, items: [] });

  const refresh = async () => {
    try {
      const [inbox, avail] = await Promise.all([
        apiGet('/api/inbox/food'),
        apiGet('/api/cafeteria/availability'),
      ]);
      setOrders(inbox.items || []);
      setAvailability(avail || { open: true, items: [] });
    } catch {
      setOrders([]);
    }
  };

  useEffect(() => {
    refresh();
    const id = window.setInterval(refresh, 15000);
    return () => window.clearInterval(id);
  }, []);

  const completeOrder = async (order) => {
    await apiPost('/api/cafeteria/complete-task', {
      instruction_id: String(order.instruction_id),
      note: 'Food order prepared',
    });
    await apiPost('/api/feedback/task-state', {
      instruction_id: String(order.instruction_id),
      queue_name: 'food',
      state: 'completed',
      note: 'Cafeteria completed order',
    });
    refresh();
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <h1 className="mb-2 text-2xl font-bold">Cafeteria Dashboard</h1>
      <p className="mb-6 text-sm text-slate-600">Open: {availability.open ? 'Yes' : 'No'}</p>
      <div className="grid gap-3">
        {orders.map((order) => (
          <div key={order.instruction_id} className="rounded-xl border bg-white p-4">
            <p className="font-semibold">Order #{order.instruction_id}</p>
            <p className="text-sm text-slate-600">{order.staff_instruction}</p>
            <button
              onClick={() => completeOrder(order)}
              className="mt-3 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white"
            >
              Mark Complete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
