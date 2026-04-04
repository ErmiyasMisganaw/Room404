import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar, { Icon } from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { apiGet, apiPost } from '../services/api';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// ── Shared helpers ─────────────────────────────────────────────────────────────

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
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1d5c28]/10 text-[#1d5c28]">
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

// ── Hooks ─────────────────────────────────────────────────────────────────────

function useCooldown(initialSeconds = 90) {
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  useEffect(() => {
    if (remainingSeconds <= 0) return;
    const id = window.setInterval(() => setRemainingSeconds((s) => Math.max(s - 1, 0)), 1000);
    return () => window.clearInterval(id);
  }, [remainingSeconds]);

  return {
    remainingSeconds,
    isCoolingDown: remainingSeconds > 0,
    startCooldown: (s = initialSeconds) => setRemainingSeconds(s),
  };
}

const fallbackAssigned = [
  { id: 'task-1', roomNumber: '302', etaMinutes: 20, status: 'In Progress', assignedCleaners: ['You'] },
  { id: 'task-2', roomNumber: '115', etaMinutes: 35, status: 'Pending', assignedCleaners: ['You'] },
];
const fallbackQueue = [
  { id: 'q-1', roomNumber: '210', etaMinutes: 25, status: 'Pending', assignedCleaners: [] },
  { id: 'q-2', roomNumber: '407', etaMinutes: 40, status: 'Pending', assignedCleaners: [] },
];

function useTasks(cleanerName, cleanerEmail = '') {
  const [assignedTasks, setAssignedTasks] = useState(fallbackAssigned);
  const [availableRooms, setAvailableRooms] = useState(fallbackQueue);

  const toRoom = (txt, id) => (txt?.match(/\b\d{2,4}\b/) || [id.slice(-3)])[0];
  const toEta = (p) => p === 'High' ? 10 : p === 'Medium' ? 20 : 35;

  const refresh = async () => {
    try {
      const [inbox, feedback] = await Promise.all([
        apiGet('/api/inbox/cleaners'),
        apiGet('/api/feedback/task-state/queue/cleaners'),
      ]);

      const normalizedCleanerEmail = (cleanerEmail || '').trim().toLowerCase();
      const fMap = new Map((feedback.items || []).map((f) => [f.instruction_id, f]));
      const all = (inbox.items || []).map((item) => {
        const fb = fMap.get(item.instruction_id);
        const acceptedBy = (fb?.accepted_by || '').trim().toLowerCase();
        const acceptedByMe = Boolean(acceptedBy && normalizedCleanerEmail && acceptedBy === normalizedCleanerEmail);
        const acceptedByOther = Boolean(acceptedBy && normalizedCleanerEmail && acceptedBy !== normalizedCleanerEmail);

        if (acceptedByOther) {
          return null;
        }

        const normalizedState = (fb?.state || 'pending').trim().toLowerCase();
        const displayStatus = normalizedState === 'in_progress'
          ? 'In Progress'
          : normalizedState === 'completed'
            ? 'Completed'
            : 'Pending';

        return {
          id: item.instruction_id,
          roomNumber: toRoom(item.staff_instruction, item.instruction_id),
          etaMinutes: toEta(item.priority),
          status: displayStatus,
          assignedToMe: acceptedByMe,
          assignedCleaners: [cleanerName],
          rawInstruction: item.staff_instruction,
          priority: item.priority,
        };
      });
      const validItems = all.filter(Boolean);
      setAssignedTasks(
        validItems.filter(
          (task) => task.assignedToMe || (task.status !== 'Pending' && task.status !== 'pending')
        )
      );
      setAvailableRooms(
        validItems
          .filter((task) => !task.assignedToMe && (task.status === 'Pending' || task.status === 'pending'))
          .map((task) => ({ ...task, assignedCleaners: [] }))
      );
    } catch {
      /* keep fallback */
    }
  };

  useEffect(() => { refresh(); const id = setInterval(refresh, 15000); return () => clearInterval(id); }, []);

  const acceptTask = async (instructionId) => {
    await apiPost('/api/cleaners/accept-task', {
      instruction_id: instructionId,
      note: `Accepted by ${cleanerName}`,
    });
    await refresh();
  };

  const updateStatus = (taskId, nextStatus) => {
    setAssignedTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, status: nextStatus } : t));
  };

  return { assignedTasks, availableRooms, acceptTask, updateStatus, refresh };
}

