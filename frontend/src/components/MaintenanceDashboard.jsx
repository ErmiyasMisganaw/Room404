import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar, { Icon } from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { apiGet, apiPost } from '../services/api';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// ── Toast ───────────────────────────────────

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
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#c9b44a]/15 text-[#8a6a10]">
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

// ── Issue card ────────────────────────────────────────────────────────────────

function IssueCard({ issue, onResolve, onAccept, loadingId }) {
  const isLoading = loadingId === issue.id;
  const isDone = issue.status === 'completed';
  const needsAccept = !isDone && !issue.acceptedByMe;

  const priorityDot = { High: 'bg-[#d4186e]', Medium: 'bg-amber-400', Low: 'bg-gray-300', high: 'bg-[#d4186e]', medium: 'bg-amber-400', low: 'bg-gray-300' };

  return (
    <div className={`rounded-2xl border p-5 shadow-sm transition hover:shadow-md ${
      isDone ? 'border-[#1d5c28]/15 bg-[#1d5c28]/3 opacity-75' : 'border-[#c9b44a]/25 bg-white'
    }`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${priorityDot[issue.priority] || 'bg-gray-400'}`} />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Room</p>
            <p className="text-2xl font-extrabold text-[#0d2414]">#{issue.room}</p>
          </div>
        </div>
        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${
          isDone
            ? 'bg-[#1d5c28]/5 border-[#1d5c28]/20 text-[#1d5c28]'
            : 'bg-amber-50 border-amber-200 text-amber-700'
        }`}>
          {isDone ? '✓ Resolved' : 'Pending'}
        </span>
      </div>

      <p className="mb-4 rounded-lg bg-[#f4f6ed] px-3 py-2.5 text-sm text-gray-700 leading-relaxed">
        {issue.description || issue.title || 'Maintenance task'}
      </p>

      <button
        type="button"
        disabled={isDone || isLoading}
        onClick={() => (needsAccept ? onAccept(issue) : onResolve(issue))}
        className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition ${
          isDone
            ? 'bg-[#1d5c28]/5 text-[#1d5c28] cursor-default'
            : 'bg-[#c9b44a] text-white shadow-lg shadow-[#c9b44a]/25 hover:bg-[#b8a030] hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed'
        }`}
      >
        {isLoading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
        {isDone ? 'Resolved' : isLoading ? 'Saving…' : needsAccept ? 'Accept Task' : 'Mark as Resolved'}
      </button>
    </div>
  );
}

// ── Issues Section ────────────────────────────────────────────────────────────

const fallbackIssues = [
  { id: 'm-1', room: '208', title: 'Plumbing check', description: 'Sink leaking continuously — guest reported', status: 'pending', priority: 'High' },
  { id: 'm-2', room: '315', title: 'AC unit fault', description: 'Air conditioning not cooling properly', status: 'pending', priority: 'Medium' },
];

function IssuesSection({ user }) {
  const [issues, setIssues] = useState(fallbackIssues);
  const [loadingId, setLoadingId] = useState('');
  const [toasts, setToasts] = useState([]);

  const pushToast = (msg, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((p) => [...p, { id, msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000);
  };

  const refresh = async () => {
    try {
      const [inbox, feedback] = await Promise.all([
        apiGet('/api/inbox/maintenance'),
        apiGet('/api/feedback/task-state/queue/maintenance'),
      ]);
      const normalizedUserEmail = (user?.email || '').trim().toLowerCase();
      const fMap = new Map((feedback.items || []).map((f) => [f.instruction_id, f]));
      const mapped = (inbox.items || []).map((item, i) => {
        const record = fMap.get(item.instruction_id);
        const acceptedBy = (record?.accepted_by || '').trim().toLowerCase();
        const acceptedByMe = Boolean(acceptedBy && acceptedBy === normalizedUserEmail);
        const acceptedByOther = Boolean(acceptedBy && acceptedBy !== normalizedUserEmail);

        if (acceptedByOther && (record?.state || 'pending') !== 'completed') {
          return null;
        }

        return {
          id: item.instruction_id || `m-${i}`,
          room: (item.staff_instruction?.match(/\b\d{2,4}\b/) || ['N/A'])[0],
          title: 'Maintenance task',
          description: item.staff_instruction || '',
          status: record?.state || 'pending',
          priority: item.priority || 'Medium',
          acceptedByMe,
        };
      });
      const visible = mapped.filter(Boolean);
      if (visible.length) setIssues(visible);
      else setIssues([]);
    } catch { /* keep fallback */ }
  };

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 15000);
    return () => clearInterval(id);
  }, []);

  const handleResolve = async (issue) => {
    setLoadingId(issue.id);
    try {
      await apiPost('/api/feedback/task-state', {
        instruction_id: String(issue.id),
        queue_name: 'maintenance',
        state: 'completed',
        note: 'Maintenance task completed.',
      });
      setIssues((prev) => prev.map((i) => i.id === issue.id ? { ...i, status: 'completed' } : i));
      pushToast(`Room ${issue.room} issue resolved.`, 'success');
      refresh();
    } catch {
      pushToast('Could not resolve issue. Try again.', 'error');
    } finally {
      setLoadingId('');
    }
  };

  const handleAccept = async (issue) => {
    setLoadingId(issue.id);
    try {
      await apiPost('/api/maintenance/accept-task', {
        instruction_id: String(issue.id),
        note: 'Maintenance accepted task.',
      });
      pushToast(`Room ${issue.room} task accepted.`, 'success');
      await refresh();
    } catch {
      pushToast('Could not accept task. It may already be assigned.', 'error');
    } finally {
      setLoadingId('');
    }
  };

  const pending = issues.filter((i) => i.status !== 'completed');
  const resolved = issues.filter((i) => i.status === 'completed');

  return (
    <div>
      <PageHeader
        title="Maintenance Issues"
        subtitle={`${pending.length} pending · ${resolved.length} resolved`}
        icon={Icon.wrench}
        actions={
          <button onClick={refresh} className="rounded-lg border border-[#c9b44a]/40 px-3 py-1.5 text-xs font-medium text-[#8a6a10] hover:bg-[#c9b44a]/10 transition">
            Refresh
          </button>
        }
      />
      <div className="p-6">
        {issues.length === 0 ? (
          <div className="animate-fade-in-up rounded-2xl border border-dashed border-[#9bc23c]/40 bg-white py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#c9b44a]/10">
              <svg className="h-8 w-8 text-[#c9b44a]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.384-3.19m0 0a2.019 2.019 0 01-.424-2.89l4.88-6.344a2.019 2.019 0 013.067.084l4.589 5.99a2.019 2.019 0 01-.453 2.85l-5.31 3.37m-2.965.13l.243 3.1a1.01 1.01 0 001.517.742l2.498-1.587m-4.258 1.105l-1.395 1.181A1.01 1.01 0 005.4 19.31l.097-3.14" />
              </svg>
            </div>
            <p className="font-semibold text-gray-700">All clear!</p>
            <p className="mt-1 text-sm text-gray-500">No maintenance issues at this time.</p>
          </div>
        ) : (
          <>
            {pending.length > 0 && (
              <div className="mb-6">
                <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-400">Pending Issues</h2>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 stagger-children">
                  {pending.map((issue) => (
                    <IssueCard
                      key={issue.id}
                      issue={issue}
                      onResolve={handleResolve}
                      onAccept={handleAccept}
                      loadingId={loadingId}
                    />
                  ))}
                </div>
              </div>
            )}
            {resolved.length > 0 && (
              <div>
                <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-400">Resolved Today</h2>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 stagger-children">
                  {resolved.map((issue) => (
                    <IssueCard
                      key={issue.id}
                      issue={issue}
                      onResolve={handleResolve}
                      onAccept={handleAccept}
                      loadingId={loadingId}
                    />
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

// ── Chart helpers ─────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[#c9b44a]/20 bg-white px-3 py-2 text-xs shadow-lg">
      {label && <p className="font-semibold text-[#0d2414] mb-1">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="text-gray-600">
          <span className="inline-block h-2 w-2 rounded-full mr-1.5" style={{ backgroundColor: p.color || p.fill }} />
          {p.name}: <span className="font-bold text-[#0d2414]">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

// ── Analytics Section ─────────────────────────────────────────────��───────────

function AnalyticsSection({ user }) {
  const [issues, setIssues] = useState(fallbackIssues);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [inbox, feedback, lb] = await Promise.all([
          apiGet('/api/inbox/maintenance').catch(() => ({ items: [] })),
          apiGet('/api/feedback/task-state/queue/maintenance').catch(() => ({ items: [] })),
          apiGet('/api/staff/leaderboard').catch(() => []),
        ]);
        const fMap = new Map((feedback.items || []).map((f) => [f.instruction_id, f]));
        const mapped = (inbox.items || []).map((item, i) => {
          const record = fMap.get(item.instruction_id);
          const acceptedBy = (record?.accepted_by || '').trim().toLowerCase();
          const acceptedByMe = !acceptedBy || acceptedBy === (user?.email || '').trim().toLowerCase();

          if (!acceptedByMe && (record?.state || 'pending') !== 'completed') {
            return null;
          }

          return {
            id: item.instruction_id || `m-${i}`,
            room: (item.staff_instruction?.match(/\b\d{2,4}\b/) || ['N/A'])[0],
            status: record?.state || 'pending',
            priority: item.priority || 'Medium',
          };
        }).filter(Boolean);
        if (mapped.length) setIssues(mapped);
        else setIssues([]);
        setAnalyticsData(null); // analytics removed — use /manager for analytics
        setLeaderboard(Array.isArray(lb) ? lb : lb?.staff || []);
      } catch { /* keep fallback */ }
    };
    fetchData();
  }, []);

  const total = issues.length;
  const resolved = issues.filter((i) => i.status === 'completed').length;
  const pendingCount = issues.filter((i) => i.status !== 'completed').length;
  const rate = total > 0 ? Math.round((resolved / total) * 100) : 0;

  const byPriority = useMemo(() => {
    const counts = { High: 0, Medium: 0, Low: 0 };
    issues.forEach((i) => { if (counts[i.priority] !== undefined) counts[i.priority]++; });
    return counts;
  }, [issues]);

  const statusPieData = [
    { name: 'Resolved', value: resolved, fill: '#2d7a3a' },
    { name: 'Pending', value: pendingCount, fill: '#f59e0b' },
  ].filter((d) => d.value > 0);

  const priorityBarData = Object.entries(byPriority).map(([name, value]) => ({ name, value }));
  const PRIORITY_COLORS = { High: '#d4186e', Medium: '#f59e0b', Low: '#96d49e' };

  return (
    <div>
      <PageHeader title="Analytics" subtitle="Maintenance performance & hotel overview" icon={Icon.analytics} />
      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 stagger-children">
          {[
            { label: 'Total Issues', value: total, color: 'bg-[#c9b44a]/10 border-[#c9b44a]/30', text: 'text-[#8a6a10]' },
            { label: 'Resolved', value: resolved, color: 'bg-[#9bc23c]/10 border-[#9bc23c]/30', text: 'text-[#3a6e10]' },
            { label: 'Pending', value: pendingCount, color: 'bg-amber-50 border-amber-200', text: 'text-amber-700' },
            { label: 'Resolution Rate', value: `${rate}%`, color: 'bg-[#1d5c28]/5 border-[#1d5c28]/20', text: 'text-[#1d5c28]' },
          ].map((card) => (
            <div key={card.label} className={`rounded-2xl border p-5 ${card.color}`}>
              <p className={`text-2xl font-extrabold ${card.text}`}>{card.value}</p>
              <p className="mt-1 text-xs font-semibold text-gray-500">{card.label}</p>
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Resolution donut */}
          {statusPieData.length > 0 && (
            <div className="rounded-2xl border border-[#c9b44a]/25 bg-white p-5 animate-fade-in-up">
              <h3 className="mb-2 text-sm font-bold text-[#0d2414]">Resolution Status</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={statusPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={4} dataKey="value" strokeWidth={0}>
                    {statusPieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                  <Legend verticalAlign="bottom" iconType="circle" iconSize={8} formatter={(v) => <span className="text-xs text-gray-600">{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Priority bar chart */}
          <div className="rounded-2xl border border-[#c9b44a]/25 bg-white p-5 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <h3 className="mb-2 text-sm font-bold text-[#0d2414]">Issues by Priority</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={priorityBarData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8edd8" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: '#c9b44a', fillOpacity: 0.08 }} />
                <Bar dataKey="value" name="Issues" radius={[6, 6, 0, 0]} maxBarSize={50}>
                  {priorityBarData.map((entry) => <Cell key={entry.name} fill={PRIORITY_COLORS[entry.name] || '#c9b44a'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Resolution gauge */}
        {total > 0 && (
          <div className="rounded-2xl border border-[#c9b44a]/25 bg-white p-5 animate-fade-in-up">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-[#0d2414]">Resolution Progress</h3>
              <span className="text-2xl font-extrabold text-[#8a6a10]">{rate}%</span>
            </div>
            <div className="h-4 overflow-hidden rounded-full bg-[#f4f6ed]">
              <div className="h-4 rounded-full bg-gradient-to-r from-[#c9b44a] via-[#9bc23c] to-[#2d7a3a] transition-all duration-1000" style={{ width: `${rate}%` }} />
            </div>
            <div className="mt-2 flex justify-between text-[10px] text-gray-400 font-medium">
              <span>0%</span><span>50%</span><span>100%</span>
            </div>
          </div>
        )}

        {/* Staff leaderboard */}
        {leaderboard.filter((s) => s.pool === 'maintenance').length > 0 && (
          <div className="rounded-2xl border border-[#c9b44a]/25 bg-white p-5 animate-fade-in-up">
            <h3 className="mb-4 text-sm font-bold text-[#0d2414]">Maintenance Team</h3>
            <div className="space-y-2">
              {leaderboard.filter((s) => s.pool === 'maintenance').map((staff, i) => (
                <div key={staff.id || i} className="flex items-center gap-3 rounded-xl bg-[#f4f6ed] px-4 py-3">
                  <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                    i === 0 ? 'bg-[#c9b44a] text-white' : 'bg-gray-200 text-gray-600'
                  }`}>{i + 1}</span>
                  <p className="flex-1 text-sm font-semibold text-gray-800">{staff.name}</p>
                  <p className="text-xs font-bold text-[#8a6a10]">{staff.completed_task_count ?? 0} resolved</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hotel overview */}
        {analyticsData && (
          <div className="rounded-2xl border border-[#c9b44a]/25 bg-white p-5 animate-fade-in-up">
            <h3 className="mb-4 text-sm font-bold text-[#0d2414]">Hotel Overview</h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Total Tasks', value: analyticsData.total_tasks ?? '—', text: 'text-[#1d5c28]' },
                { label: 'Occupancy', value: analyticsData.occupancy_rate != null ? `${analyticsData.occupancy_rate}%` : '—', text: 'text-[#3a6e10]' },
                { label: 'Need Cleaning', value: analyticsData.cleaning_needed ?? '—', text: 'text-amber-600' },
              ].map((s) => (
                <div key={s.label} className="rounded-xl bg-[#f4f6ed] p-3 text-center">
                  <p className={`text-xl font-bold ${s.text}`}>{s.value}</p>
                  <p className="text-xs text-gray-500">{s.label}</p>
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
  { key: 'issues',    label: 'Issues',     icon: Icon.wrench },
  { key: 'analytics', label: 'Analytics',  icon: Icon.analytics },
];

export default function MaintenanceDashboard() {
  const navigate = useNavigate();
  const { user: authUser, logout } = useAuth();
  const user = authUser || { id: 'MT-001', name: 'Technician', role: 'maintenance' };
  const [activeSection, setActiveSection] = useState('issues');

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
          {activeSection === 'issues'    && <IssuesSection user={user} />}
          {activeSection === 'analytics' && <AnalyticsSection user={user} />}
        </div>
      </main>
    </div>
  );
}
