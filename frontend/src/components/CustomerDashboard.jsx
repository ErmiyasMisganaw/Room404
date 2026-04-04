import React, { useEffect, useRef, useState } from 'react';
import Sidebar, { Icon } from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { apiGet, apiPost } from '../services/api';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

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

// ── Page Header ───────────────────────────────────────────────────────────────

function PageHeader({ title, subtitle, icon }) {
  return (
    <div className="flex items-center gap-4 border-b border-[#9bc23c]/20 bg-white/80 px-6 py-4 backdrop-blur-sm sticky top-0 z-10">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1d5c28]/10 text-[#1d5c28]">
        {icon}
      </div>
      <div>
        <h1 className="text-lg font-bold text-[#0d2414]">{title}</h1>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      </div>
    </div>
  );
}

// ── Chat Section ──────────────────────────────────────────────────────────────

function ChatBubble({ msg, isLatest }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} ${isLatest ? 'animate-fade-in-up' : ''}`}>
      <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold shadow-sm ${
        isUser ? 'bg-[#1d5c28] text-white' : 'bg-[#9bc23c]/20 text-[#2d5c10]'
      }`}>
        {isUser ? 'G' : '🌿'}
      </div>
      <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
        isUser
          ? 'rounded-tr-sm bg-[#1d5c28] text-white'
          : 'rounded-tl-sm bg-white border border-[#9bc23c]/20 text-gray-800'
      }`}>
        <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
        {msg.timestamp && (
          <p className={`mt-1 text-[10px] ${isUser ? 'text-white/60' : 'text-gray-400'}`}>
            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>
    </div>
  );
}

function ChatSection({ user }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Welcome to Kuriftu Resort! 🌿 I'm your AI concierge. I can help you with room service, housekeeping, maintenance requests, and more. How can I assist you today?`,
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || sending) return;

    const userMsg = { role: 'user', content: text, timestamp: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setSending(true);

    try {
      const res = await apiPost('/api/chat', {
        user_key: `guest_${user?.roomNumber || '000'}`,
        message: text,
        room_number: user?.roomNumber || 'N/A',
      });

      const reply = res.response || res.message || 'Your request has been received and is being handled.';
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: reply, timestamp: new Date().toISOString() },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: "I've received your request and will have it attended to shortly. Thank you for your patience.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const quickRequests = [
    '🧹 I need room cleaning',
    '🍽️ I\'d like to order food',
    '🔧 There\'s a maintenance issue',
    '🛎️ I need extra towels',
  ];

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col">
      <PageHeader
        title="AI Concierge"
        subtitle={`Room ${user?.roomNumber || 'N/A'} · Kuriftu Resort`}
        icon={Icon.chat}
      />

      {/* Quick request chips */}
      <div className="flex flex-wrap gap-2 border-b border-[#9bc23c]/20 bg-white/50 px-6 py-3">
        {quickRequests.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => { setInput(q.substring(2)); }}
            className="rounded-full border border-[#9bc23c]/40 bg-white px-3 py-1.5 text-xs font-medium text-[#1d5c28] transition hover:bg-[#9bc23c]/10 hover:border-[#9bc23c]"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
        {messages.map((msg, i) => (
          <ChatBubble key={i} msg={msg} isLatest={i === messages.length - 1} />
        ))}
        {sending && (
          <div className="flex gap-3 animate-fade-in-up">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#9bc23c]/20 text-sm">🌿</div>
            <div className="rounded-2xl rounded-tl-sm border border-[#9bc23c]/20 bg-white px-4 py-3 shadow-sm">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 animate-bounce rounded-full bg-[#9bc23c]" style={{ animationDelay: '0ms' }} />
                <span className="h-2 w-2 animate-bounce rounded-full bg-[#9bc23c]" style={{ animationDelay: '150ms' }} />
                <span className="h-2 w-2 animate-bounce rounded-full bg-[#9bc23c]" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-[#9bc23c]/20 bg-white/80 px-6 py-4 backdrop-blur-sm">
        <div className="flex items-end gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            rows={1}
            placeholder="Type your request… (Enter to send)"
            className="flex-1 resize-none rounded-xl border border-[#9bc23c]/40 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-[#2d7a3a] focus:ring-4 focus:ring-[#9bc23c]/20 placeholder:text-gray-400"
            style={{ maxHeight: 120, overflowY: 'auto' }}
          />
          <button
            type="button"
            onClick={sendMessage}
            disabled={!input.trim() || sending}
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-[#1d5c28] text-white shadow-lg shadow-[#1d5c28]/30 transition hover:bg-[#2d7a3a] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg className="h-5 w-5 rotate-90" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── My Requests Section ───────────────────────────────────────────────────────

const statusConfig = {
  pending:     { label: 'Pending',     color: 'bg-amber-50 border-amber-200 text-amber-700', dot: 'bg-amber-400' },
  in_progress: { label: 'In Progress', color: 'bg-[#9bc23c]/10 border-[#9bc23c]/30 text-[#2d5c10]', dot: 'bg-[#9bc23c]' },
  completed:   { label: 'Completed',   color: 'bg-[#1d5c28]/5 border-[#1d5c28]/20 text-[#1d5c28]', dot: 'bg-[#2d7a3a]' },
};

function RequestsSection({ user }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    try {
      const queues = ['cleaners', 'maintenance', 'food', 'manager'];
      const results = await Promise.all(
        queues.map((q) => apiGet(`/api/feedback/task-state/queue/${q}`).catch(() => ({ items: [] })))
      );
      const all = results.flatMap((r) => r.items || []);
      setRequests(all);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 20000);
    return () => clearInterval(id);
  }, []);

  const cfg = (s) => statusConfig[s] || { label: s, color: 'bg-gray-50 border-gray-200 text-gray-600', dot: 'bg-gray-400' };

  return (
    <div>
      <PageHeader title="My Requests" subtitle="Track your submitted service requests" icon={Icon.inbox} />
      <div className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-gray-500">{requests.length} request{requests.length !== 1 ? 's' : ''} found</p>
          <button onClick={refresh} className="rounded-lg border border-[#9bc23c]/40 px-3 py-1.5 text-xs font-medium text-[#1d5c28] transition hover:bg-[#9bc23c]/10">
            Refresh
          </button>
        </div>

        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="rounded-xl border border-[#9bc23c]/10 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-3 w-32" />
                    <div className="skeleton h-4 w-48" />
                  </div>
                  <div className="skeleton h-6 w-20 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && requests.length === 0 && (
          <div className="animate-fade-in-up rounded-2xl border border-dashed border-[#9bc23c]/40 bg-white py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#9bc23c]/10">
              <svg className="h-8 w-8 text-[#9bc23c]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
              </svg>
            </div>
            <p className="font-semibold text-gray-700">No requests yet</p>
            <p className="mt-1 text-sm text-gray-500">Use the AI Concierge to submit your first request.</p>
            <p className="mt-3 text-xs text-[#9bc23c] font-medium">Try saying "I need room cleaning" or "Order food"</p>
          </div>
        )}

        {!loading && requests.length > 0 && (
          <div className="space-y-3 stagger-children">
            {requests.map((req, i) => {
              const c = cfg(req.state);
              return (
                <div key={req.instruction_id || i} className="rounded-xl border border-[#9bc23c]/20 bg-white p-4 shadow-sm hover:shadow-md transition">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                        {req.queue_name || 'Service'} · #{req.instruction_id}
                      </p>
                      <p className="mt-1 text-sm text-gray-700">{req.note || 'Service request submitted'}</p>
                    </div>
                    <span className={`flex-shrink-0 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${c.color}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
                      {c.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Chart theme ──────────────────────────────────────────────────────────────

const CHART_COLORS = ['#2d7a3a', '#9bc23c', '#c9b44a', '#c4845a', '#d4186e', '#52ae5e'];
const STATUS_COLORS = { pending: '#f59e0b', in_progress: '#9bc23c', completed: '#2d7a3a', cancelled: '#d4186e' };

function ChartTooltipContent({ active, payload, label }) {
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

function AnalyticsSection() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await apiGet('/api/analytics');
        setData(res);
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const statCards = data ? [
    { label: 'Total Requests', value: data.total_tasks ?? '—', color: 'bg-[#1d5c28]/5 border-[#1d5c28]/20', text: 'text-[#1d5c28]', icon: '📊' },
    { label: 'Occupancy Rate', value: data.occupancy_rate != null ? `${data.occupancy_rate}%` : '—', color: 'bg-[#9bc23c]/10 border-[#9bc23c]/30', text: 'text-[#3a6e10]', icon: '🏨' },
    { label: 'Need Cleaning', value: data.cleaning_needed ?? '—', color: 'bg-amber-50 border-amber-200', text: 'text-amber-700', icon: '🧹' },
    { label: 'Top Request', value: data.most_requested ?? '—', color: 'bg-[#d4186e]/5 border-[#d4186e]/20', text: 'text-[#d4186e]', small: true, icon: '🔥' },
  ] : [];

  // Transform data for charts
  const categoryData = data?.by_category
    ? Object.entries(data.by_category).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }))
    : [];

  const statusData = data?.by_status
    ? Object.entries(data.by_status).map(([name, value]) => ({ name, value, fill: STATUS_COLORS[name] || '#96d49e' }))
    : [];

  return (
    <div>
      <PageHeader title="Analytics" subtitle="Live hotel service overview" icon={Icon.analytics} />
      <div className="p-6">
        {loading && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="rounded-2xl border border-[#9bc23c]/10 bg-white p-5">
                  <div className="skeleton h-7 w-16 mb-2" />
                  <div className="skeleton h-3 w-24" />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-[#9bc23c]/10 bg-white p-5">
                <div className="skeleton h-4 w-40 mb-4" />
                <div className="skeleton h-48 w-full" />
              </div>
              <div className="rounded-2xl border border-[#9bc23c]/10 bg-white p-5">
                <div className="skeleton h-4 w-40 mb-4" />
                <div className="skeleton h-48 w-full rounded-full mx-auto max-w-[200px]" />
              </div>
            </div>
          </div>
        )}

        {!loading && !data && (
          <div className="animate-fade-in-up rounded-2xl border border-dashed border-[#9bc23c]/40 bg-white py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#9bc23c]/10">
              <svg className="h-8 w-8 text-[#9bc23c]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
            </div>
            <p className="font-semibold text-gray-700">Analytics unavailable</p>
            <p className="mt-1 text-sm text-gray-500">Start the backend server to see live data.</p>
          </div>
        )}

        {!loading && data && (
          <div className="space-y-6 animate-fade-in">
            {/* Stat cards */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 stagger-children">
              {statCards.map((card) => (
                <div key={card.label} className={`rounded-2xl border p-5 ${card.color}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className={`text-2xl font-extrabold ${card.text} ${card.small ? 'text-base truncate' : ''}`}>{card.value}</p>
                      <p className="mt-1 text-xs font-semibold text-gray-500">{card.label}</p>
                    </div>
                    <span className="text-xl opacity-60">{card.icon}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Bar chart — Requests by Category */}
              {categoryData.length > 0 && (
                <div className="rounded-2xl border border-[#9bc23c]/20 bg-white p-5 animate-fade-in-up">
                  <h3 className="mb-4 text-sm font-bold text-[#0d2414]">Requests by Category</h3>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={categoryData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e8edd8" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip content={<ChartTooltipContent />} cursor={{ fill: '#9bc23c', fillOpacity: 0.08 }} />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={40}>
                        {categoryData.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Donut chart — Status Breakdown */}
              {statusData.length > 0 && (
                <div className="rounded-2xl border border-[#9bc23c]/20 bg-white p-5 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                  <h3 className="mb-4 text-sm font-bold text-[#0d2414]">Status Breakdown</h3>
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={90}
                        paddingAngle={3}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {statusData.map((entry, i) => (
                          <Cell key={i} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip content={<ChartTooltipContent />} />
                      <Legend
                        verticalAlign="bottom"
                        iconType="circle"
                        iconSize={8}
                        formatter={(value) => <span className="text-xs text-gray-600 capitalize">{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Occupancy gauge */}
            {data.occupancy_rate != null && (
              <div className="rounded-2xl border border-[#9bc23c]/20 bg-white p-5 animate-fade-in-up">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-[#0d2414]">Hotel Occupancy</h3>
                  <span className="text-2xl font-extrabold text-[#2d7a3a]">{data.occupancy_rate}%</span>
                </div>
                <div className="h-4 overflow-hidden rounded-full bg-[#f0faf2]">
                  <div
                    className="h-4 rounded-full bg-gradient-to-r from-[#2d7a3a] via-[#9bc23c] to-[#b4d655] transition-all duration-1000"
                    style={{ width: `${data.occupancy_rate}%` }}
                  />
                </div>
                <div className="mt-2 flex justify-between text-[10px] text-gray-400 font-medium">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

const NAV = [
  { key: 'chat',      label: 'AI Concierge',  icon: Icon.chat },
  { key: 'requests',  label: 'My Requests',   icon: Icon.inbox },
  { key: 'analytics', label: 'Analytics',     icon: Icon.analytics },
];

export default function CustomerDashboard() {
  const { user, logout } = useAuth();
  const [activeSection, setActiveSection] = useState('chat');
  const [toasts, setToasts] = useState([]);

  const pushToast = (message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  };

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

      <main className="flex-1 lg:ml-64 min-h-screen" key={activeSection}>
        <div className="animate-fade-in">
          {activeSection === 'chat'      && <ChatSection user={user} />}
          {activeSection === 'requests'  && <RequestsSection user={user} />}
          {activeSection === 'analytics' && <AnalyticsSection />}
        </div>
      </main>

      <Toast toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((t) => t.id !== id))} />
    </div>
  );
}