// ── Status Badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const cfg = {
    Completed:   'bg-[#1d5c28]/5 border-[#1d5c28]/20 text-[#1d5c28]',
    'In Progress':'bg-[#9bc23c]/10 border-[#9bc23c]/30 text-[#3a6e10]',
    Pending:     'bg-amber-50 border-amber-200 text-amber-700',
    completed:   'bg-[#1d5c28]/5 border-[#1d5c28]/20 text-[#1d5c28]',
    in_progress: 'bg-[#9bc23c]/10 border-[#9bc23c]/30 text-[#3a6e10]',
    pending:     'bg-amber-50 border-amber-200 text-amber-700',
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${cfg[status] || 'bg-gray-100 border-gray-200 text-gray-600'}`}>
      {status}
    </span>
  );
}

// ── My Tasks Section ──────────────────────────────────────────────────────────

function TaskCard({ task, disabled, onConfirm, loadingId }) {
  const isLoading = loadingId === task.id;
  const isDone = task.status === 'Completed' || task.status === 'completed' || task.status === 'Done';
  const nextLabel = task.status === 'Pending' || task.status === 'pending' ? 'Start Task' : isDone ? 'Completed' : 'Mark Complete';

  const priorityColor = { High: 'text-[#d4186e]', Medium: 'text-amber-600', Low: 'text-gray-500' };

  return (
    <div className="rounded-2xl border border-[#9bc23c]/20 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Room</p>
          <p className="text-2xl font-extrabold text-[#0d2414]">#{task.roomNumber}</p>
        </div>
        <StatusBadge status={task.status} />
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
        <div className="rounded-lg bg-[#f4f6ed] px-3 py-2">
          <p className="text-xs text-gray-500">ETA</p>
          <p className="font-semibold text-gray-800">{task.etaMinutes} min</p>
        </div>
        {task.priority && (
          <div className="rounded-lg bg-[#f4f6ed] px-3 py-2">
            <p className="text-xs text-gray-500">Priority</p>
            <p className={`font-semibold ${priorityColor[task.priority] || 'text-gray-800'}`}>{task.priority}</p>
          </div>
        )}
      </div>

      {task.rawInstruction && (
        <p className="mb-4 rounded-lg bg-[#f4f6ed] px-3 py-2 text-xs text-gray-600 leading-relaxed">{task.rawInstruction}</p>
      )}

      <button
        type="button"
        disabled={disabled || isDone || isLoading}
        onClick={() => onConfirm(task)}
        className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition ${
          isDone
            ? 'bg-[#1d5c28]/5 text-[#1d5c28] cursor-default'
            : 'bg-[#1d5c28] text-white shadow-lg shadow-[#1d5c28]/20 hover:bg-[#2d7a3a] hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0'
        }`}
      >
        {isLoading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
        {nextLabel}
      </button>
    </div>
  );
}

function MyTasksSection({ user }) {
  const { assignedTasks, updateStatus, refresh } = useTasks(user?.name || 'You', user?.email || '');
  const { remainingSeconds, isCoolingDown, startCooldown } = useCooldown(90);
  const [loadingId, setLoadingId] = useState('');
  const [toasts, setToasts] = useState([]);

  const pushToast = (msg, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((p) => [...p, { id, msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000);
  };

  const mm = String(Math.floor(remainingSeconds / 60)).padStart(2, '0');
  const ss = String(remainingSeconds % 60).padStart(2, '0');

  const handleConfirm = async (task) => {
    if (isCoolingDown) { pushToast('Cooldown active — please wait.', 'error'); return; }
    try {
      setLoadingId(task.id);
      const isPending = task.status === 'Pending' || task.status === 'pending';
      const nextState = isPending ? 'in_progress' : 'completed';
      const nextDisplay = isPending ? 'In Progress' : 'Completed';

      await apiPost('/api/feedback/task-state', {
        instruction_id: task.id,
        queue_name: 'cleaners',
        state: nextState,
        note: isPending ? 'Cleaner started task.' : 'Cleaning task completed.',
      });

      updateStatus(task.id, nextDisplay);
      if (!isPending) startCooldown(90);
      pushToast(`Room ${task.roomNumber} → ${nextDisplay}`, 'success');
      await refresh();
    } catch {
      pushToast('Could not update task. Try again.', 'error');
    } finally {
      setLoadingId('');
    }
  };

  return (
    <div>
      <PageHeader
        title="My Tasks"
        subtitle={`${assignedTasks.length} assigned task${assignedTasks.length !== 1 ? 's' : ''}`}
        icon={Icon.tasks}
        actions={
          <button onClick={refresh} className="rounded-lg border border-[#9bc23c]/40 px-3 py-1.5 text-xs font-medium text-[#1d5c28] hover:bg-[#9bc23c]/10 transition">
            Refresh
          </button>
        }
      />
      <div className="p-6">
        {/* Cooldown banner */}
        {isCoolingDown && (
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <span className="text-amber-500">⏱️</span>
            <p className="text-sm font-medium text-amber-700">Cooldown active: <span className="font-bold">{mm}:{ss}</span> remaining before next task.</p>
          </div>
        )}

        {assignedTasks.length === 0 ? (
          <div className="animate-fade-in-up rounded-2xl border border-dashed border-[#9bc23c]/40 bg-white py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#9bc23c]/10">
              <svg className="h-8 w-8 text-[#9bc23c]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="font-semibold text-gray-700">No assigned tasks</p>
            <p className="mt-1 text-sm text-gray-500">Check the Room Queue for available tasks.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 stagger-children">
            {assignedTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                disabled={isCoolingDown}
                onConfirm={handleConfirm}
                loadingId={loadingId}
              />
            ))}
          </div>
        )}
      </div>
      <Toast toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((t) => t.id !== id))} />
    </div>
  );
}

