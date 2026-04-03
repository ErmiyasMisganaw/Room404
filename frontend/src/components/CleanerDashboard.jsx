import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { apiGet, apiPost } from '../services/api';

const AuthContext = createContext({
  user: { id: 'CL-104', name: 'Sami T.', role: 'Cleaner', currentStatus: 'Available' },
  logout: () => {},
});

// ---------------------------------------------------------------------------
// Initial mock data
// ---------------------------------------------------------------------------

const initialAssignedTasks = [
  { id: 'task-1', roomNumber: '302', etaMinutes: 20, status: 'In Progress', assignedCleaners: ['Sami T.'], backendId: null },
  { id: 'task-2', roomNumber: '115', etaMinutes: 35, status: 'Pending',     assignedCleaners: ['Sami T.', 'Helen R.'], backendId: null },
];

const initialAvailableRooms = [
  { id: 'queue-1', roomNumber: '210', etaMinutes: 25, status: 'Pending', assignedCleaners: [] },
  { id: 'queue-2', roomNumber: '407', etaMinutes: 40, status: 'Pending', assignedCleaners: ['Jon P.'] },
  { id: 'queue-3', roomNumber: '126', etaMinutes: 15, status: 'Pending', assignedCleaners: [] },
];

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

function useAuth() { return useContext(AuthContext); }

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

