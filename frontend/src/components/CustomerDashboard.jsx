import React, { useEffect, useRef, useState } from 'react';
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

function ChatBubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
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
        <p className="leading-relaxed">{msg.content}</p>
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
          <ChatBubble key={i} msg={msg} />
        ))}
        {sending && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#9bc23c]/20 text-sm">🌿</div>
            <div className="rounded-2xl rounded-tl-sm border border-[#9bc23c]/20 bg-white px-4 py-3 shadow-sm">
              <div className="flex items-center gap-1">
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
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#9bc23c]/30 border-t-[#2d7a3a]" />
              <p className="text-sm text-gray-500">Loading requests…</p>
            </div>
          </div>
        )}

        {!loading && requests.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[#9bc23c]/40 bg-white py-16 text-center">
            <p className="text-4xl mb-3">📋</p>
            <p className="font-semibold text-gray-700">No requests yet</p>
            <p className="mt-1 text-sm text-gray-500">Use the AI Concierge to submit your first request.</p>
          </div>
        )}

        <div className="space-y-3">
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
      </div>
    </div>
  );
}

// ── Analytics Section ─────────────────────────────────────────────────────────

function AnalyticsSection() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
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
    fetch();
  }, []);

  const statCards = data ? [
    { label: 'Total Requests', value: data.total_tasks ?? '—', color: 'bg-[#1d5c28]/5 border-[#1d5c28]/20', text: 'text-[#1d5c28]' },
    { label: 'Occupancy Rate', value: data.occupancy_rate != null ? `${data.occupancy_rate}%` : '—', color: 'bg-[#9bc23c]/10 border-[#9bc23c]/30', text: 'text-[#3a6e10]' },
    { label: 'Need Cleaning', value: data.cleaning_needed ?? '—', color: 'bg-amber-50 border-amber-200', text: 'text-amber-700' },
    { label: 'Top Request', value: data.most_requested ?? '—', color: 'bg-[#d4186e]/5 border-[#d4186e]/20', text: 'text-[#d4186e]', small: true },
  ] : [];

  return (
    <div>
      <PageHeader title="Analytics" subtitle="Live hotel service overview" icon={Icon.analytics} />
      <div className="p-6">
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#9bc23c]/30 border-t-[#2d7a3a]" />
          </div>
        )}

        {!loading && !data && (
          <div className="rounded-2xl border border-dashed border-[#9bc23c]/40 bg-white py-16 text-center">
            <p className="text-4xl mb-3">📊</p>
            <p className="font-semibold text-gray-700">Analytics unavailable</p>
            <p className="mt-1 text-sm text-gray-500">Start the backend server to see live data.</p>
          </div>
        )}

        {!loading && data && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {statCards.map((card) => (
                <div key={card.label} className={`rounded-2xl border p-5 ${card.color}`}>
                  <p className={`text-2xl font-extrabold ${card.text} ${card.small ? 'text-base truncate' : ''}`}>{card.value}</p>
                  <p className="mt-1 text-xs font-semibold text-gray-500">{card.label}</p>
                </div>
              ))}
            </div>

            {data.by_category && Object.keys(data.by_category).length > 0 && (
              <div className="rounded-2xl border border-[#9bc23c]/20 bg-white p-5">
                <h3 className="mb-4 text-sm font-bold text-[#0d2414]">Requests by Category</h3>
                <div className="space-y-3">
                  {Object.entries(data.by_category).map(([cat, count]) => {
                    const max = Math.max(...Object.values(data.by_category), 1);
                    return (
                      <div key={cat} className="flex items-center gap-3">
                        <p className="w-24 text-xs font-medium text-gray-600 truncate capitalize">{cat}</p>
                        <div className="flex-1 overflow-hidden rounded-full bg-[#f0faf2] h-2.5">
                          <div className="h-2.5 rounded-full bg-gradient-to-r from-[#2d7a3a] to-[#9bc23c] transition-all duration-500"
                            style={{ width: `${(count / max) * 100}%` }} />
                        </div>
                        <span className="text-xs font-bold text-gray-700 w-6 text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {data.by_status && (
              <div className="rounded-2xl border border-[#9bc23c]/20 bg-white p-5">
                <h3 className="mb-4 text-sm font-bold text-[#0d2414]">Status Breakdown</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(data.by_status).map(([s, c]) => (
                    <span key={s} className="rounded-full bg-[#1d5c28]/5 border border-[#1d5c28]/10 px-3 py-1.5 text-xs font-semibold text-[#1d5c28]">
                      {s}: {c}
                    </span>
                  ))}
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

      <main className="flex-1 lg:ml-64 min-h-screen">
        {activeSection === 'chat'      && <ChatSection user={user} />}
        {activeSection === 'requests'  && <RequestsSection user={user} />}
        {activeSection === 'analytics' && <AnalyticsSection />}
      </main>

      <Toast toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((t) => t.id !== id))} />
    </div>
  );
}