// ── Room Queue Section ────────────────────────────────────────────────────────

function QueueSection({ user }) {
  const { availableRooms, acceptTask, refresh } = useTasks(user?.name || 'You', user?.email || '');
  const [loadingId, setLoadingId] = useState('');
  const [toasts, setToasts] = useState([]);

  const pushToast = (msg, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((p) => [...p, { id, msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000);
  };

  const handleTake = async (roomId) => {
    try {
      setLoadingId(roomId);
      await acceptTask(roomId);
      pushToast('Task accepted and moved to My Tasks.', 'success');
    } catch {
      pushToast('Failed to assign task.', 'error');
    } finally {
      setLoadingId('');
    }
  };

  return (
    <div>
      <PageHeader
        title="Room Queue"
        subtitle="Available rooms awaiting housekeeping"
        icon={Icon.queue}
        actions={
          <button onClick={refresh} className="rounded-lg border border-[#9bc23c]/40 px-3 py-1.5 text-xs font-medium text-[#1d5c28] hover:bg-[#9bc23c]/10 transition">
            Refresh
          </button>
        }
      />
      <div className="p-6">
        {availableRooms.length === 0 ? (
          <div className="animate-fade-in-up rounded-2xl border border-dashed border-[#9bc23c]/40 bg-white py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#9bc23c]/10">
              <svg className="h-8 w-8 text-[#9bc23c]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="font-semibold text-gray-700">Queue is clear</p>
            <p className="mt-1 text-sm text-gray-500">All rooms have been attended to.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 stagger-children">
            {availableRooms.map((room) => {
              const isLoading = loadingId === room.id;
              return (
                <div key={room.id} className="rounded-2xl border border-[#9bc23c]/20 bg-white p-5 shadow-sm hover:shadow-md transition">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Room</p>
                      <p className="text-2xl font-extrabold text-[#0d2414]">#{room.roomNumber}</p>
                    </div>
                    <span className="rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1 text-xs font-semibold text-amber-700">
                      Available
                    </span>
                  </div>
                  <div className="rounded-lg bg-[#f4f6ed] px-3 py-2 mb-4 text-sm">
                    <p className="text-xs text-gray-500">Est. Time</p>
                    <p className="font-semibold text-gray-800">{room.etaMinutes} min</p>
                  </div>
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleTake(room.id)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#9bc23c] py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#9bc23c]/20 hover:bg-[#8ab030] hover:-translate-y-0.5 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
                    {isLoading ? 'Assigning…' : 'Take This Room'}
                  </button>
                </div>
              );
            })}
          </div>
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
    <div className="rounded-lg border border-[#9bc23c]/20 bg-white px-3 py-2 text-xs shadow-lg">
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

// ── Analytics Section ─────────────────────────────────────────────────────────

function AnalyticsSection({ user }) {
  const { assignedTasks } = useTasks(user?.name || 'You', user?.email || '');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [analytics, lb] = await Promise.all([
          Promise.resolve(null), // analytics removed — use /manager for analytics
          apiGet('/api/staff/leaderboard').catch(() => []),
        ]);
        setAnalyticsData(analytics);
        setLeaderboard(Array.isArray(lb) ? lb : lb?.staff || []);
      } catch { /* silent */ }
    };
    fetchData();
    const id = setInterval(fetchData, 30000);
    return () => clearInterval(id);
  }, []);

  const completed = assignedTasks.filter((t) => t.status === 'Completed' || t.status === 'completed').length;
  const inProgress = assignedTasks.filter((t) => t.status === 'In Progress' || t.status === 'in_progress').length;
  const pending = assignedTasks.filter((t) => t.status === 'Pending' || t.status === 'pending').length;
  const total = assignedTasks.length;
  const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const taskPieData = [
    { name: 'Completed', value: completed, fill: '#2d7a3a' },
    { name: 'In Progress', value: inProgress, fill: '#9bc23c' },
    { name: 'Pending', value: pending, fill: '#f59e0b' },
  ].filter((d) => d.value > 0);

  const leaderData = leaderboard
    .filter((s) => s.pool === 'cleaners' || !s.pool)
    .slice(0, 5)
    .map((s) => ({ name: s.name?.split(' ')[0] || 'Staff', tasks: s.completed_task_count ?? s.completed ?? 0 }));

  return (
    <div>
      <PageHeader title="Analytics" subtitle="Your performance & hotel overview" icon={Icon.analytics} />
      <div className="p-6 space-y-6">
        {/* Personal stats */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 stagger-children">
          {[
            { label: 'Total Assigned', value: total, color: 'bg-[#1d5c28]/5 border-[#1d5c28]/20', text: 'text-[#1d5c28]' },
            { label: 'Completed', value: completed, color: 'bg-[#9bc23c]/10 border-[#9bc23c]/30', text: 'text-[#3a6e10]' },
            { label: 'In Progress', value: inProgress, color: 'bg-amber-50 border-amber-200', text: 'text-amber-700' },
            { label: 'Completion Rate', value: `${rate}%`, color: 'bg-[#d4186e]/5 border-[#d4186e]/20', text: 'text-[#d4186e]' },
          ].map((card) => (
            <div key={card.label} className={`rounded-2xl border p-5 ${card.color}`}>
              <p className={`text-2xl font-extrabold ${card.text}`}>{card.value}</p>
              <p className="mt-1 text-xs font-semibold text-gray-500">{card.label}</p>
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Task status donut */}
          {taskPieData.length > 0 && (
            <div className="rounded-2xl border border-[#9bc23c]/20 bg-white p-5 animate-fade-in-up">
              <h3 className="mb-2 text-sm font-bold text-[#0d2414]">Task Breakdown</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={taskPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value" strokeWidth={0}>
                    {taskPieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                  <Legend verticalAlign="bottom" iconType="circle" iconSize={8} formatter={(v) => <span className="text-xs text-gray-600">{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Leaderboard bar chart */}
          {leaderData.length > 0 && (
            <div className="rounded-2xl border border-[#9bc23c]/20 bg-white p-5 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              <h3 className="mb-2 text-sm font-bold text-[#0d2414]">Team Performance</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={leaderData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8edd8" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: '#9bc23c', fillOpacity: 0.08 }} />
                  <Bar dataKey="tasks" name="Completed" radius={[6, 6, 0, 0]} maxBarSize={40} fill="#2d7a3a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Completion gauge */}
        {total > 0 && (
          <div className="rounded-2xl border border-[#9bc23c]/20 bg-white p-5 animate-fade-in-up">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-[#0d2414]">Overall Completion</h3>
              <span className="text-2xl font-extrabold text-[#2d7a3a]">{rate}%</span>
            </div>
            <div className="h-4 overflow-hidden rounded-full bg-[#f4f6ed]">
              <div className="h-4 rounded-full bg-gradient-to-r from-[#2d7a3a] via-[#9bc23c] to-[#b4d655] transition-all duration-1000" style={{ width: `${rate}%` }} />
            </div>
            <div className="mt-2 flex justify-between text-[10px] text-gray-400 font-medium">
              <span>0%</span><span>50%</span><span>100%</span>
            </div>
          </div>
        )}

        {/* Hotel overview */}
        {analyticsData && (
          <div className="rounded-2xl border border-[#9bc23c]/20 bg-white p-5 animate-fade-in-up">
            <h3 className="mb-4 text-sm font-bold text-[#0d2414]">Hotel Overview</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
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
  { key: 'tasks',     label: 'My Tasks',    icon: Icon.tasks },
  { key: 'queue',     label: 'Room Queue',  icon: Icon.queue },
  { key: 'analytics', label: 'Analytics',   icon: Icon.analytics },
];

export default function CleanerDashboard() {
  const navigate = useNavigate();
  const { user: authUser, logout } = useAuth();
  const user = authUser || { id: 'CL-001', name: 'Housekeeper', role: 'cleaner' };
  const [activeSection, setActiveSection] = useState('tasks');

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
          {activeSection === 'tasks'     && <MyTasksSection user={user} />}
          {activeSection === 'queue'     && <QueueSection user={user} />}
          {activeSection === 'analytics' && <AnalyticsSection user={user} />}
        </div>
      </main>
    </div>
  );
}
