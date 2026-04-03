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

function IssueCard({ issue, onResolve, loadingId }) {
  const isLoading = loadingId === issue.id;
  const isDone = issue.status === 'completed';

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
        onClick={() => onResolve(issue)}
        className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition ${
          isDone
            ? 'bg-[#1d5c28]/5 text-[#1d5c28] cursor-default'
            : 'bg-[#c9b44a] text-white shadow-lg shadow-[#c9b44a]/25 hover:bg-[#b8a030] hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed'
        }`}
      >
        {isLoading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
        {isDone ? 'Resolved' : isLoading ? 'Resolving…' : 'Mark as Resolved'}
      </button>
    </div>
  );
}

// ── Issues Section ────────────────────────────────────────────────────────────

const fallbackIssues = [
  { id: 'm-1', room: '208', title: 'Plumbing check', description: 'Sink leaking continuously — guest reported', status: 'pending', priority: 'High' },
  { id: 'm-2', room: '315', title: 'AC unit fault', description: 'Air conditioning not cooling properly', status: 'pending', priority: 'Medium' },
];

function IssuesSection() {
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
      const fMap = new Map((feedback.items || []).map((f) => [f.instruction_id, f.state]));
      const mapped = (inbox.items || []).map((item, i) => ({
        id: item.instruction_id || `m-${i}`,
        room: (item.staff_instruction?.match(/\b\d{2,4}\b/) || ['N/A'])[0],
        title: 'Maintenance task',
        description: item.staff_instruction || '',
        status: fMap.get(item.instruction_id) || 'pending',
        priority: item.priority || 'Medium',
      }));
      if (mapped.length) setIssues(mapped);
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
          <div className="rounded-2xl border border-dashed border-[#9bc23c]/40 bg-white py-16 text-center">
            <p className="text-4xl mb-3">✅</p>
            <p className="font-semibold text-gray-700">All clear!</p>
            <p className="mt-1 text-sm text-gray-500">No maintenance issues at this time.</p>
          </div>
        ) : (
          <>
            {pending.length > 0 && (
              <div className="mb-6">
                <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-400">Pending Issues</h2>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {pending.map((issue) => (
                    <IssueCard key={issue.id} issue={issue} onResolve={handleResolve} loadingId={loadingId} />
                  ))}
                </div>
              </div>
            )}
            {resolved.length > 0 && (
              <div>
                <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-400">Resolved Today</h2>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {resolved.map((issue) => (
                    <IssueCard key={issue.id} issue={issue} onResolve={handleResolve} loadingId={loadingId} />
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

// ── Analytics Section ─────────────────────────────────────────────────────────

function AnalyticsSection() {
  const [issues, setIssues] = useState(fallbackIssues);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [inbox, feedback, analytics, lb] = await Promise.all([
          apiGet('/api/inbox/maintenance').catch(() => ({ items: [] })),
          apiGet('/api/feedback/task-state/queue/maintenance').catch(() => ({ items: [] })),
          apiGet('/api/analytics').catch(() => null),
          apiGet('/api/staff/leaderboard').catch(() => []),
        ]);
        const fMap = new Map((feedback.items || []).map((f) => [f.instruction_id, f.state]));
        const mapped = (inbox.items || []).map((item, i) => ({
          id: item.instruction_id || `m-${i}`,
          room: (item.staff_instruction?.match(/\b\d{2,4}\b/) || ['N/A'])[0],
          status: fMap.get(item.instruction_id) || 'pending',
          priority: item.priority || 'Medium',
        }));
        if (mapped.length) setIssues(mapped);
        setAnalyticsData(analytics);
        setLeaderboard(Array.isArray(lb) ? lb : lb?.staff || []);
      } catch { /* keep fallback */ }
    };
    fetch();
  }, []);

  const total = issues.length;
  const resolved = issues.filter((i) => i.status === 'completed').length;
  const pending = issues.filter((i) => i.status !== 'completed').length;
  const rate = total > 0 ? Math.round((resolved / total) * 100) : 0;

  const byPriority = useMemo(() => {
    const counts = { High: 0, Medium: 0, Low: 0 };
    issues.forEach((i) => { if (counts[i.priority] !== undefined) counts[i.priority]++; });
    return counts;
  }, [issues]);

  return (
    <div>
      <PageHeader title="Analytics" subtitle="Maintenance performance & hotel overview" icon={Icon.analytics} />
      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label: 'Total Issues', value: total, color: 'bg-[#c9b44a]/10 border-[#c9b44a]/30', text: 'text-[#8a6a10]' },
            { label: 'Resolved', value: resolved, color: 'bg-[#9bc23c]/10 border-[#9bc23c]/30', text: 'text-[#3a6e10]' },
            { label: 'Pending', value: pending, color: 'bg-amber-50 border-amber-200', text: 'text-amber-700' },
            { label: 'Resolution Rate', value: `${rate}%`, color: 'bg-[#1d5c28]/5 border-[#1d5c28]/20', text: 'text-[#1d5c28]' },
          ].map((card) => (
            <div key={card.label} className={`rounded-2xl border p-5 ${card.color}`}>
              <p className={`text-2xl font-extrabold ${card.text}`}>{card.value}</p>
              <p className="mt-1 text-xs font-semibold text-gray-500">{card.label}</p>
            </div>
          ))}
        </div>

        {/* Progress */}
        {total > 0 && (
          <div className="rounded-2xl border border-[#c9b44a]/25 bg-white p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-[#0d2414]">Resolution Progress</p>
              <p className="text-sm font-bold text-[#8a6a10]">{rate}%</p>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-[#f4f6ed]">
              <div className="h-3 rounded-full bg-gradient-to-r from-[#c9b44a] to-[#9bc23c] transition-all duration-700"
                style={{ width: `${rate}%` }} />
            </div>
          </div>
        )}

        {/* By priority */}
        <div className="rounded-2xl border border-[#c9b44a]/25 bg-white p-5">
          <h3 className="mb-4 text-sm font-bold text-[#0d2414]">Issues by Priority</h3>
          <div className="space-y-3">
            {Object.entries(byPriority).map(([priority, count]) => {
              const max = Math.max(...Object.values(byPriority), 1);
              const barColor = { High: 'from-[#d4186e] to-[#e8429a]', Medium: 'from-amber-400 to-amber-300', Low: 'from-gray-300 to-gray-200' };
              return (
                <div key={priority} className="flex items-center gap-3">
                  <p className="w-16 text-xs font-semibold text-gray-600">{priority}</p>
                  <div className="flex-1 overflow-hidden rounded-full bg-[#f4f6ed] h-2.5">
                    <div className={`h-2.5 rounded-full bg-gradient-to-r ${barColor[priority]} transition-all duration-500`}
                      style={{ width: `${(count / max) * 100}%` }} />
                  </div>
                  <span className="text-xs font-bold text-gray-700 w-5 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Staff leaderboard - maintenance staff */}
        {leaderboard.filter((s) => s.pool === 'maintenance').length > 0 && (
          <div className="rounded-2xl border border-[#c9b44a]/25 bg-white p-5">
            <h3 className="mb-4 text-sm font-bold text-[#0d2414]">Maintenance Team Performance</h3>
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

        {/* Hotel overview from analytics */}
        {analyticsData && (
          <div className="rounded-2xl border border-[#c9b44a]/25 bg-white p-5">
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
                <p className="text-xl font-bold text-amber-600">{analyticsData.cleaning_needed ?? '—'}</p>
                <p className="text-xs text-gray-500">Need Cleaning</p>
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
  { key: 'issues',    label: 'Issues',     icon: Icon.wrench },
  { key: 'analytics', label: 'Analytics',  icon: Icon.analytics },
];

export default function MaintenanceDashboard() {
  const { user: authUser, logout } = useAuth();
  const user = authUser || { id: 'MT-001', name: 'Technician', role: 'maintenance' };
  const [activeSection, setActiveSection] = useState('issues');

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
        {activeSection === 'issues'    && <IssuesSection />}
        {activeSection === 'analytics' && <AnalyticsSection />}
      </main>
    </div>
  );
}