function useTasks(cleanerName) {
  const [assignedTasks, setAssignedTasks] = useState(initialAssignedTasks);
  const [availableRooms, setAvailableRooms] = useState(initialAvailableRooms);

  const toRoomNumber = (instructionText, fallbackId) => {
    const matchedNumber = instructionText.match(/\b\d{2,4}\b/);
    return matchedNumber ? matchedNumber[0] : fallbackId.slice(-3);
  };

  const toEtaFromPriority = (priority) => {
    if (priority === 'High') return 10;
    if (priority === 'Medium') return 20;
    return 35;
  };

  const refreshFromBackend = async () => {
    try {
      const [inbox, feedback] = await Promise.all([
        apiGet('/api/inbox/workers'),
        apiGet('/api/feedback/task-state/queue/workers'),
      ]);

      const feedbackMap = new Map(
        (feedback.items || []).map((item) => [item.instruction_id, item])
      );

      const allTasks = (inbox.items || []).map((item) => {
        const currentFeedback = feedbackMap.get(item.instruction_id);
        const mappedStatus = currentFeedback?.state || 'Pending';

        return {
          id: item.instruction_id,
          roomNumber: toRoomNumber(item.staff_instruction, item.instruction_id),
          etaMinutes: toEtaFromPriority(item.priority),
          status: mappedStatus,
          assignedCleaners: [cleanerName],
          rawInstruction: item.staff_instruction,
        };
      });

      setAssignedTasks(allTasks.filter((task) => task.status !== 'Pending'));
      setAvailableRooms(
        allTasks
          .filter((task) => task.status === 'Pending')
          .map((task) => ({
            id: task.id,
            roomNumber: task.roomNumber,
            etaMinutes: task.etaMinutes,
            status: task.status,
            assignedCleaners: [],
          }))
      );
    } catch {
      setAssignedTasks(initialAssignedTasks);
      setAvailableRooms(initialAvailableRooms);
    }
  };

  useEffect(() => {
    refreshFromBackend();
    const pollId = window.setInterval(refreshFromBackend, 15000);

    return () => {
      window.clearInterval(pollId);
    };
  }, []);

  const takeTask = ({ queueTaskId }) => {
    setAvailableRooms((prev) => {
      const room = prev.find((r) => r.id === queueTaskId);
      if (!room) return prev;
      setAssignedTasks((tasks) => [...tasks, {
        id: `task-${room.id}`,
        backendId: null,
        roomNumber: room.roomNumber,
        etaMinutes: room.etaMinutes,
        status: 'Pending',
        assignedCleaners: [...room.assignedCleaners, cleanerName],
      }]);
      return prev.filter((r) => r.id !== queueTaskId);
    });
  };

  const updateTaskStatus = ({ taskId, nextStatus }) => {
    setAssignedTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, status: nextStatus } : t));
  };

  return {
    assignedTasks,
    availableRooms,
    takeTask,
    updateTaskStatus,
    refreshFromBackend,
  };
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ToastContainer({ toasts, onDismiss }) {
  return (
    <div className="fixed right-4 top-20 z-50 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
      {toasts.map((t) => (
        <div key={t.id} className={`rounded-xl border px-4 py-3 text-sm shadow-lg ${t.type === 'success' ? 'border-green-200 bg-green-50 text-green-700' : 'border-orange-200 bg-orange-50 text-orange-700'}`}>
          <div className="flex items-center justify-between gap-3">
            <p className="font-medium">{t.message}</p>
            <button type="button" onClick={() => onDismiss(t.id)} className="text-xs font-semibold text-gray-600 transition hover:text-gray-900">Dismiss</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function Navbar({ cleaner, stats, onLogout }) {
  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Cleaner Dashboard</h1>
          <p className="text-sm text-gray-600">{cleaner.name} • {cleaner.role}</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <StatCard label="Total Assigned" value={stats.totalAssigned} />
          <StatCard label="Completed Today" value={stats.completedToday} />
        </div>
        <button type="button" onClick={onLogout} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-blue-500">Logout</button>
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

function AvailabilityToggle({ isAvailable, onToggle }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-lg">
      <div>
        <p className="text-sm font-bold text-gray-900">Availability Status</p>
        <p className="text-xs text-gray-500 mt-0.5">Toggle off when on break — AI won't assign new tasks.</p>
      </div>
      <button
        type="button"
        onClick={onToggle}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isAvailable ? 'bg-green-500' : 'bg-gray-300'}`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${isAvailable ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  );
}

function CooldownTimer({ remainingSeconds, isCoolingDown }) {
  const m = String(Math.floor(remainingSeconds / 60)).padStart(2, '0');
  const s = String(remainingSeconds % 60).padStart(2, '0');
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-lg">
      <h2 className="text-lg font-bold text-gray-900">Task Cooldown</h2>
      <p className={`mt-2 text-2xl font-bold ${isCoolingDown ? 'text-orange-500' : 'text-green-500'}`}>
        {isCoolingDown ? `${m}:${s}` : 'Ready'}
      </p>
      <p className="mt-1 text-sm text-gray-600">{isCoolingDown ? 'Wait before taking new work.' : 'You can take or confirm tasks.'}</p>
    </section>
  );
}

function StatusBadge({ status }) {
  const cls = { Completed: 'border-green-200 bg-green-100 text-green-700', 'In Progress': 'border-yellow-200 bg-yellow-100 text-yellow-700', Pending: 'border-orange-200 bg-orange-100 text-orange-700' };
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${cls[status] || 'border-gray-200 bg-gray-100 text-gray-700'}`}>{status}</span>;
}

function TaskCard({ task, isConfirmDisabled, onConfirm, loadingTaskId }) {
  const isLoading = loadingTaskId === task.id;
  const isAITask = Boolean(task.backendId);

  return (
    <article className={`rounded-xl border p-4 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl ${isAITask ? 'border-violet-200 bg-violet-50' : 'border-gray-200 bg-white'}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-gray-500 flex items-center gap-1">
            Room
            {isAITask && <span className="rounded-full bg-violet-200 px-1.5 py-0.5 text-xs font-bold text-violet-700">AI</span>}
          </p>
          <p className="text-lg font-semibold text-gray-900">#{task.roomNumber}</p>
        </div>
        <StatusBadge status={task.status} />
      </div>
      <div className="mt-3 space-y-1 text-sm text-gray-700">
        <p><span className="font-semibold">ETA:</span> {task.etaMinutes} min</p>
        {task.priority && <p><span className="font-semibold">Priority:</span> {task.priority}</p>}
        {task.staffInstruction && <p><span className="font-semibold">Instructions:</span> {task.staffInstruction}</p>}
        <p><span className="font-semibold">Assigned:</span> {task.assignedCleaners?.join(', ') || 'You'}</p>
      </div>
      <button
        type="button"
        disabled={isConfirmDisabled || task.status === 'Completed' || task.status === 'Done' || isLoading}
        onClick={() => onConfirm(task)}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none"
      >
        {isLoading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-blue-200" />}
        {task.status === 'Completed' || task.status === 'Done' ? 'Completed' : 'Confirm Task'}
      </button>
    </article>
  );
}

function AvailableRoomsList({ rooms, selectedTaskId, onSelect, onTakeTask, disabled, loadingTaskId }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-lg">
      <h2 className="mb-4 text-xl font-bold text-gray-900">Available Rooms Queue</h2>
      <div className="space-y-3">
        {rooms.length === 0 && <div className="rounded-lg border border-dashed border-gray-300 px-3 py-5 text-center text-sm text-gray-500">No rooms waiting.</div>}
        {rooms.map((room) => {
          const isSelected = selectedTaskId === room.id;
          const isLoading = loadingTaskId === room.id;
          return (
            <article key={room.id} className={`rounded-xl border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${isSelected ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-200'}`}>
              <div className="flex items-start justify-between gap-3">
                <div><p className="text-sm text-gray-500">Room</p><p className="text-lg font-semibold text-gray-900">#{room.roomNumber}</p></div>
                <StatusBadge status={room.status} />
              </div>
              <div className="mt-3 space-y-1 text-sm text-gray-700">
                <p><span className="font-semibold">ETA:</span> {room.etaMinutes} min</p>
                <p><span className="font-semibold">Others:</span> {room.assignedCleaners?.join(', ') || 'None'}</p>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button type="button" onClick={() => onSelect(room.id)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50">{isSelected ? 'Selected' : 'Select'}</button>
                <button type="button" disabled={disabled || isLoading} onClick={() => onTakeTask(room.id)} className="flex items-center justify-center gap-2 rounded-lg bg-green-500 px-3 py-2.5 text-sm font-semibold text-white shadow-lg shadow-green-100 transition hover:-translate-y-0.5 hover:bg-green-400 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none">
                  {isLoading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-green-200" />}
                  Assign to Me
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function CleanerDashboard() {
  const { user, logout } = useAuth();
  const { assignedTasks, availableRooms, takeTask, updateTaskStatus, refreshFromBackend } = useTasks(user.name);
  const { remainingSeconds, isCoolingDown, startCooldown } = useCooldown(90);

  const [isAvailable, setIsAvailable] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [loadingTaskId, setLoadingTaskId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [toasts, setToasts] = useState([]);

  const completedToday = useMemo(() => assignedTasks.filter((t) => t.status === 'Completed' || t.status === 'Done').length, [assignedTasks]);
  const stats = useMemo(() => ({ totalAssigned: assignedTasks.length, completedToday }), [assignedTasks.length, completedToday]);

  const pushToast = (message, type = 'success') => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((prev) => [...prev, { id, message, type }]);
    window.setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };
  const dismissToast = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const handleTakeTask = async (queueTaskId) => {
    setErrorMessage('');
    if (isCoolingDown) { pushToast('Cooldown active.', 'error'); return; }
    if (!isAvailable) { pushToast('Set yourself as Available first.', 'error'); return; }
    try {
      setLoadingTaskId(queueTaskId);
      await new Promise((r) => setTimeout(r, 850));
      takeTask({ queueTaskId });
      setSelectedTaskId('');
      pushToast('Task assigned to you.', 'success');
    } catch { pushToast('Failed to assign task.', 'error'); }
    finally { setLoadingTaskId(''); }
  };

  const handleConfirmTask = async (task) => {
    setErrorMessage('');
    if (isCoolingDown) { pushToast('Disabled during cooldown.', 'error'); return; }
    try {
      setLoadingTaskId(task.id);
      await new Promise((r) => setTimeout(r, 900));
      if (task.status === 'Pending') {
        updateTaskStatus({ taskId: task.id, nextStatus: 'In Progress' });
        await apiPost('/api/feedback/task-state', {
          instruction_id: task.id,
          queue_name: 'workers',
          state: 'in_progress',
          note: 'Cleaner started the task.',
        });
        pushToast(`Room ${task.roomNumber} moved to In Progress.`, 'success');
      } else if (task.status === 'In Progress') {
        updateTaskStatus({ taskId: task.id, nextStatus: 'Completed' });
        await apiPost('/api/feedback/task-state', {
          instruction_id: task.id,
          queue_name: 'workers',
          state: 'completed',
          note: 'Cleaning task completed.',
        });
        startCooldown(90);
        pushToast(`Room ${task.roomNumber} completed.`, 'success');
      }

      await refreshFromBackend();
    } catch {
      const message = 'Could not confirm task. Try again.';
      setErrorMessage(message);
      pushToast(message, 'error');
    } finally {
      setLoadingTaskId('');
    }
  };

  const handleLogout = () => { logout?.(); window.location.href = '/login'; };

  return (
    <div className="min-h-screen bg-gray-50 px-4 pb-6 pt-28 font-sans md:px-6">
      <Navbar cleaner={user} stats={stats} onLogout={handleLogout} />

      {/* Profile + Availability */}
      <section className="mb-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-lg">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="grid grid-cols-1 gap-2 text-sm text-gray-700 sm:grid-cols-3">
            <p><span className="font-semibold">Name:</span> {user.name}</p>
            <p><span className="font-semibold">ID:</span> {user.id}</p>
            <p><span className="font-semibold">Status:</span> <span className={isAvailable ? 'text-green-600 font-semibold' : 'text-gray-400 font-semibold'}>{isAvailable ? 'Available' : 'On Break'}</span></p>
          </div>
        </div>
      </section>

      <AvailabilityToggle isAvailable={isAvailable} onToggle={() => setIsAvailable((v) => !v)} />

      <div className="mt-4" />

      {errorMessage && <div className="mb-4 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">{errorMessage}</div>}

      <main className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <AvailableRoomsList
          rooms={availableRooms}
          selectedTaskId={selectedTaskId}
          onSelect={setSelectedTaskId}
          onTakeTask={handleTakeTask}
          disabled={isCoolingDown || !isAvailable}
          loadingTaskId={loadingTaskId}
        />

        <section className="space-y-4">
          <CooldownTimer remainingSeconds={remainingSeconds} isCoolingDown={isCoolingDown} />
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-lg">
            <h2 className="mb-4 text-xl font-bold text-gray-900">Assigned Tasks</h2>
            <div className="space-y-3">
              {assignedTasks.length === 0 && <div className="rounded-lg border border-dashed border-gray-300 px-3 py-5 text-center text-sm text-gray-500">No tasks assigned yet.</div>}
              {assignedTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  isConfirmDisabled={isCoolingDown || !isAvailable}
                  onConfirm={handleConfirmTask}
                  loadingTaskId={loadingTaskId}
                />
              ))}
            </div>
          </section>
        </section>
      </main>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
